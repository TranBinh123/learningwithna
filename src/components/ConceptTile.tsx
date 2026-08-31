import { motion } from 'framer-motion';
import type { ConceptOption } from '@/data/schema';

interface ConceptTileProps {
  concept: ConceptOption;
  size?: number;
  onTap?: (e: React.MouseEvent | React.TouchEvent) => void;
  disabled?: boolean;
}

// Hiển thị 1 khái niệm (màu / con vật / đồ vật...) — KHÔNG in chữ tên lên tile,
// vì bé chưa đọc được. Màu sắc/emoji tự nó là tín hiệu để bé nhận diện.
export function ConceptTile({ concept, size = 110, onTap, disabled }: ConceptTileProps) {
  const isColor = !!concept.hex;

  return (
    <motion.button
      onClick={onTap}
      whileTap={onTap ? { scale: 0.85 } : undefined}
      whileHover={onTap ? { scale: 1.05 } : undefined}
      disabled={disabled}
      className="rounded-3xl shadow-xl border-4 border-white flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: isColor ? concept.hex : '#FFF7ED',
      }}
    >
      {concept.emoji && <span style={{ fontSize: size * 0.45 }}>{concept.emoji}</span>}
    </motion.button>
  );
}
