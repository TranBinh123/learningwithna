import { useCallback, useState } from 'react';

export function useSpeech(_voiceId?: string) {
  const [isLoading, setIsLoading] = useState(false);

  const speak = useCallback((text: string) => {
    if (!text) return;
    
    // Kiểm tra xem trình duyệt có hỗ trợ Web Speech API không
    if (!('speechSynthesis' in window)) {
      console.warn('Trình duyệt của bạn không hỗ trợ giọng đọc.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Hủy các giọng đọc đang đọc dở để không bị chồng chéo âm thanh
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN'; // Đặt mặc định là tiếng Việt
      utterance.rate = 0.9; // Tốc độ đọc chậm rãi, phù hợp cho trẻ em (0.5 đến 2)
      utterance.pitch = 1.1; // Tone giọng hơi cao và vui tươi hơn một chút

      // Lấy danh sách giọng đọc có sẵn trong máy để ưu tiên chọn giọng tiếng Việt chuẩn nếu có
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.includes('vi') || v.lang.includes('VI'));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      utterance.onend = () => {
        setIsLoading(false);
      };

      utterance.onerror = (e) => {
        console.error('Lỗi phát giọng đọc từ trình duyệt:', e);
        setIsLoading(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsLoading(false);
    } catch (e) {
      console.error('Lỗi ngoại lệ khi gọi Web Speech API:', e);
      setIsLoading(false);
    }
  }, []);

  return { speak, isLoading };
}
