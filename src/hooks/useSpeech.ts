import { useCallback, useState } from 'react';

export function useSpeech(_voiceId?: string) {
  const [isLoading, setIsLoading] = useState(false);

  const speak = useCallback((text: string) => {
    if (!text) return;
    
    if (!('speechSynthesis' in window)) {
      console.warn('Trình duyệt của bạn không hỗ trợ giọng đọc.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Hủy các giọng đọc đang đọc dở
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN'; // Ép buộc nhận diện ngôn ngữ tiếng Việt
      utterance.rate = 0.85; // Giảm tốc độ xuống một chút để bé nghe rõ từng từ
      utterance.pitch = 1.1; // Tone giọng tươi vui

      // Hàm tìm và chọn chính xác giọng tiếng Việt
      const setVietnameseVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        // Lọc các giọng có chứa mã vi, vietnamese hoặc vi-VN
        const viVoice = voices.find(
          (v) => v.lang.toLowerCase().includes('vi') || v.name.toLowerCase().includes('vietnamese')
        );
        if (viVoice) {
          utterance.voice = viVoice;
        }
        
        window.speechSynthesis.speak(utterance);
        setIsLoading(false);
      };

      // Trình duyệt đôi khi mất chút thời gian để load danh sách voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVietnameseVoice();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          setVietnameseVoice();
          window.speechSynthesis.onvoiceschanged = null; // Reset sự kiện sau khi chạy xong
        };
        // Fallback nếu sự kiện onvoiceschanged không gọi
        setTimeout(() => {
          if (isLoading) {
            window.speechSynthesis.speak(utterance);
            setIsLoading(false);
          }
        }, 300);
      }

    } catch (e) {
      console.error('Lỗi ngoại lệ khi gọi Web Speech API:', e);
      setIsLoading(false);
    }
  }, [isLoading]);

  return { speak, isLoading };
}
