import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mascot } from '@/components/Mascot';
import { ConceptTile } from '@/components/ConceptTile';
import { SparkleBurst, nextSparkleId, type Sparkle } from '@/components/Sparkles';
import type { GameScene } from '@/data/schema';

interface Props {
  scene: GameScene;
  speak: (text: string) => void;
  onStarEarned: () => void;
  onNext: () => void;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function SceneGame({ scene, speak, onStarEarned, onNext }: Props) {
  const [qIndex, setQIndex] = useState(0);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [shake, setShake] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [mascotMsg, setMascotMsg] = useState<string | undefined>(undefined);

  const question = scene.questions[qIndex];

  useEffect(() => {
    setAnswered(false);
    setMascotMsg(undefined);
    const t = setTimeout(() => speak(question.narrationPrompt), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex]);

  const handleChoose = (optionId: string, e: React.MouseEvent | React.TouchEvent) => {
    if (answered) return;
    const touch = 'touches' in e ? e.touches[0] : e;

    if (optionId === question.correctOptionId) {
      setAnswered(true);
      setSparkles([
        { id: nextSparkleId(), x: touch.clientX, y: touch.clientY, emoji: '⭐' },
        { id: nextSparkleId(), x: touch.clientX, y: touch.clientY, emoji: '🌟' },
      ]);
      setTimeout(() => setSparkles([]), 900);

      const msg = pickRandom(question.narrationCorrect);
      setMascotMsg(msg);
      speak(msg);
      onStarEarned();

      setTimeout(() => {
        if (qIndex < scene.questions.length - 1) {
          setQIndex(i => i + 1);
        } else {
          onNext();
        }
      }, 1500);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      const msg = pickRandom(question.narrationRetry);
      setMascotMsg(msg);
      speak(msg);
      setTimeout(() => setMascotMsg(undefined), 1800);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 bg-gradient-to-b from-purple-100 to-pink-50">
      <SparkleBurst sparkles={sparkles} />
<AnimatePresence mode="wait">
  {question.visualEmoji && (
    <motion.div
      key={`visual-${qIndex}`}  ← THÊM qIndex vào key
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3 }}
      className="text-8xl"
    >
      {question.visualEmoji}
    </motion.div>
  )}
</AnimatePresence> 

      <motion.div
        animate={shake ? { x: [0, -12, 12, -12, 12, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-5"
      >
        {question.options.map(opt => (
          <ConceptTile key={opt.id} concept={opt} onTap={e => handleChoose(opt.id, e)} disabled={answered} />
        ))}
      </motion.div>

      <Mascot emoji="🐰" size={70} message={mascotMsg} />
    </div>
  );
}
