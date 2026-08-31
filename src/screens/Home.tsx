import { motion } from 'framer-motion';
import { Settings, Star } from 'lucide-react';
import { Mascot } from '@/components/Mascot';
import { builtinLessons } from '@/data/registry';
import type { Lesson } from '@/data/schema';

interface Props {
  parentLessons: Lesson[];
  getStarsFor: (lessonId: string) => number;
  onSelectLesson: (lessonId: string) => void;
  onOpenParental: () => void;
}

export function Home({ parentLessons, getStarsFor, onSelectLesson, onOpenParental }: Props) {
  const allLessons = [...builtinLessons, ...parentLessons];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-yellow-50 to-orange-50 p-6 flex flex-col items-center">
      <button
        onClick={onOpenParental}
        className="fixed top-4 right-4 z-40 bg-white/70 backdrop-blur-sm rounded-full w-12 h-12 shadow-md flex items-center justify-center"
        aria-label="Khu vực phụ huynh"
      >
        <Settings className="w-6 h-6 text-gray-400" />
      </button>

      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-6 mb-8">
        <Mascot emoji="🐰" size={110} />
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 max-w-xl w-full">
        {allLessons.map((lesson, idx) => {
          const stars = getStarsFor(lesson.id);
          return (
            <motion.button
              key={lesson.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => onSelectLesson(lesson.id)}
              className="bg-white/90 rounded-3xl p-6 shadow-xl border-4 border-white flex flex-col items-center gap-2"
            >
              <span className="text-6xl">{lesson.emoji}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: lesson.totalStars }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
