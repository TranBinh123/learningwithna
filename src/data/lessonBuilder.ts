import type { Lesson, LessonScene, ConceptOption, GameQuestion } from './schema';

// ============================================================================
// LESSON BUILDER — dựng 1 Lesson hoàn chỉnh (intro → teach từng concept →
// trò chơi kiểm tra → ôn tập) chỉ từ 1 danh sách concept đơn giản.
// Dùng cho:
//  - Nội dung có sẵn (builtinLessons/*.ts)
//  - Khu quản lý phụ huynh: phụ huynh chỉ cần nhập concept, không cần biết code
// ============================================================================

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistractors(all: ConceptOption[], correctId: string, count: number): ConceptOption[] {
  const others = all.filter(c => c.id !== correctId);
  return shuffle(others).slice(0, count);
}

export interface BuildLessonInput {
  id: string;
  ageGroup: string;
  title: string;
  emoji: string;
  concepts: {
    id: string;
    name: string;
    emoji?: string;
    hex?: string;
    narrationIntro: string; // "Đây là màu đỏ"
    narrationOnTap: string; // "Táo màu đỏ đấy!"
  }[];
  introNarration: string;
  defaultVoiceId: string;
  quizPrompts?: { narrationPrompt: string; visualEmoji?: string; correctConceptId: string }[];
  reviewPrompt?: { narrationPrompt: string; targetConceptId: string };
  offScreenActivity?: string;
  createdBy?: 'builtin' | 'parent';
}

export function buildLesson(input: BuildLessonInput): Lesson {
  const options: ConceptOption[] = input.concepts.map(c => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    hex: c.hex,
  }));

  const scenes: LessonScene[] = [
    {
      type: 'intro',
      id: `${input.id}-intro`,
      narrationText: input.introNarration,
      emoji: input.emoji,
    },
    ...input.concepts.map(
      (c): LessonScene => ({
        type: 'teach',
        id: `${input.id}-teach-${c.id}`,
        narrationIntro: c.narrationIntro,
        concept: { id: c.id, name: c.name, emoji: c.emoji, hex: c.hex },
        narrationOnTap: c.narrationOnTap,
      })
    ),
  ];

  // Trò chơi kiểm tra — tự tạo câu hỏi nếu có >= 2 concept
  if (options.length >= 2) {
    const prompts: { narrationPrompt: string; visualEmoji?: string; correctConceptId: string }[] =
      input.quizPrompts ??
      input.concepts.slice(0, 3).map(c => ({
        narrationPrompt: `Đâu là ${c.name.toLowerCase()} nhỉ?`,
        correctConceptId: c.id,
      }));

    const questions: GameQuestion[] = prompts.map((p, idx) => {
      const correct = options.find(o => o.id === p.correctConceptId)!;
      const distractors = pickDistractors(options, correct.id, Math.min(2, options.length - 1));
      return {
        id: `${input.id}-q${idx + 1}`,
        narrationPrompt: p.narrationPrompt,
        visualEmoji: p.visualEmoji,
        options: shuffle([correct, ...distractors]),
        correctOptionId: correct.id,
        narrationCorrect: ['Giỏi quá!', 'Chính xác!', 'Tuyệt vời!'],
        narrationRetry: ['Mình thử lại nhé!', 'Gần đúng rồi, thử lại nhé!'],
      };
    });

    scenes.push({
      type: 'game',
      id: `${input.id}-game`,
      narrationIntro: 'Bây giờ mình cùng chơi trò tìm hiểu nhé!',
      questions,
    });
  }

  // Ôn tập cuối bài — cần >= 2 concept để có lựa chọn phân biệt
  if (options.length >= 2) {
    const targetId = input.reviewPrompt?.targetConceptId ?? input.concepts[0].id;
    const targetConcept = input.concepts.find(c => c.id === targetId) ?? input.concepts[0];
    scenes.push({
      type: 'review',
      id: `${input.id}-review`,
      narrationPrompt: input.reviewPrompt?.narrationPrompt ?? `Đâu là ${targetConcept.name.toLowerCase()}?`,
      options,
      targetOptionId: targetConcept.id,
      requiredCorrectInARow: 3,
      narrationCorrect: ['Giỏi quá!', 'Chính xác!'],
      narrationRetry: ['Mình thử lại nhé!'],
    });
  }

  return {
    id: input.id,
    ageGroup: input.ageGroup,
    title: input.title,
    emoji: input.emoji,
    scenes,
    totalStars: 3,
    createdBy: input.createdBy ?? 'builtin',
    defaultVoiceId: input.defaultVoiceId,
    offScreenActivity: input.offScreenActivity,
  };
}
