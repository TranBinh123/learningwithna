import { useCallback, useEffect, useRef, useState } from 'react';

// 1. Thêm validate và giới hạn text
const MAX_TEXT_LENGTH = 200;
const sanitizeText = (text: string): string => {
  if (!text) return '';
  // Loại bỏ HTML tags
  const cleanText = text.replace(/<[^>]*>/g, '');
  // Giới hạn độ dài
  return cleanText.slice(0, MAX_TEXT_LENGTH);
};

export function useSpeech(_voiceId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMounted = useRef(true);

  // 2. Cleanup khi unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Cleanup audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const speak = useCallback(async (text: string) => {
    // 3. Validate input kỹ hơn
    const cleanText = sanitizeText(text);
    
    if (!cleanText) {
      setError('Văn bản trống hoặc không hợp lệ');
      return;
    }

    // 4. Kiểm tra giới hạn
    if (cleanText.length > MAX_TEXT_LENGTH) {
      setError(`Văn bản quá dài (tối đa ${MAX_TEXT_LENGTH} ký tự)`);
      return;
    }

    // 5. Reset error
    setError(null);

    try {
      setIsLoading(true);

      // Dừng audio cũ
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const encodedText = encodeURIComponent(cleanText);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=vi&client=tw-ob`;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // 6. Promise wrapper để xử lý autoplay
      const playPromise = new Promise((resolve, reject) => {
        audio.onended = () => {
          if (isMounted.current) {
            setIsLoading(false);
            resolve(true);
          }
        };

        audio.onerror = (e) => {
          if (isMounted.current) {
            // 7. Xử lý lỗi chi tiết hơn
            const errorMsg = e instanceof Error ? e.message : 'Lỗi phát audio';
            setError(`Không thể phát: ${errorMsg}`);
            setIsLoading(false);
            reject(e);
          }
        };

        // 8. Try catch cho play()
        audio.play()
          .then(() => {
            // Không set isLoading false ở đây, đợi onended
          })
          .catch((playError) => {
            // 9. Xử lý lỗi autoplay
            if (playError.name === 'NotAllowedError') {
              setError('Trình duyệt chặn tự động phát. Vui lòng tương tác trước.');
            } else {
              setError(`Lỗi phát: ${playError.message}`);
            }
            setIsLoading(false);
            reject(playError);
          });
      });

      // 10. Timeout cho loading
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
        // 11. Fallback: sử dụng Speech Synthesis API
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'vi-VN';
          window.speechSynthesis.speak(utterance);
        }
      }
    }
  }, []);

  // 12. Thêm hàm stop
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsLoading(false);
    }
  }, []);

  return { 
    speak, 
    stop, 
    isLoading, 
    error  // Thêm error state để UI hiển thị
  };
}
