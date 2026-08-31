import { useCallback, useEffect, useRef, useState } from 'react';

// Hằng số
const MAX_TEXT_LENGTH = 200;
const BACKGROUND_MUSIC_URL = '/background-music.mp3'; // Đặt file nhạc của bạn
const BACKGROUND_VOLUME = 0.15;

const sanitizeText = (text: string): string => {
  if (!text) return '';
  const cleanText = text.replace(/<[^>]*>/g, '');
  return cleanText.slice(0, MAX_TEXT_LENGTH);
};

export function useSpeech(_voiceId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackgroundPlaying, setIsBackgroundPlaying] = useState(false);

  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMounted = useRef(true);

  // AudioContext để unlock autoplay
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Khởi tạo background audio (chỉ 1 lần)
  useEffect(() => {
    const bgAudio = new Audio(BACKGROUND_MUSIC_URL);
    bgAudio.loop = true;
    bgAudio.volume = BACKGROUND_VOLUME;
    bgAudio.preload = 'auto';
    bgAudioRef.current = bgAudio;

    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current.src = '';
        bgAudioRef.current = null;
      }
    };
  }, []);

  // Cleanup chung
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current.src = '';
        bgAudioRef.current = null; // Đã sửa gán '' thành null cho đúng kiểu dữ liệu
      }
    };
  }, []);

  // Hàm unlock audio context (gọi khi user click)
  const unlockAudio = useCallback(async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
    } catch (err) {
      console.warn('Không thể resume AudioContext:', err);
    }
  }, []);

  // Bật/tắt nhạc nền (có thể gọi từ UI)
  const toggleBackground = useCallback(() => {
    if (!bgAudioRef.current) return;
    if (bgAudioRef.current.paused) {
      bgAudioRef.current.play().catch(err => {
        console.warn('Không thể phát nhạc nền:', err);
      });
      setIsBackgroundPlaying(true);
    } else {
      bgAudioRef.current.pause();
      setIsBackgroundPlaying(false);
    }
  }, []);

  // Dừng tất cả âm thanh
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsLoading(false);
    }
  }, []);

  // Hàm speak chính
  const speak = useCallback(async (text: string) => {
    // 1. Unlock audio trước (nếu chưa)
    await unlockAudio();

    // 2. Validate text
    const cleanText = sanitizeText(text);
    if (!cleanText) {
      setError('Văn bản trống hoặc không hợp lệ');
      return;
    }
    if (cleanText.length > MAX_TEXT_LENGTH) {
      setError(`Văn bản quá dài (tối đa ${MAX_TEXT_LENGTH} ký tự)`);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Dừng audio cũ
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Tạo URL Google TTS
      const encodedText = encodeURIComponent(cleanText);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=vi&client=tw-ob`;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // --- Bắt đầu phát nhạc nền (nếu chưa phát) ---
      if (bgAudioRef.current && bgAudioRef.current.paused) {
        try {
          await bgAudioRef.current.play();
          setIsBackgroundPlaying(true);
        } catch (bgErr) {
          console.warn('Không thể phát nhạc nền:', bgErr);
        }
      }

      // --- Promise cho audio TTS ---
      const playPromise = new Promise((resolve, reject) => {
        audio.onended = () => {
          if (isMounted.current) {
            setIsLoading(false);
            resolve(true);
          }
        };

        audio.onerror = (e) => {
          if (isMounted.current) {
            const errorMsg = e instanceof Error ? e.message : 'Lỗi phát audio';
            setError(`Không thể phát: ${errorMsg}`);
            setIsLoading(false);
            reject(e);
          }
        };

        audio.play()
          .then(() => {
            // play thành công, chờ onended
          })
          .catch((playError) => {
            if (playError.name === 'NotAllowedError') {
              setError('Trình duyệt chặn tự động phát. Vui lòng nhấn vào nút "Đọc" một lần nữa.');
            } else {
              setError(`Lỗi phát: ${playError.message}`);
            }
            setIsLoading(false);
            reject(playError);
          });
      });

      // Timeout 10s
      const timeoutId = setTimeout(() => {
        if (isMounted.current && isLoading) {
          setError('Quá thời gian tải audio');
          setIsLoading(false);
        }
      }, 10000);

      await playPromise;
      clearTimeout(timeoutId);

    } catch (e) {
      console.error('Không thể phát giọng đọc:', e);
      if (isMounted.current) {
        setIsLoading(false);
        // Fallback: Web Speech API
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = 'vi-VN';
          const voices = window.speechSynthesis.getVoices();
          const viVoice = voices.find(v => v.lang === 'vi-VN');
          if (viVoice) utterance.voice = viVoice;
          window.speechSynthesis.speak(utterance);
        }
      }
    }
  }, [unlockAudio, isLoading]);

  return {
    speak,
    stop,
    toggleBackground,
    isLoading,
    error,
    isBackgroundPlaying,
  };
}
