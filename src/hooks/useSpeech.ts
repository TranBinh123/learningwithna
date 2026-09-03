import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSpeechAudioUrl } from '@/lib/speechCache';
import { getVoiceProfile } from '@/lib/voiceProfiles';

const MAX_TEXT_LENGTH = 200;

const sanitizeText = (text: string): string => {
  if (!text) return '';
  const cleanText = text.replace(/<[^>]*>/g, '');
  return cleanText.slice(0, MAX_TEXT_LENGTH);
};

// Phân biệt: đây là đường dẫn tới 1 file âm thanh có sẵn trong public/audios/
// (vd: "encouragements/enc_1.mp3", "/audios/lessons/lesson_1/1.1.wav"), hay
// là 1 câu văn tiếng Việt cần đọc bằng giọng nói (Gemini TTS)?
const isAudioFilePath = (value: string): boolean =>
  /\.(mp3|wav|ogg|m4a)$/i.test(value.trim()) && !value.includes(' ');

// Đọc 1 câu bằng giọng đọc có sẵn của trình duyệt — dùng khi API TTS lỗi
// hoặc chưa cấu hình, để bé vẫn nghe được thay vì app im lặng/đứng hình.
// Không bao giờ reject — luôn resolve dù thành công hay thất bại.
function speakWithBrowserTTS(text: string): Promise<void> {
  return new Promise<void>(resolve => {
    if (!('speechSynthesis' in window) || !text) {
      resolve();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Giọng đọc trình duyệt không khả dụng:', err);
      resolve();
    }
  });
}

// Phát 1 URL âm thanh (file tĩnh hoặc blob URL từ TTS), có timeout bảo vệ.
// Không bao giờ reject — luôn resolve dù thành công hay thất bại, để không
// bao giờ tạo ra unhandled promise rejection ở nơi gọi.
function playAudioUrl(url: string): Promise<void> {
  return new Promise<void>(resolve => {
    let settled = false;
    const audio = new Audio(url);
    audio.volume = 1.0;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve();
    };

    const timeoutId = setTimeout(() => {
      console.warn('Quá thời gian tải/phát âm thanh:', url);
      finish();
    }, 8000);

    audio.onended = finish;
    audio.onerror = () => {
      console.warn('Không tải được âm thanh:', url);
      finish();
    };

    audio.play().catch(err => {
      // Thường gặp nhất: NotAllowedError do chính sách autoplay của trình duyệt
      console.warn('Không phát được audio:', err);
      finish();
    });
  });
}

export function useSpeech(voiceId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const stop = useCallback(() => {
    setIsLoading(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Hàm speak chính.
  // - Nếu input là 1 đường dẫn file âm thanh có sẵn -> phát file đó.
  // - Nếu input là 1 câu văn -> gọi API Gemini TTS (có cache), lỗi thì fallback
  //   sang giọng đọc trình duyệt. Luôn luôn resolve, không bao giờ throw ra
  //   ngoài, nên nơi gọi không cần .catch().
  const speak = useCallback(
    async (input: string) => {
      if (!input) return;

      setError(null);
      setIsLoading(true);

      try {
        if (isAudioFilePath(input)) {
          const fullUrl = input.startsWith('/') ? input : `/audios/${input}`;
          await playAudioUrl(fullUrl);
          return;
        }

        const text = sanitizeText(input);
        const voiceName = getVoiceProfile(voiceId ?? '').geminiVoiceName;

        try {
          const audioUrl = await fetchSpeechAudioUrl(text, voiceName);
          await playAudioUrl(audioUrl);
        } catch (err) {
          console.warn('Không tạo được giọng đọc từ máy chủ, dùng giọng đọc trình duyệt thay thế:', err);
          if (isMounted.current) {
            setError('Chưa kết nối được giọng đọc AI, đang dùng giọng đọc mặc định của máy');
          }
          await speakWithBrowserTTS(text);
        }
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    },
    [voiceId]
  );

  // Phát ngẫu nhiên lời động viên (4 file: enc_1 đến enc_4)
  const playRandomEncouragement = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * 4) + 1;
    speak(`encouragements/enc_${randomIndex}.mp3`);
  }, [speak]);

  // Phát ngẫu nhiên lời khen ngợi chung (9 file: praise_1 đến praise_9)
  const playRandomPraise = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * 9) + 1;
    speak(`praises/praise_${randomIndex}.mp3`);
  }, [speak]);

  // Phát âm thanh theo bước bài học (file tĩnh có sẵn trong public/audios/lessons/)
  const playLessonStep = useCallback(
    (lessonNum: number, step: string, type: 'normal' | 'again' | 'praise' = 'normal') => {
      let fileName = '';
      const folder = `lessons/lesson_${lessonNum}`;

      if (type === 'again') {
        fileName = `${step}_again.mp3`;
      } else if (type === 'praise') {
        fileName = `${step}_praise.mp3`;
      } else {
        fileName = `${step}.wav`;
      }

      speak(`${folder}/${fileName}`);
    },
    [speak]
  );

  return {
    speak,
    playRandomEncouragement,
    playRandomPraise,
    playLessonStep,
    stop,
    isLoading,
    error,
  };
}
