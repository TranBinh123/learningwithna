// ============================================================================
// SCHEMA — kiến trúc data-driven cho toàn bộ app.
// Nguyên tắc: mọi hướng dẫn (narrationText) LUÔN được đọc bằng giọng nói.
// Chữ hiển thị (nếu có) chỉ mang tính hỗ trợ, không bao giờ là điều kiện bắt
// buộc để bé chơi được.
// ============================================================================

export interface ConceptOption {
  id: string;
  name: string;
  emoji?: string;
  hex?: string;
}

export interface IntroScene {
  type: 'intro';
  id: string;
  narrationText: string;
  emoji: string;
}

export interface TeachScene {
  type: 'teach';
  id: string;
  narrationIntro: string;
  concept: ConceptOption;
  narrationOnTap: string;
}

export interface GameQuestion {
  id: string;
  narrationPrompt: string;
  visualEmoji?: string;
  options: ConceptOption[];
  correctOptionId: string;
  narrationCorrect: string[];
  narrationRetry: string[];
}

export interface GameScene {
  type: 'game';
  id: string;
  narrationIntro: string;
  questions: GameQuestion[];
}

export interface ReviewScene {
  type: 'review';
  id: string;
  narrationPrompt: string;
  options: ConceptOption[];
  targetOptionId: string;
  requiredCorrectInARow: number;
  narrationCorrect: string[];
  narrationRetry: string[];
}

export type LessonScene = IntroScene | TeachScene | GameScene | ReviewScene;

export interface Lesson {
  id: string;
  ageGroup: string;
  title: string;
  emoji: string;
  scenes: LessonScene[];
  totalStars: number;
  createdBy: 'builtin' | 'parent';
  defaultVoiceId: string;
  offScreenActivity?: string;
  completionNarration?: string;
  status?: 'active' | 'inactive';
}
