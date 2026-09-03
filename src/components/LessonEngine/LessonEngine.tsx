import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { Mascot } from '@/components/Mascot';
import { SceneIntro } from './SceneIntro';
import { SceneTeach } from './SceneTeach';
import { SceneGame } from './SceneGame';
import { SceneReview } from './SceneReview';
import { useSpeech } from '@/hooks/useSpeech';
import type { Lesson } from '@/data/schema';

interface Props {
  lesson: Lesson;
  voiceId: string;
  onExit: () => void;
  onLessonComplete: (starsEarned: number) => void;
}

export function LessonEngine({ lesson, voiceId, onExit, onLessonComplete }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [finished, setFinished] = useState(false);
  const { speak, isLoading } = useSpeech(voiceId);

  const scene = lesson.scenes[sceneIndex];

  useEffect(() => {
    if (finished && lesson.completionNarration) {
      speak(lesson.completionNarration, 'celebratory');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const goNext = () => {
    if (sceneIndex < lesson.scenes.length - 1) {
      setSceneIndex(i => i + 1);
    } else {
      setFinished(true);
      onLessonComplete(stars);
    }
  };

  const awardStar = () => setStars(s => Math.min(lesson.totalStars, s + 1));

  if (finished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 bg-gradient-to-b from-yellow-100 to-orange-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <Mascot emoji="🐰" size={110} celebrate />

          <div className="bg-white/90 rounded-3xl p-8 shadow-xl text-center max-w-sm">
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: lesson.totalStars }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2 + i * 0.2 }}
                >
                  <Star className={`w-14 h-14 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                </motion.div>
              ))}
            </div>

            {lesson.offScreenActivity && (
              <div className="bg-orange-50 rounded-2xl p-4 mb-6 text-left">
                <p className="text-xs font-bold text-orange-400 mb-1">GỢI Ý CHO BA MẸ</p>
                <p className="text-sm text-gray-600">{lesson.offScreenActivity}</p>
              </div>
            )}

            <button
              onClick={onExit}
              className="bg-gradient-to-r from-orange-400 to-pink-400 text-white text-4xl w-20 h-20 rounded-full shadow-lg mx-auto flex items-center justify-center"
              aria-label="Quay lại"
            >
              🏠
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={onExit}
        className="fixed top-4 left-4 z-40 bg-white/80 backdrop-blur-sm rounded-full w-12 h-12 shadow-lg flex items-center justify-center text-xl"
        aria-label="Thoát bài học"
      >
        ✕
      </button>

      <div className="fixed top-4 right-4 z-40 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        <span className="font-bold text-gray-700">{stars}/{lesson.totalStars}</span>
      </div>

      {isLoading && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-white/90 rounded-full px-4 py-2 shadow-lg text-sm font-semibold text-gray-500 animate-pulse">
          🔊 ...
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {scene.type === 'intro' && <SceneIntro scene={scene} speak={speak} onNext={goNext} />}
          {scene.type === 'teach' && <SceneTeach scene={scene} speak={speak} onNext={goNext} />}
          {scene.type === 'game' && (
            <SceneGame scene={scene} speak={speak} onStarEarned={awardStar} onNext={goNext} />
          )}
          {scene.type === 'review' && <SceneReview scene={scene} speak={speak} onComplete={goNext} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
