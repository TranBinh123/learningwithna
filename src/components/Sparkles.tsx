import { motion, AnimatePresence } from 'framer-motion';

export interface Sparkle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

let counter = 0;
export function nextSparkleId() {
  return counter++;
}

export function SparkleBurst({ sparkles }: { sparkles: Sparkle[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {sparkles.map(s => (
          <motion.div
            key={s.id}
            initial={{ opacity: 1, scale: 0.5, x: s.x, y: s.y }}
            animate={{
              opacity: 0,
              scale: 1.5,
              x: s.x + (Math.random() - 0.5) * 100,
              y: s.y - 60 - Math.random() * 40,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute text-3xl"
            style={{ left: 0, top: 0 }}
          >
            {s.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
