import { buildLesson } from '../lessonBuilder';
import { DEFAULT_VOICE_ID } from '../../lib/voiceProfiles';

// ============================================================================
// BÀI 01: BÉ VÀ NHỮNG SẮC MÀU (4-5 tuổi)
// Nội dung giữ nguyên theo tài liệu gốc — không tự ý thêm/bớt kiến thức.
// ============================================================================

export const colorsLesson01 = buildLesson({
  id: 'colors-01',
  ageGroup: '4-5',
  title: 'Bé và những sắc màu',
  emoji: '🌈',
  defaultVoiceId: DEFAULT_VOICE_ID,
  introNarration: 'Chào bé! Hôm nay chúng mình cùng khám phá những sắc màu thật đẹp nhé!',
  concepts: [
    {
      id: 'red',
      name: 'Đỏ',
      hex: '#EF4444',
      emoji: '🍎',
      narrationIntro: 'Đây là màu đỏ',
      narrationOnTap: 'Táo màu đỏ đấy!',
    },
    {
      id: 'yellow',
      name: 'Vàng',
      hex: '#FACC15',
      emoji: '☀️',
      narrationIntro: 'Đây là màu vàng',
      narrationOnTap: 'Mặt trời màu vàng đấy!',
    },
    {
      id: 'blue',
      name: 'Xanh dương',
      hex: '#3B82F6',
      emoji: '☁️',
      narrationIntro: 'Đây là màu xanh dương',
      narrationOnTap: 'Bầu trời màu xanh dương đấy!',
    },
  ],
  quizPrompts: [
    { narrationPrompt: 'Quả táo màu gì nào?', visualEmoji: '🍎', correctConceptId: 'red' },
    { narrationPrompt: 'Con hãy chạm vào màu vàng nhé!', correctConceptId: 'yellow' },
    { narrationPrompt: 'Bầu trời có màu gì?', visualEmoji: '☁️', correctConceptId: 'blue' },
  ],
  reviewPrompt: {
    narrationPrompt: 'Đâu là màu đỏ?',
    targetConceptId: 'red',
  },
  offScreenActivity:
    'Ba mẹ ơi, hãy cùng bé đi quanh nhà tìm 1 đồ vật màu đỏ, 1 đồ vật màu vàng và 1 đồ vật màu xanh dương nhé!',
});
