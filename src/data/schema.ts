// ============================================================================
// SCHEMA — kiến trúc data-driven cho toàn bộ app.
// Nguyên tắc: mọi hướng dẫn (narrationText) LUÔN được đọc bằng giọng nói.
// Chữ hiển thị (nếu có) chỉ mang tính hỗ trợ, không bao giờ là điều kiện bắt
// buộc để bé chơi được.
// ============================================================================

// Một "khái niệm" bé sẽ chọn/nhận diện — dùng chung cho màu, con vật, đồ vật...
export interface ConceptOption {
  id: string;
  name: string; // dùng nội bộ + hiển thị trong khu quản lý phụ huynh
  emoji?: string; // ưu tiên hiển thị dạng emoji nếu có
  hex?: string; // nếu có, hiển thị dạng khối màu (ví dụ bài học màu sắc)
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
  narrationIntro: string; // đọc khi vào scene
  concept: ConceptOption; // đối tượng đang dạy (màu/con vật/...)
  narrationOnTap: string; // đọc khi bé chạm vào đối tượng
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
  title: string; // chỉ hiển thị cho phụ huynh (khu quản lý + danh sách chọn bài)
  emoji: string; // icon đại diện bài học, hiển thị cho bé chọn (không cần đọc chữ)
  scenes: LessonScene[];
  totalStars: number;
  createdBy: 'builtin' | 'parent';
  defaultVoiceId: string;
  offScreenActivity?: string; // gợi ý hoạt động ngoài màn hình cho phụ huynh (chỉ hiện ở màn hoàn thành)
}
