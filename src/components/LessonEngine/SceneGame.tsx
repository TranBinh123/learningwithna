import { useEffect, useState } from 'react';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

import { Mascot } from '@/components/Mascot';

import { ConceptTile } from '@/components/ConceptTile';

import {
  SparkleBurst,
  nextSparkleId,
  type Sparkle,
} from '@/components/Sparkles';

import type {
  GameScene,
  ClassificationItem,
} from '@/data/schema';

import type { VoiceTone } from '@/lib/voiceProfiles';

interface Props {
  scene: GameScene;
  speak: (
    text: string,
    tone?: VoiceTone
  ) => void;
  onStarEarned: () => void;
  onNext: () => void;
}

function pickRandom<T>(
  arr: T[]
): T {
  return arr[
    Math.floor(
      Math.random() * arr.length
    )
  ];
}

// ============================================================================
// GAME
// ============================================================================

export function SceneGame({
  scene,
  speak,
  onStarEarned,
  onNext,
}: Props) {
  const [qIndex, setQIndex] =
    useState(0);

  const [sparkles, setSparkles] =
    useState<Sparkle[]>([]);

  const [shake, setShake] =
    useState(false);

  const [answered, setAnswered] =
    useState(false);

  const [mascotMsg, setMascotMsg] =
    useState<
      string | undefined
    >(undefined);

  /**
   * Dùng cho câu hỏi multi-select.
   */
  const [selectedItems, setSelectedItems] =
    useState<string[]>([]);

  const question =
    scene.questions[qIndex];

  const isMultiSelect =
    question.multiSelect === true &&
    Array.isArray(
      question.classificationItems
    );

  const classificationItems =
    question.classificationItems ??
    [];

  // ==========================================================================
  // ĐỌC CÂU HỎI
  // ==========================================================================

  useEffect(() => {
    setAnswered(false);

    setMascotMsg(undefined);

    setSelectedItems([]);

    const t = setTimeout(
      () => {
        speak(
          question.narrationPrompt,
          'friendly'
        );
      },
      350
    );

    return () =>
      clearTimeout(t);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex]);

  // ==========================================================================
  // HOÀN THÀNH CÂU HỎI
  // ==========================================================================

  const completeQuestion = () => {
    setAnswered(true);

    setSparkles([
      {
        id: nextSparkleId(),
        x:
          window.innerWidth / 2,
        y:
          window.innerHeight / 2,
        emoji: '⭐',
      },
      {
        id: nextSparkleId(),
        x:
          window.innerWidth / 2,
        y:
          window.innerHeight / 2,
        emoji: '🌟',
      },
    ]);

    setTimeout(
      () => setSparkles([]),
      900
    );

    const msg = pickRandom(
      question.narrationCorrect
    );

    setMascotMsg(msg);

    speak(msg, 'happy');

    onStarEarned();

    setTimeout(() => {
      if (
        qIndex <
        scene.questions.length - 1
      ) {
        setQIndex(
          index => index + 1
        );
      } else {
        onNext();
      }
    }, 1500);
  };

  // ==========================================================================
  // SINGLE SELECT — BÀI 01 + CÂU 1/2 BÀI 02
  // ==========================================================================

  const handleChoose = (
    optionId: string,
    e:
      | React.MouseEvent
      | React.TouchEvent
  ) => {
    if (
      answered ||
      isMultiSelect
    ) {
      return;
    }

    const point =
      'touches' in e
        ? e.touches[0]
        : e;

    if (
      optionId ===
      question.correctOptionId
    ) {
      completeQuestion();

      /**
       * Ghi đè vị trí sparkle theo vị trí chạm.
       */
      setSparkles([
        {
          id: nextSparkleId(),
          x: point.clientX,
          y: point.clientY,
          emoji: '⭐',
        },
        {
          id: nextSparkleId(),
          x: point.clientX,
          y: point.clientY,
          emoji: '🌟',
        },
      ]);
    } else {
      setShake(true);

      setTimeout(
        () => setShake(false),
        500
      );

      const msg = pickRandom(
        question.narrationRetry
      );

      setMascotMsg(msg);

      speak(msg, 'gentle');

      setTimeout(
        () =>
          setMascotMsg(
            undefined
          ),
        1800
      );
    }
  };

  // ==========================================================================
  // MULTI SELECT
  //
  // Dùng cho:
  // "Đâu là những đồ vật hình tròn?"
  //
  // Bài 02 yêu cầu chọn đúng tối đa 2 đồ vật.
  // ==========================================================================

  const handleClassificationChoose = (
    item: ClassificationItem
  ) => {
    if (answered) {
      return;
    }

    setSelectedItems(
      current => {
        /**
         * Nếu đã chọn -> bỏ chọn.
         */
        if (
          current.includes(
            item.id
          )
        ) {
          return current.filter(
            id =>
              id !== item.id
          );
        }

        /**
         * Không cho chọn quá số lượng
         * mà câu hỏi yêu cầu.
         */
        const max =
          question.multiSelectCount ??
          2;

        if (
          current.length >= max
        ) {
          return current;
        }

        return [
          ...current,
          item.id,
        ];
      }
    );
  };

  // ==========================================================================
  // KIỂM TRA MULTI SELECT
  // ==========================================================================

  const checkMultiSelect = () => {
    if (
      answered ||
      !isMultiSelect
    ) {
      return;
    }

    const requiredCount =
      question.multiSelectCount ??
      2;

    /**
     * Chưa chọn đủ.
     */
    if (
      selectedItems.length !==
      requiredCount
    ) {
      const msg =
        `Con hãy chọn ${requiredCount} đồ vật nhé!`;

      setMascotMsg(msg);

      speak(
        msg,
        'friendly'
      );

      return;
    }

    /**
     * Tập đáp án đúng:
     *
     * classificationItems có shapeId.
     *
     * correctOptionId = circle
     *
     * => tất cả item có shapeId === circle
     * là đáp án đúng.
     */
    const correctIds =
      classificationItems
        .filter(
          item =>
            item.shapeId ===
            question.correctOptionId
        )
        .map(
          item => item.id
        );

    const selectedIsCorrect =
      selectedItems.every(
        id =>
          correctIds.includes(id)
      ) &&
      correctIds.every(
        id =>
          selectedItems.includes(
            id
          )
      );

    if (selectedIsCorrect) {
      completeQuestion();
      return;
    }

    // ------------------------------------------------------------------------
    // CHỌN SAI
    // ------------------------------------------------------------------------

    setShake(true);

    setTimeout(
      () => setShake(false),
      500
    );

    const msg = pickRandom(
      question.narrationRetry
    );

    setMascotMsg(msg);

    speak(
      msg,
      'gentle'
    );

    /**
     * Cho bé thử lại.
     */
    setTimeout(() => {
      setSelectedItems([]);
    }, 700);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 bg-gradient-to-b from-purple-100 to-pink-50">

      <SparkleBurst
        sparkles={sparkles}
      />

      {/* ------------------------------------------------------------------ */}
      {/* VISUAL EMOJI */}
      {/* ------------------------------------------------------------------ */}

      <AnimatePresence mode="wait">
        {question.visualEmoji && (
          <motion.div
            key={`visual-${qIndex}`}
            initial={{
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: 0.3,
            }}
            className="text-8xl"
          >
            {
              question.visualEmoji
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* MULTI SELECT */}
      {/* ------------------------------------------------------------------ */}

      {isMultiSelect ? (
        <>
          <motion.div
            animate={
              shake
                ? {
                    x: [
                      0,
                      -12,
                      12,
                      -12,
                      12,
                      0,
                    ],
                  }
                : {}
            }
            transition={{
              duration: 0.4,
            }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl"
          >
            {classificationItems.map(
              item => {
                const selected =
                  selectedItems.includes(
                    item.id
                  );

                return (
                  <motion.button
                    key={item.id}
                    whileHover={{
                      scale: 1.06,
                    }}
                    whileTap={{
                      scale: 0.94,
                    }}
                    onClick={() =>
                      handleClassificationChoose(
                        item
                      )
                    }
                    disabled={answered}
                    className={`w-36 h-36 rounded-3xl bg-white shadow-lg border-4 flex flex-col items-center justify-center transition-all ${
                      selected
                        ? 'border-orange-400 bg-orange-50 scale-105'
                        : 'border-white'
                    }`}
                  >
                    <span className="text-6xl">
                      {item.emoji}
                    </span>

                    <span className="text-sm font-bold text-gray-600 mt-2">
                      {item.label}
                    </span>

                    {selected && (
                      <span className="absolute -mt-28 ml-24 text-3xl">
                        ✓
                      </span>
                    )}
                  </motion.button>
                );
              }
            )}
          </motion.div>

          {/* SỐ LƯỢNG ĐÃ CHỌN */}

          <div className="text-center">
            <div className="text-lg font-extrabold text-gray-600">
              Đã chọn{' '}
              {selectedItems.length}/
              {question.multiSelectCount ??
                2}
            </div>

            <p className="text-sm text-gray-500 mt-1">
              Hãy chọn những đồ vật
              có dạng hình đúng nhé!
            </p>
          </div>

          {/* NÚT XÁC NHẬN */}

          <motion.button
            whileHover={{
              scale: 1.05,
            }}
            whileTap={{
              scale: 0.94,
            }}
            onClick={
              checkMultiSelect
            }
            disabled={
              answered ||
              selectedItems.length ===
                0
            }
            className={`px-8 py-4 rounded-full font-extrabold text-lg shadow-lg ${
              selectedItems.length >
                0 && !answered
                ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            🌟 Con chọn xong rồi!
          </motion.button>
        </>
      ) : (
        /* ---------------------------------------------------------------- */
        /* SINGLE SELECT */
        /* ---------------------------------------------------------------- */

        <motion.div
          animate={
            shake
              ? {
                  x: [
                    0,
                    -12,
                    12,
                    -12,
                    12,
                    0,
                  ],
                }
              : {}
          }
          transition={{
            duration: 0.4,
          }}
          className="flex gap-5"
        >
          {question.options.map(
            opt => (
              <ConceptTile
                key={opt.id}
                concept={opt}
                onTap={e =>
                  handleChoose(
                    opt.id,
                    e
                  )
                }
                disabled={
                  answered
                }
              />
            )
          )}
        </motion.div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* BÉ THỎ */}
      {/* ------------------------------------------------------------------ */}

      <Mascot
        emoji="🐰"
        size={70}
        message={mascotMsg}
      />

    </div>
  );
}
