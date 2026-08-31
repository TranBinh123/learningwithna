import { useCallback, useRef, useState } from 'react';
import { fetchSpeechAudioUrl } from '@/lib/speechCache';
import { getVoiceProfile } from '@/lib/voiceProfiles';

export function useSpeech(voiceId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(
    async (text: string) => {
      if (!text) return;
      try {
        setIsLoading(true);
        const voice = getVoiceProfile(voiceId);
        
        console.log('Đang gọi giọng đọc cho:', text, 'với voice:', voice?.geminiVoiceName);
        const url = await fetchSpeechAudioUrl(text, voice?.geminiVoiceName || 'Puck');

        if (!url) {
          console.error('Không nhận được URL âm thanh từ dịch vụ.');
          setIsLoading(false);
          return;
        }

        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        const audio = new Audio(url);
        audioRef.current = audio;
        
        setIsLoading(false);
        
        // Thêm bắt lỗi chi tiết để xem trình duyệt có chặn autoplay hay không
        await audio.play().catch((err) => {
          console.warn('Trình duyệt có thể đã chặn phát âm thanh tự động:', err);
        });
      } catch (e) {
        console.error('Lỗi chi tiết khi phát giọng đọc:', e);
        setIsLoading(false);
      }
    },
    [voiceId]
  );

  return { speak, isLoading };
}
