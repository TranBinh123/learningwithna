import { useCallback, useEffect, useRef, useState } from 'react';

export function useSpeech(_voiceId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMounted = useRef(true);

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

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsLoading(false);
    }
  }, []);

  // Hàm speak chính tương thích với các component cũ (nhận vào đường dẫn file hoặc tên file)
  const speak = useCallback(async (audioPath: string) => {
    if (!audioPath) return;

    setError(null);
    setIsLoading(true);

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Nếu path chưa có dấu / hoặc chưa có thư mục, tự động gán vào /audios/
      const fullUrl = audioPath.startsWith('/') ? audioPath : `/audios/${audioPath}`;
      const audio = new Audio(fullUrl);
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
      console.error('Không thể phát file âm thanh:', err);
      if (isMounted.current) {
        setIsLoading(false);
        setError('Không thể phát âm thanh');
      }
    }
  }, []);

  // 1. Phát ngẫu nhiên lời động viên (4 file: enc_1 đến enc_4)
  const playRandomEncouragement = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * 4) + 1;
    speak(`encouragements/enc_${randomIndex}.mp3`);
  }, [speak]);

  // 2. Phát ngẫu nhiên lời khen ngợi chung (9 file: praise_1 đến praise_9)
  const playRandomPraise = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * 9) + 1;
    speak(`praises/praise_${randomIndex}.mp3`);
  }, [speak]);

  // 3. Phát âm thanh theo bước bài học (Ví dụ: lesson 1, bước 1.3, loại 'normal' | 'again' | 'praise')
  const playLessonStep = useCallback((lessonNum: number, step: string, type: 'normal' | 'again' | 'praise' = 'normal') => {
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
  }, [speak]);

  return {
    speak, // Giữ lại hàm speak để các màn hình cũ gọi bình thường không bị lỗi TypeScript
    playRandomEncouragement,
    playRandomPraise,
    playLessonStep,
    stop,
    isLoading,
    error,
  };
}
