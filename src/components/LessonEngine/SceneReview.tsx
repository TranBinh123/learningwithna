import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Mascot } from '@/components/Mascot';
import { ConceptTile } from '@/components/ConceptTile';
import { SparkleBurst, nextSparkleId, type Sparkle } from '@/components/Sparkles';
import type { ReviewScene, ConceptOption } from '@/data/schema';
import type { VoiceTone } from '@/lib/voiceProfiles';

interface Props {
  scene: ReviewScene;
  speak: (text: string, tone?: VoiceTone) => void;
  onComplete: () => void;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function SceneReview({ scene, speak, onComplete }: Props) {
  const [streak, setStreak] = useState(0);
  const [order, setOrder] = useState<ConceptOption[]>(() => shuffle(scene.options));
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [shake, setShake] = useState(false);
  const [mascotMsg, setMascotMsg] = useState<string | undefined>(undefined);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    // The final correct answer completes the review immediately; do not
    // announce the same prompt a fourth time after reaching the target streak.
    if (streak >= scene.requiredCorrectInARow) return;

    const t = setTimeout(() => speak(scene.narrationPrompt, 'friendly'), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak]);

  const handleChoose = (optionId: string, e: React.MouseEvent | React.TouchEvent) => {
    if (locked) return;
    const touch = 'touches' in e ? e.touches[0] : e;

    if (optionId === scene.targetOptionId) {
      const newStreak = streak + 1;
      setSparkles([
        { id: nextSparkleId(), x: touch.clientX, y: touch.clientY, emoji: '⭐' },
        { id: nextSparkleId(), x: touch.clientX, y: touch.clientY, emoji: '🌟' },
      ]);
      setTimeout(() => setSparkles([]), 900);

      const msg = pickRandom(scene.narrationCorrect);
      setMascotMsg(msg);
      speak(msg, 'happy');

      if (newStreak >= scene.requiredCorrectInARow) {
        setLocked(true);
        setStreak(newStreak);
        setTimeout(onComplete, 1500);
      } else {
        setStreak(newStreak);
        setOrder(shuffle(scene.options));
      }
    } else {
      setStreak(0);
      setOrder(shuffle(scene.options));
      setShake(true);
      setTimeout(() => setShake(false), 500);
      const msg = pickRandom(scene.narrationRetry);
      setMascotMsg(msg);
      speak(msg, 'gentle');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 bg-gradient-to-b from-amber-100 to-orange-50">
      <SparkleBurst sparkles={sparkles} />

      <div className="flex gap-2">
        {Array.from({ length: scene.requiredCorrectInARow }).map((_, i) => (
          <Star key={i} className={`w-9 h-9 ${i < streak ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
        ))}
      </div>

      <motion.div
        animate={shake ? { x: [0, -12, 12, -12, 12, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-5"
      >
        {order.map(opt => (
          <ConceptTile key={opt.id} concept={opt} onTap={e => handleChoose(opt.id, e)} disabled={locked} />
        ))}
      </motion.div>

      <Mascot emoji="🐰" size={70} message={mascotMsg} />
    </div>
  );
}
