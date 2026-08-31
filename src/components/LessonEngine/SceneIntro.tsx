import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mascot } from '@/components/Mascot';
import type { IntroScene } from '@/data/schema';

interface Props {
  scene: IntroScene;
  speak: (text: string) => void;
  onNext: () => void;
}

export function SceneIntro({ scene, speak, onNext }: Props) {
  useEffect(() => {
    speak(scene.narrationText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-10">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <Mascot emoji={scene.emoji} size={140} celebrate />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, scale: [1, 1.06, 1] }}
        transition={{ delay: 0.4, scale: { duration: 1.2, repeat: Infinity } }}
        whileTap={{ scale: 0.9 }}
        onClick={onNext}
        className="bg-gradient-to-r from-orange-400 to-pink-400 text-white text-5xl w-28 h-28 rounded-full shadow-2xl border-4 border-white flex items-center justify-center"
        aria-label="Bắt đầu"
      >
        ▶️
      </motion.button>
    </div>
  );
}
