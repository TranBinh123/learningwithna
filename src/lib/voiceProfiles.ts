export interface VoiceProfile {
  id: string;
  label: string; // hiển thị trong khu quản lý phụ huynh
  geminiVoiceName: string;
}

// 4 giọng mặc định — nghe thử ở khu phụ huynh, đổi geminiVoiceName nếu muốn giọng khác.
export const VOICE_PROFILES: VoiceProfile[] = [
  { id: 'voice-1', label: 'Giọng Cô Mai', geminiVoiceName: 'Kore' },
  { id: 'voice-2', label: 'Giọng Chú Nam', geminiVoiceName: 'Charon' },
  { id: 'voice-3', label: 'Giọng Chị Lan', geminiVoiceName: 'Leda' },
  { id: 'voice-4', label: 'Giọng Anh Minh', geminiVoiceName: 'Puck' },
];

export const DEFAULT_VOICE_ID = VOICE_PROFILES[0].id;

export function getVoiceProfile(id: string): VoiceProfile {
  return VOICE_PROFILES.find(v => v.id === id) ?? VOICE_PROFILES[0];
}
