// ============================================================================
// SCHEMA — kiến trúc data-driven cho toàn bộ app.
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

export interface ClassificationItem {
  id: string;
  label: string;
  emoji: string;
  shapeId: string;
}

export interface GameQuestion {
  id: string;
  narrationPrompt: string;
  visualEmoji?: string;
  options: ConceptOption[];
  correctOptionId: string;
  narrationCorrect: string[];
  narrationRetry: string[];

  /**
   * Nếu true, câu hỏi cho phép chọn nhiều đồ vật.
   */
  multiSelect?: boolean;

  /**
   * Số lượng đáp án đúng cần chọn.
   */
  multiSelectCount?: number;

  /**
   * Danh sách đồ vật dùng cho câu hỏi phân loại.
   */
  classificationItems?: ClassificationItem[];
}

export interface GameScene {
  type: 'game';
  id: string;
  narrationIntro: string;
  questions: GameQuestion[];
}

export interface CompareScene {
  type: 'compare';
  id: string;
  narrationPrompt: string;

  options: ConceptOption[];

  /**
   * Lời giải thích khi bé chạm vào từng hình.
   */
  followUp: Record<string, string>;
}

export interface ReviewScene {
  type: 'review';
  id: string;
  narrationPrompt: string;

  options: ConceptOption[];

  targetOptionId: string;

  /**
   * streak:
   *   Cơ chế cũ: trả lời đúng liên tiếp 3 lần.
   *
   * classification:
   *   Trò chơi phân loại đồ vật vào đúng hình.
   */
  mode?: 'streak' | 'classification';

  requiredCorrectInARow: number;

  narrationCorrect: string[];
  narrationRetry: string[];

  classificationItems?: ClassificationItem[];
}

export type LessonScene =
  | IntroScene
  | TeachScene
  | GameScene
  | CompareScene
  | ReviewScene;

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
