import { useCallback, useRef, useState } from 'react';
import { fetchSpeechAudioUrl } from '@/lib/speechCache';
import { getVoiceProfile } from '@/lib/voiceProfiles';

export function useSpeech(voiceId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(
    async (text: string) => {
      try {
        setIsLoading(true);
        const voice = getVoiceProfile(voiceId);
        const url = await fetchSpeechAudioUrl(text, voice.geminiVoiceName);

        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        setIsLoading(false);
        await audio.play().catch(() => {
          /* trình duyệt có thể chặn autoplay trước khi bé tương tác lần đầu — bỏ qua lỗi này */
        });
      } catch (e) {
        console.error('Lỗi phát giọng đọc:', e);
        setIsLoading(false);
      }
    },
    [voiceId]
  );

  return { speak, isLoading };
}
