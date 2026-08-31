import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ConceptTile } from '@/components/ConceptTile';
import { SparkleBurst, nextSparkleId, type Sparkle } from '@/components/Sparkles';
import type { TeachScene } from '@/data/schema';

interface Props {
  scene: TeachScene;
  speak: (text: string) => void;
  onNext: () => void;
}

export function SceneTeach({ scene, speak, onNext }: Props) {
  const [tapped, setTapped] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    setTapped(false);
    speak(scene.narrationIntro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const touch = 'touches' in e ? e.touches[0] : e;
    setSparkles([
      { id: nextSparkleId(), x: touch.clientX, y: touch.clientY, emoji: '✨' },
      { id: nextSparkleId(), x: touch.clientX, y: touch.clientY, emoji: '⭐' },
    ]);
    setTimeout(() => setSparkles([]), 900);
    speak(scene.narrationOnTap);
    setTapped(true);
  };

  const bgTint = scene.concept.hex ? `${scene.concept.hex}15` : '#FFF7ED';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 gap-10"
      style={{ background: `linear-gradient(180deg, ${bgTint} 0%, #ffffff 100%)` }}
    >
      <SparkleBurst sparkles={sparkles} />

      <motion.div
        animate={!tapped ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ duration: 1.2, repeat: !tapped ? Infinity : 0 }}
      >
        <ConceptTile concept={scene.concept} size={220} onTap={handleTap} />
      </motion.div>

      {tapped && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-6"
        >
          <button
            onClick={() => speak(scene.narrationOnTap)}
            className="bg-white/90 rounded-full w-16 h-16 shadow-lg flex items-center justify-center text-2xl"
            aria-label="Nghe lại"
          >
            🔊
          </button>

          <motion.button
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            whileTap={{ scale: 0.9 }}
            onClick={onNext}
            className="bg-gradient-to-r from-orange-400 to-pink-400 text-white text-3xl w-20 h-20 rounded-full shadow-2xl border-4 border-white flex items-center justify-center"
            aria-label="Tiếp tục"
          >
            ➡️
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
