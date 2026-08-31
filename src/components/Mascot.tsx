import { motion, AnimatePresence } from 'framer-motion';

interface MascotProps {
  emoji?: string;
  size?: number;
  celebrate?: boolean;
  message?: string;
}

export function Mascot({ emoji = '🐰', size = 100, celebrate = false, message }: MascotProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white rounded-3xl px-5 py-2 shadow-lg border-2 border-orange-100 max-w-[240px] text-center"
          >
            <span className="text-gray-700 font-bold text-lg">{message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={
          celebrate
            ? { y: [0, -20, 0], rotate: [0, -8, 8, 0] }
            : { y: [0, -8, 0] }
        }
        transition={{ duration: celebrate ? 0.6 : 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: size }}
      >
        {emoji}
      </motion.div>
    </div>
  );
}
