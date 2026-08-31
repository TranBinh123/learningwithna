import { useCallback, useEffect, useRef, useState } from 'react';

// Hằng số
const MAX_TEXT_LENGTH = 200;
const BACKGROUND_MUSIC_URL = '/bg-music.mp3'; // Đã khớp đúng tên file nhạc bạn tải lên
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

  // Bật/tắt nhạc nền (đã fix lỗi bị chồng chéo bản nhạc trên Tablet)
  const toggleBackground = useCallback(() => {
    if (!bgAudioRef.current) return;

    if (isBackgroundPlaying) {
      // Nếu đang phát -> Dừng hẳn và đưa về mốc thời gian 0
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
      setIsBackgroundPlaying(false);
    } else {
      // Nếu đang tắt -> Đảm bảo dừng mọi thứ trước khi cho chạy mới
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
      
      bgAudioRef.current.play().then(() => {
        setIsBackgroundPlaying(true);
      }).catch(err => {
        console.warn('Không thể phát nhạc nền:', err);
        setIsBackgroundPlaying(false);
      });
    }
  }, [isBackgroundPlaying]);
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

  // Hàm speak chính sử dụng Web Speech API chuẩn của trình duyệt
  const speak = useCallback(async (text: string) => {
    // 1. Unlock audio trước
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
      // --- Bắt đầu phát nhạc nền (nếu chưa phát) ---
      if (bgAudioRef.current && bgAudioRef.current.paused) {
        try {
          await bgAudioRef.current.play();
          setIsBackgroundPlaying(true);
        } catch (bgErr) {
          console.warn('Không thể phát nhạc nền:', bgErr);
        }
      }

      if (!('speechSynthesis' in window)) {
        throw new Error('Trình duyệt không hỗ trợ phát âm thanh');
      }

      // Hủy các lệnh đọc đang xếp hàng trước đó
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9; // Tốc độ đọc chậm rãi, rõ ràng cho bé

      // Cố gắng tìm giọng tiếng Việt chính xác của hệ thống
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang === 'vi-VN' || v.lang.startsWith('vi'));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      await new Promise((resolve, reject) => {
        utterance.onend = () => {
          if (isMounted.current) {
            setIsLoading(false);
            resolve(true);
          }
        };

        utterance.onerror = (e) => {
          if (isMounted.current) {
            setIsLoading(false);
            reject(e);
          }
        };

        window.speechSynthesis.speak(utterance);
      });

    } catch (e) {
      console.error('Không thể phát giọng đọc:', e);
      if (isMounted.current) {
        setIsLoading(false);
        setError('Không thể phát âm thanh');
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
