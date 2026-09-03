import { buildLesson } from '../lessonBuilder';
import { DEFAULT_VOICE_ID } from '../../lib/voiceProfiles';

// ============================================================================
// BÀI 02: ĐI TÌM HÌNH BẠN THÂN
// Độ tuổi: 4-5 tuổi
//
// Mục tiêu:
// - Nhận biết và gọi tên hình tròn, hình vuông.
// - Phân biệt: hình tròn không có góc; hình vuông có 4 cạnh và 4 góc.
// - Liên hệ hình dạng với đồ vật quen thuộc.
// - Phân loại đồ vật theo hình dạng.
// ============================================================================

export const shapesLesson02 = buildLesson({
  id: 'shapes-02',
  ageGroup: '4-5',
  title: 'Đi tìm hình bạn thân',
  emoji: '🔵',
  defaultVoiceId: DEFAULT_VOICE_ID,

  introNarration:
    'Hôm nay mình cùng đi tìm những người bạn hình khối nhé! Bé Thỏ đã sẵn sàng rồi đây!',

  concepts: [
    {
      id: 'circle',
      name: 'Hình tròn',
      hex: '#FB923C',
      emoji: '🔵',
      narrationIntro:
        'Đây là hình tròn, con nhìn xem nó tròn trịa, không có góc nào cả!',
      narrationOnTap:
        'Hình tròn không có góc. Quả bóng và bánh xe cũng có dạng hình tròn đấy!',
    },
    {
      id: 'square',
      name: 'Hình vuông',
      hex: '#4ADE80',
      emoji: '🟩',
      narrationIntro:
        'Ồ, hình này có 4 cạnh bằng nhau và 4 góc — đây là hình vuông!',
      narrationOnTap:
        'Hình vuông có 4 cạnh bằng nhau và 4 góc. Ô cửa sổ và viên gạch có thể có dạng hình vuông đấy!',
    },
  ],

  compareScene: {
    narrationPrompt:
      'Hình nào có góc, hình nào không có góc nhỉ? Con thử chạm vào một hình xem nào!',
    followUp: {
      circle:
        'Đúng rồi! Hình tròn không có góc nào cả, tròn trịa thật đáng yêu!',
      square:
        'Chính xác! Hình vuông có 4 góc và 4 cạnh bằng nhau đấy!',
    },
  },

  quizPrompts: [
    {
      narrationPrompt: 'Quả bóng có hình gì nào?',
      visualEmoji: '⚽',
      correctConceptId: 'circle',
    },
    {
      narrationPrompt: 'Con hãy chạm vào hình vuông nhé!',
      visualEmoji: '🟩',
      correctConceptId: 'square',
    },
    {
      narrationPrompt: 'Đâu là những đồ vật hình tròn?',
      visualEmoji: '⚽ 🛞',
      correctConceptId: 'circle',
      multiSelect: true,
      multiSelectCount: 2,
      classificationItems: [
        {
          id: 'ball',
          label: 'Quả bóng',
          emoji: '⚽',
          shapeId: 'circle',
        },
        {
          id: 'wheel',
          label: 'Bánh xe',
          emoji: '🛞',
          shapeId: 'circle',
        },
        {
          id: 'gift-box',
          label: 'Hộp quà',
          emoji: '🎁',
          shapeId: 'square',
        },
        {
          id: 'window',
          label: 'Ô cửa sổ',
          emoji: '🪟',
          shapeId: 'square',
        },
      ],
    },
  ],

  reviewPrompt: {
    narrationPrompt:
      'Bây giờ mình cùng chơi trò Phân loại hình nhé! Con hãy đưa từng đồ vật về đúng ngôi nhà của nó!',
    targetConceptId: 'circle',
    mode: 'classification',
    classificationItems: [
      {
        id: 'review-ball',
        label: 'Quả bóng',
        emoji: '⚽',
        shapeId: 'circle',
      },
      {
        id: 'review-wheel',
        label: 'Bánh xe',
        emoji: '🛞',
        shapeId: 'circle',
      },
      {
        id: 'review-gift',
        label: 'Hộp quà',
        emoji: '🎁',
        shapeId: 'square',
      },
      {
        id: 'review-window',
        label: 'Ô cửa sổ',
        emoji: '🪟',
        shapeId: 'square',
      },
    ],
  },

  offScreenActivity:
    'Ba mẹ ơi, hãy cùng bé đi quanh nhà tìm 1 đồ vật hình tròn và 1 đồ vật hình vuông nhé! Ví dụ: cái đĩa có dạng hình tròn và một ô cửa sổ có dạng hình vuông.',

  completionNarration:
    'Wow! Bé đã tìm được những người bạn hình khối rồi! Hôm nay bé thật giỏi!',
});
