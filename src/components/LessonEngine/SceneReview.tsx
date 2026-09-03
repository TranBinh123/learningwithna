import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

import { Mascot } from '@/components/Mascot';
import { ConceptTile } from '@/components/ConceptTile';
import {
  SparkleBurst,
  nextSparkleId,
  type Sparkle,
} from '@/components/Sparkles';

import type {
  ReviewScene,
  ConceptOption,
  ClassificationItem,
} from '@/data/schema';

import type { VoiceTone } from '@/lib/voiceProfiles';

interface Props {
  scene: ReviewScene;
  speak: (text: string, tone?: VoiceTone) => void;
  onComplete: () => void;
}

function pickRandom<T>(arr: T[]): T {
  return arr[
    Math.floor(Math.random() * arr.length)
  ];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [
      copy[j],
      copy[i],
    ];
  }

  return copy;
}

// ============================================================================
// REVIEW DẠNG PHÂN LOẠI
// ============================================================================

function ClassificationReview({
  scene,
  speak,
  onComplete,
}: Props) {
  const items =
    scene.classificationItems ?? [];

  const [remaining, setRemaining] =
    useState<ClassificationItem[]>(
      () => shuffle(items)
    );

  const [selectedItem, setSelectedItem] =
    useState<ClassificationItem | null>(
      null
    );

  const [sparkles, setSparkles] =
    useState<Sparkle[]>([]);

  const [mascotMsg, setMascotMsg] =
    useState<string | undefined>();

  const [completed, setCompleted] =
    useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      speak(
        scene.narrationPrompt,
        'friendly'
      );
    }, 350);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);

  const chooseItem = (
    item: ClassificationItem
  ) => {
    if (completed) return;

    setSelectedItem(item);

    speak(
      `Con hãy tìm ngôi nhà phù hợp cho ${item.label} nhé!`,
      'friendly'
    );
  };

  const placeItem = (
    shapeId: string
  ) => {
    if (!selectedItem || completed) return;

    if (selectedItem.shapeId === shapeId) {
      const item = selectedItem;

      setSparkles([
        {
          id: nextSparkleId(),
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          emoji: '⭐',
        },
        {
          id: nextSparkleId(),
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          emoji: '✨',
        },
      ]);

      setTimeout(
        () => setSparkles([]),
        900
      );

      const msg = pickRandom(
        scene.narrationCorrect
      );

      setMascotMsg(msg);

      speak(msg, 'happy');

      setSelectedItem(null);

      setRemaining(prev => {
        const next = prev.filter(
          current =>
            current.id !== item.id
        );

        if (next.length === 0) {
          setCompleted(true);

          setTimeout(() => {
            onComplete();
          }, 1800);
        }

        return next;
      });
    } else {
      const msg = pickRandom(
        scene.narrationRetry
      );

      setMascotMsg(msg);

      speak(msg, 'gentle');
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    shapeId: string
  ) => {
    e.preventDefault();

    const itemId =
      e.dataTransfer.getData(
        'classification-item'
      );

    const item = remaining.find(
      current => current.id === itemId
    );

    if (item) {
      setSelectedItem(item);
      placeItem(shapeId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 gap-6 bg-gradient-to-b from-amber-50 via-white to-green-50">

      <SparkleBurst
        sparkles={sparkles}
      />

      <div className="flex items-center gap-3">
        <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />

        <span className="font-extrabold text-gray-600">
          {items.length - remaining.length}
          /{items.length}
        </span>
      </div>

      <div className="text-center">
        <div className="text-sm font-bold text-orange-400 mb-1">
          PHÂN LOẠI HÌNH
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-700">
          Đưa từng đồ vật về đúng ngôi nhà nhé!
        </h2>
      </div>

      <Mascot
        emoji="🐰"
        size={75}
        message={mascotMsg}
      />

      {/* ------------------------------------------------------------------ */}
      {/* ĐỒ VẬT */}
      {/* ------------------------------------------------------------------ */}

      <div className="bg-white/80 rounded-3xl shadow-lg p-5 w-full max-w-3xl">
        <div className="flex flex-wrap justify-center gap-4 min-h-[130px]">
          {remaining.map(item => (
            <motion.button
              key={item.id}
              draggable
              whileHover={{
                scale: 1.08,
              }}
              whileTap={{
                scale: 0.92,
              }}
              onDragStart={e => {
                e.dataTransfer.setData(
                  'classification-item',
                  item.id
                );
              }}
              onClick={() =>
                chooseItem(item)
              }
              className={`w-28 h-28 rounded-3xl bg-white shadow-md border-4 flex flex-col items-center justify-center ${
                selectedItem?.id === item.id
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-white'
              }`}
              aria-label={item.label}
            >
              <span className="text-5xl">
                {item.emoji}
              </span>

              <span className="text-xs font-bold text-gray-500 mt-1">
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* HAI NGÔI NHÀ */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-2 gap-5 w-full max-w-xl">

        {scene.options.map(option => (
          <motion.button
            key={option.id}
            whileHover={{
              scale: 1.04,
            }}
            whileTap={{
              scale: 0.96,
            }}
            onClick={() =>
              placeItem(option.id)
            }
            onDragOver={e =>
              e.preventDefault()
            }
            onDrop={e =>
              handleDrop(e, option.id)
            }
            className="min-h-[180px] rounded-[2rem] bg-white shadow-xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3"
            style={{
              borderColor:
                option.hex ?? '#E5E7EB',
            }}
          >
            <ConceptTile
              concept={option}
              size={100}
            />

            <span className="font-extrabold text-gray-600">
              Nhà {option.name.toLowerCase()}
            </span>

            <span className="text-xs text-gray-400">
              Kéo hoặc chạm đồ vật vào đây
            </span>
          </motion.button>
        ))}

      </div>

      {completed && (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="bg-white rounded-3xl shadow-xl px-6 py-4 text-center"
        >
          <div className="text-4xl mb-2">
            🎉
          </div>

          <div className="font-extrabold text-orange-500">
            Bé phân loại rất giỏi!
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// REVIEW DẠNG STREAK — GIỮ NGUYÊN CƠ CHẾ CỦA BÀI 01
// ============================================================================

function StreakReview({
  scene,
  speak,
  onComplete,
}: Props) {
  const [streak, setStreak] =
    useState(0);

  const [order, setOrder] =
    useState<ConceptOption[]>(() =>
      shuffle(scene.options)
    );

  const [sparkles, setSparkles] =
    useState<Sparkle[]>([]);

  const [shake, setShake] =
    useState(false);

  const [mascotMsg, setMascotMsg] =
    useState<string | undefined>();

  const [locked, setLocked] =
    useState(false);

  useEffect(() => {
    if (
      streak >=
      scene.requiredCorrectInARow
    ) {
      return;
    }

    const timer = setTimeout(() => {
      speak(
        scene.narrationPrompt,
        'friendly'
      );
    }, 350);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak]);

  const handleChoose = (
    optionId: string,
    e:
      | React.MouseEvent
      | React.TouchEvent
  ) => {
    if (locked) return;

    const touch =
      'touches' in e
        ? e.touches[0]
        : e;

    if (
      optionId ===
      scene.targetOptionId
    ) {
      const newStreak =
        streak + 1;

      setSparkles([
        {
          id: nextSparkleId(),
          x: touch.clientX,
          y: touch.clientY,
          emoji: '⭐',
        },
        {
          id: nextSparkleId(),
          x: touch.clientX,
          y: touch.clientY,
          emoji: '🌟',
        },
      ]);

      setTimeout(
        () => setSparkles([]),
        900
      );

      const msg = pickRandom(
        scene.narrationCorrect
      );

      setMascotMsg(msg);

      speak(msg, 'happy');

      if (
        newStreak >=
        scene.requiredCorrectInARow
      ) {
        setLocked(true);
        setStreak(newStreak);

        setTimeout(
          onComplete,
          1500
        );
      } else {
        setStreak(newStreak);
        setOrder(
          shuffle(scene.options)
        );
      }
    } else {
      setStreak(0);

      setOrder(
        shuffle(scene.options)
      );

      setShake(true);

      setTimeout(
        () => setShake(false),
        500
      );

      const msg = pickRandom(
        scene.narrationRetry
      );

      setMascotMsg(msg);

      speak(msg, 'gentle');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 bg-gradient-to-b from-amber-100 to-orange-50">

      <SparkleBurst
        sparkles={sparkles}
      />

      <div className="flex gap-2">
        {Array.from({
          length:
            scene.requiredCorrectInARow,
        }).map((_, i) => (
          <Star
            key={i}
            className={`w-9 h-9 ${
              i < streak
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-200'
            }`}
          />
        ))}
      </div>

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
        {order.map(option => (
          <ConceptTile
            key={option.id}
            concept={option}
            onTap={e =>
              handleChoose(
                option.id,
                e
              )
            }
            disabled={locked}
          />
        ))}
      </motion.div>

      <Mascot
        emoji="🐰"
        size={70}
        message={mascotMsg}
      />
    </div>
  );
}

// ============================================================================
// ENTRY POINT
// ============================================================================

export function SceneReview(
  props: Props
) {
  if (
    props.scene.mode ===
    'classification'
  ) {
    return (
      <ClassificationReview
        {...props}
      />
    );
  }

  return (
    <StreakReview
      {...props}
    />
  );
}
