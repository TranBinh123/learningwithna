import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSpeechAudioUrl } from '@/lib/speechCache';
import { getVoiceProfile, buildStyleInstruction, type VoiceTone } from '@/lib/voiceProfiles';

const MAX_TEXT_LENGTH = 200;

const sanitizeText = (text: string): string => {
  if (!text) return '';
  const cleanText = text.replace(/<[^>]*>/g, '');
  return cleanText.slice(0, MAX_TEXT_LENGTH);
};

const isAudioFilePath = (value: string): boolean =>
  /\.(mp3|wav|ogg|m4a)$/i.test(value.trim()) && !value.includes(' ');

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

export function useSpeech(voiceId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const currentAudioElRef = useRef<HTMLAudioElement | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      currentAudioElRef.current?.pause();
      currentAudioElRef.current = null;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioElRef.current) {
      currentAudioElRef.current.pause();
      currentAudioElRef.current.currentTime = 0;
      currentAudioElRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const stop = useCallback(() => {
    setIsLoading(false);
    stopCurrentAudio();
  }, [stopCurrentAudio]);

  const playAudioUrl = useCallback(
    (url: string, myRequestId: number): Promise<void> => {
      return new Promise<void>(resolve => {
        if (myRequestId !== requestIdRef.current) {
          resolve();
          return;
        }

        stopCurrentAudio();

        let settled = false;
        const audio = new Audio(url);
        audio.volume = 1.0;
        currentAudioElRef.current = audio;

        const finish = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          if (currentAudioElRef.current === audio) currentAudioElRef.current = null;
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
          console.warn('Không phát được audio:', err);
          finish();
        });
      });
    },
    [stopCurrentAudio]
  );

  const speakWithVoiceId = useCallback(
    async (input: string, selectedVoiceId: string, tone?: VoiceTone) => {
      if (!input) return;

      const myRequestId = ++requestIdRef.current;
      stopCurrentAudio();

      setError(null);
      setIsLoading(true);

      try {
        if (isAudioFilePath(input)) {
          const fullUrl = input.startsWith('/') ? input : `/audios/${input}`;
          await playAudioUrl(fullUrl, myRequestId);
          return;
        }

        const text = sanitizeText(input);
        const profile = getVoiceProfile(selectedVoiceId);
        const styleInstruction = buildStyleInstruction(profile, tone);

        try {
          const audioUrl = await fetchSpeechAudioUrl(text, profile.geminiVoiceName, styleInstruction);
          if (myRequestId !== requestIdRef.current) return;
          await playAudioUrl(audioUrl, myRequestId);
        } catch (err) {
          console.warn('Không tạo được giọng đọc từ máy chủ, dùng giọng đọc trình duyệt thay thế:', err);
          if (myRequestId !== requestIdRef.current) return;
          if (isMounted.current) {
            setError('Chưa kết nối được giọng đọc AI, đang dùng giọng đọc mặc định của máy');
          }
          await speakWithBrowserTTS(text);
        }
      } finally {
        if (isMounted.current && myRequestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [playAudioUrl, stopCurrentAudio]
  );

  const speak = useCallback(
    (input: string, tone?: VoiceTone) => speakWithVoiceId(input, voiceId ?? '', tone),
    [speakWithVoiceId, voiceId]
  );

  const playRandomEncouragement = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * 4) + 1;
    speak(`encouragements/enc_${randomIndex}.mp3`);
  }, [speak]);

  const playRandomPraise = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * 9) + 1;
    speak(`praises/praise_${randomIndex}.mp3`);
  }, [speak]);

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
    speakWithVoiceId,
    playRandomEncouragement,
    playRandomPraise,
    playLessonStep,
    stop,
    isLoading,
    error,
  };
}
