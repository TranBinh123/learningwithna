export interface VoiceProfile {
  id: string;
  label: string;
  geminiVoiceName: string;
  gender: 'female' | 'male';
  persona: string;
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'voice-1',
    label: 'Giọng Cô Mai',
    geminiVoiceName: 'Kore',
    gender: 'female',
    persona: 'một cô giáo mầm non miền Bắc, giọng ấm áp, dịu dàng, kiên nhẫn',
  },
  {
    id: 'voice-2',
    label: 'Giọng Chú Nam',
    geminiVoiceName: 'Charon',
    gender: 'male',
    persona: 'một người chú vui tính, giọng trầm ấm, thân thiện, chắc chắn',
  },
  {
    id: 'voice-3',
    label: 'Giọng Chị Lan',
    geminiVoiceName: 'Leda',
    gender: 'female',
    persona: 'một người chị gái trẻ trung, giọng trong trẻo, vui vẻ, năng động',
  },
  {
    id: 'voice-4',
    label: 'Giọng Anh Minh',
    geminiVoiceName: 'Puck',
    gender: 'male',
    persona: 'một người anh trai hoạt bát, giọng sôi nổi, hào hứng, tràn năng lượng',
  },
];

export const DEFAULT_VOICE_ID = VOICE_PROFILES[0].id;

export function getVoiceProfile(id: string): VoiceProfile {
  return VOICE_PROFILES.find(v => v.id === id) ?? VOICE_PROFILES[0];
}

export type VoiceTone = 'happy' | 'gentle' | 'cheerful' | 'friendly' | 'celebratory' | 'calm';

const TONE_INSTRUCTIONS: Record<VoiceTone, string> = {
  happy:
    'với giọng vui tươi, hớn hở, khích lệ, như đang vui mừng cùng bé vì bé vừa trả lời đúng',
  gentle:
    'với giọng nhẹ nhàng, trìu mến, kiên nhẫn, động viên bé thử lại — tuyệt đối không được nghe có vẻ thất vọng, chê trách hay nghiêm khắc',
  cheerful: 'với giọng háo hức, thân thiện, gợi tò mò, như đang rủ bé cùng khám phá điều thú vị',
  friendly: 'với giọng thân thiện, ấm áp, nhẹ nhàng hướng dẫn bé',
  celebratory: 'với giọng tự hào, vui mừng, chúc mừng bé thật lớn',
  calm: 'với giọng bình tĩnh, trấn an, nhẹ nhàng',
};

export function buildStyleInstruction(profile: VoiceProfile, tone: VoiceTone = 'friendly'): string {
  const toneText = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.friendly;
  return (
    `Đọc câu sau bằng tiếng Việt chuẩn, phát âm tự nhiên như người Việt bản xứ, ` +
    `tuyệt đối không dùng giọng nước ngoài hay giọng đọc tin tức. ` +
    `Nhập vai ${profile.persona}, nói chuyện với một em bé, ${toneText}.`
  );
}
