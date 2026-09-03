import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_TEXT_LENGTH = 200;
const AUTOPLAY_DELAY = 100; // Delay để bypass autoplay block

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
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 1;

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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Hàm speak chính — phát file âm thanh từ public/audios/
  const speak = useCallback(async (audioPath: string) => {
    if (!audioPath) return;

    setError(null);
    setIsLoading(true);
    retryCountRef.current = 0;

    const attemptPlay = async (attempt: number = 0): Promise<void> => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current = null;
        }

        // Tự động gán đường dẫn đầy đủ
        const fullUrl = audioPath.startsWith('/') ? audioPath : `/audios/${audioPath}`;
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        audio.volume = 1.0;
        audio.src = fullUrl;

        audioRef.current = audio;

        return new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            if (isMounted.current) {
              setError('Quá thời gian tải audio');
              setIsLoading(false);
              reject(new Error('Timeout'));
            }
          }, 8000);

          audio.oncanplay = () => {
            // Có thể phát được, nhưng chưa phát ngay
          };

          audio.onended = () => {
            clearTimeout(timeoutId);
            if (isMounted.current) {
              setIsLoading(false);
              resolve();
            }
          };

          audio.onerror = (e) => {
            clearTimeout(timeoutId);
            if (isMounted.current) {
              const errorMsg = e instanceof Error ? e.message : 'Lỗi tải audio';
              setError(`Không thể tải: ${errorMsg}`);
              setIsLoading(false);
            }
            reject(e);
          };

          // Delay phát để autoplay policy không chặn
          const playTimeoutId = setTimeout(() => {
            audio
              .play()
              .then(() => {
                clearTimeout(playTimeoutId);
                // Phát thành công
              })
              .catch((playError) => {
                clearTimeout(playTimeoutId);
                clearTimeout(timeoutId);

                // Kiểm tra nếu là NotAllowedError (autoplay bị chặn)
                if (playError.name === 'NotAllowedError') {
                  console.log('Autoplay bị chặn, fallback sang Speech Synthesis');

                  // Fallback: dùng Web Speech Synthesis API
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const text = audioPath;

                    // Nếu audioPath là file path, bỏ qua speech synthesis
                    if (audioPath.includes('/')) {
                      // Đây là file path, không phải text
                      if (isMounted.current) {
                        setError('Trình duyệt chặn audio, vui lòng tương tác trước');
                        setIsLoading(false);
                      }
                      resolve(); // Không reject, để bé vẫn chơi được
                    } else {
                      // Đây có thể là text
                      const utterance = new SpeechSynthesisUtterance(text);
                      utterance.lang = 'vi-VN';
                      utterance.rate = 0.9;
                      utterance.pitch = 1.0;
                      utterance.volume = 1.0;

                      utterance.onend = () => {
                        if (isMounted.current) {
                          setIsLoading(false);
                          resolve();
                        }
                      };

                      utterance.onerror = (err) => {
                        console.error('Speech Synthesis error:', err);
                        if (isMounted.current) {
                          setIsLoading(false);
                        }
                        resolve();
                      };

                      window.speechSynthesis.speak(utterance);
                    }
                  } else {
                    if (isMounted.current) {
                      setError('Trình duyệt không hỗ trợ giọng đọc');
                      setIsLoading(false);
                    }
                    resolve();
                  }
                } else if (attempt < MAX_RETRIES) {
                  // Thử lại với delay tăng
                  console.log(`Retry lần ${attempt + 1}...`);
                  retryCountRef.current++;
                  setTimeout(() => attemptPlay(attempt + 1), 500 + attempt * 500);
                } else {
                  // Tất cả retry đã hết
                  if (isMounted.current) {
                    setError(`Lỗi phát: ${playError.message}`);
                    setIsLoading(false);
                  }
                  reject(playError);
                }
              });
          }, AUTOPLAY_DELAY);
        });
      } catch (e) {
        console.error('Lỗi phát audio:', e);
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    try {
      await attemptPlay();
    } catch (e) {
      console.error('Không thể phát sau retry:', e);
      // Không throw, để app tiếp tục
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

  // 3. Phát âm thanh theo bước bài học
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
