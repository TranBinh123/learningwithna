import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { Mascot } from '@/components/Mascot';
import { ConceptTile } from '@/components/ConceptTile';

import type { CompareScene, ConceptOption } from '@/data/schema';
import type { VoiceTone } from '@/lib/voiceProfiles';

interface Props {
  scene: CompareScene;
  speak: (text: string, tone?: VoiceTone) => void;
  onNext: () => void;
}

export function SceneCompare({
  scene,
  speak,
  onNext,
}: Props) {
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  useEffect(() => {
    setSelectedId(null);

    const timer = setTimeout(() => {
      speak(scene.narrationPrompt, 'friendly');
    }, 350);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);

  const handleSelect = (concept: ConceptOption) => {
    setSelectedId(concept.id);

    const message =
      scene.followUp[concept.id];

    if (message) {
      speak(message, 'happy');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 bg-gradient-to-b from-sky-50 via-white to-green-50">

      <Mascot
        emoji="🐰"
        size={85}
        message={
          selectedId
            ? 'Con thử nhìn thật kỹ đặc điểm của hình nhé!'
            : undefined
        }
      />

      <div className="text-center max-w-xl">
        <div className="text-sm font-bold text-orange-400 mb-2">
          SO SÁNH HÌNH
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-700">
          Hình nào có góc, hình nào không có góc nhỉ?
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-center gap-8"
      >
        {scene.options.map(concept => (
          <motion.div
            key={concept.id}
            animate={
              selectedId === concept.id
                ? {
                    scale: [1, 1.08, 1],
                  }
                : {
                    scale: 1,
                  }
            }
            transition={{
              duration: 0.4,
            }}
          >
            <ConceptTile
              concept={concept}
              size={220}
              onTap={() =>
                handleSelect(concept)
              }
            />
          </motion.div>
        ))}
      </motion.div>

      {selectedId && (
        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="bg-white/90 rounded-3xl shadow-lg px-6 py-4 max-w-xl text-center"
        >
          <p className="text-gray-600 font-semibold">
            {scene.followUp[selectedId]}
          </p>
        </motion.div>
      )}

      <motion.button
        whileTap={{ scale: 0.92 }}
        animate={
          selectedId
            ? {
                scale: [1, 1.06, 1],
              }
            : {}
        }
        transition={{
          duration: 1,
          repeat: selectedId ? Infinity : 0,
        }}
        disabled={!selectedId}
        onClick={onNext}
        className={`w-20 h-20 rounded-full text-4xl shadow-xl border-4 border-white flex items-center justify-center ${
          selectedId
            ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white'
            : 'bg-gray-200 text-gray-400'
        }`}
        aria-label="Tiếp tục"
      >
        ➡️
      </motion.button>
    </div>
  );
}
