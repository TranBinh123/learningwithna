import type {
  Lesson,
  LessonScene,
  ConceptOption,
  GameQuestion,
  ClassificationItem,
} from './schema';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function pickDistractors(
  all: ConceptOption[],
  correctId: string,
  count: number
): ConceptOption[] {
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
    narrationIntro: string;
    narrationOnTap: string;
  }[];

  introNarration: string;

  defaultVoiceId: string;

  quizPrompts?: {
    narrationPrompt: string;
    visualEmoji?: string;
    correctConceptId: string;

    multiSelect?: boolean;
    multiSelectCount?: number;

    classificationItems?: ClassificationItem[];
  }[];

  compareScene?: {
    narrationPrompt: string;
    followUp: Record<string, string>;
  };

  reviewPrompt?: {
    narrationPrompt: string;
    targetConceptId: string;

    mode?: 'streak' | 'classification';

    classificationItems?: ClassificationItem[];
  };

  offScreenActivity?: string;

  completionNarration?: string;

  createdBy?: 'builtin' | 'parent';

  status?: 'active' | 'inactive';
}

export function buildLesson(input: BuildLessonInput): Lesson {
  const options: ConceptOption[] = input.concepts.map(c => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    hex: c.hex,
  }));

  const scenes: LessonScene[] = [
    // ------------------------------------------------------------------------
    // BƯỚC 1 — CHÀO MỪNG
    // ------------------------------------------------------------------------
    {
      type: 'intro',
      id: `${input.id}-intro`,
      narrationText: input.introNarration,
      emoji: input.emoji,
    },

    // ------------------------------------------------------------------------
    // BƯỚC 2 + 3 — GIỚI THIỆU CÁC CONCEPT
    // ------------------------------------------------------------------------
    ...input.concepts.map(
      (c): LessonScene => ({
        type: 'teach',
        id: `${input.id}-teach-${c.id}`,
        narrationIntro: c.narrationIntro,
        concept: {
          id: c.id,
          name: c.name,
          emoji: c.emoji,
          hex: c.hex,
        },
        narrationOnTap: c.narrationOnTap,
      })
    ),
  ];

  // --------------------------------------------------------------------------
  // BƯỚC 4 — SO SÁNH
  // --------------------------------------------------------------------------
  if (input.compareScene && options.length >= 2) {
    scenes.push({
      type: 'compare',
      id: `${input.id}-compare`,
      narrationPrompt: input.compareScene.narrationPrompt,
      options,
      followUp: input.compareScene.followUp,
    });
  }

  // --------------------------------------------------------------------------
  // BƯỚC 5 — TRÒ CHƠI TÌM HÌNH
  // --------------------------------------------------------------------------
  if (options.length >= 2) {
    const prompts =
      input.quizPrompts ??
      input.concepts.slice(0, 3).map(c => ({
        narrationPrompt: `Đâu là ${c.name.toLowerCase()} nhỉ?`,
        correctConceptId: c.id,
      }));

    const questions: GameQuestion[] = prompts.map((p, idx) => {
      const correct = options.find(
        o => o.id === p.correctConceptId
      );

      if (!correct) {
        throw new Error(
          `Không tìm thấy concept "${p.correctConceptId}" trong lesson "${input.id}".`
        );
      }

      const distractors = pickDistractors(
        options,
        correct.id,
        Math.min(2, options.length - 1)
      );

      return {
        id: `${input.id}-q${idx + 1}`,
        narrationPrompt: p.narrationPrompt,
        visualEmoji: p.visualEmoji,

        options: shuffle([
          correct,
          ...distractors,
        ]),

        correctOptionId: correct.id,

        narrationCorrect: [
          'Giỏi lắm! Con tìm đúng rồi!',
          'Chính xác! Con giỏi quá!',
          'Tuyệt vời! Con tìm được rồi!',
        ],

        narrationRetry: [
          'Gần đúng rồi, mình cùng nhìn kỹ lại nhé!',
          'Mình thử lại nhé!',
        ],

        multiSelect: p.multiSelect,
        multiSelectCount: p.multiSelectCount,

        classificationItems: p.classificationItems,
      };
    });

    scenes.push({
      type: 'game',
      id: `${input.id}-game`,
      narrationIntro:
        'Bây giờ mình cùng chơi trò tìm hình nhé!',
      questions,
    });
  }

  // --------------------------------------------------------------------------
  // BƯỚC 6 — ÔN TẬP / PHÂN LOẠI
  // --------------------------------------------------------------------------
  if (options.length >= 2) {
    const targetId =
      input.reviewPrompt?.targetConceptId ??
      input.concepts[0].id;

    const targetConcept =
      input.concepts.find(c => c.id === targetId) ??
      input.concepts[0];

    scenes.push({
      type: 'review',

      id: `${input.id}-review`,

      narrationPrompt:
        input.reviewPrompt?.narrationPrompt ??
        `Đâu là ${targetConcept.name.toLowerCase()}?`,

      options,

      targetOptionId: targetConcept.id,

      mode:
        input.reviewPrompt?.mode ??
        'streak',

      requiredCorrectInARow: 3,

      narrationCorrect: [
        'Giỏi quá!',
        'Chính xác!',
        'Tuyệt vời!',
      ],

      narrationRetry: [
        'Gần đúng rồi, thử lại nhé!',
        'Mình cùng nhìn kỹ lại nào!',
      ],

      classificationItems:
        input.reviewPrompt?.classificationItems,
    });
  }

  return {
    id: input.id,
    ageGroup: input.ageGroup,
    title: input.title,
    emoji: input.emoji,

    scenes,

    totalStars: 3,

    createdBy:
      input.createdBy ?? 'builtin',

    defaultVoiceId:
      input.defaultVoiceId,

    offScreenActivity:
      input.offScreenActivity,

    completionNarration:
      input.completionNarration ??
      `Wow! Bé đã hoàn thành bài học "${input.title}" rồi! Tuyệt vời quá!`,

    status:
      input.status ?? 'active',
  };
}
