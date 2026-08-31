import { useCallback, useEffect, useRef, useState } from 'react';

// Hằng số
const MAX_TEXT_LENGTH = 200;
const BACKGROUND_MUSIC_URL = '/bg-music.mp3';
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
        bgAudioRef.current = null;
      }
    };
  }, []);

  // Hàm unlock audio context
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

  // Bật/tắt nhạc nền
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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Hàm speak kết hợp linh hoạt giữa Google TTS và Web Speech dự phòng
  const speak = useCallback(async (text: string) => {
    await unlockAudio();

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

    // Bật nhạc nền nếu đang tắt
    if (bgAudioRef.current && bgAudioRef.current.paused) {
      bgAudioRef.current.play().catch(() => {});
      setIsBackgroundPlaying(true);
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Thử dùng Google TTS trước (giọng chuẩn đang chạy rất tốt trên điện thoại)
      const encodedText = encodeURIComponent(cleanText);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=vi&client=tw-ob`;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      await new Promise((resolve, reject) => {
        audio.onended = () => {
          if (isMounted.current) {
            setIsLoading(false);
            resolve(true);
          }
        };

        audio.onerror = (e) => {
          reject(e); // Nếu thiết bị (như PC/Tablet) chặn Google TTS, sẽ nhảy xuống catch bên dưới
        };

        audio.play().catch((err) => {
          reject(err);
        });
      });

    } catch (err) {
      // --- PHƯƠNG ÁN DỰ PHÒNG CHO PC & TABLET ---
      // Nếu Google TTS bị chặn trên máy tính/tablet, dùng Web Speech API kết hợp gán mã ngôn ngữ tiếng Việt
      console.warn('Chuyển sang giọng đọc dự phòng của thiết bị:', err);
      
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = 'vi-VN';
          
          // Thử tìm giọng có chứa ký tự tiếng việt hoặc phân vùng vi
          const voices = window.speechSynthesis.getVoices();
          const viVoice = voices.find(v => v.lang.toLowerCase().includes('vi'));
          if (viVoice) {
            utterance.voice = viVoice;
          }

          await new Promise((resolve) => {
            utterance.onend = () => {
              if (isMounted.current) {
                setIsLoading(false);
                resolve(true);
              }
            };
            utterance.onerror = () => {
              if (isMounted.current) {
                setIsLoading(false);
                resolve(false);
              }
            };
            window.speechSynthesis.speak(utterance);
          });
          return;
        }
      } catch (fallbackErr) {
        console.error('Lỗi fallback:', fallbackErr);
      }

      if (isMounted.current) {
        setIsLoading(false);
        setError('Không thể phát âm thanh trên thiết bị này');
      }
    }
  }, [unlockAudio]);

  return {
    speak,
    stop,
    toggleBackground,
    isLoading,
    error,
    isBackgroundPlaying,
  };
}
