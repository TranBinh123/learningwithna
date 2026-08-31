import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_TEXT_LENGTH = 200;

const sanitizeText = (text: string): string => {
  if (!text) return '';
  const cleanText = text.replace(/<[^>]*>/g, '');
  return cleanText.slice(0, MAX_TEXT_LENGTH);
};

export function useSpeech(_voiceId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMounted = useRef(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

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

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsLoading(false);
    }
  }, []);

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

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

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
          reject(e);
        };

        audio.play().catch((err) => {
          reject(err);
        });
      });

    } catch (err) {
      console.error('Không thể phát giọng đọc:', err);
      if (isMounted.current) {
        setIsLoading(false);
        setError('Không thể phát âm thanh');
      }
    }
  }, [unlockAudio]);

  return {
    speak,
    stop,
    isLoading,
    error,
  };
}
