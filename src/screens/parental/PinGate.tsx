import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

function generateProblem() {
  const a = Math.floor(Math.random() * 8) + 2; // 2-9
  const b = Math.floor(Math.random() * 8) + 2; // 2-9
  return { a, b, answer: a + b };
}

export function PinGate({ onSuccess, onCancel }: Props) {
  const [problem, setProblem] = useState(generateProblem);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);

  const check = useCallback(
    (value: string) => {
      if (value === '') return;
      if (parseInt(value, 10) === problem.answer) {
        onSuccess();
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 400);
        setTimeout(() => {
          setInput('');
          setProblem(generateProblem());
        }, 500);
      }
    },
    [problem, onSuccess]
  );

  useEffect(() => {
    if (input.length >= 2) {
      check(input);
    }
  }, [input, check]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, x: shake ? [0, -10, 10, -10, 10, 0] : 0 }}
        className="bg-white rounded-3xl p-8 shadow-2xl max-w-xs w-full relative"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Đóng"
        >
          <X className="w-6 h-6" />
        </button>

        <p className="text-center text-sm font-bold text-gray-400 mb-2">KHU VỰC PHỤ HUYNH</p>
        <p className="text-center text-3xl font-extrabold text-gray-700 mb-6">
          {problem.a} + {problem.b} = ?
        </p>

        <div className="text-center text-4xl font-extrabold text-orange-500 mb-6 h-12">{input || '\u00A0'}</div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => setInput(prev => (prev + n).slice(0, 2))}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl py-3 text-xl font-bold text-gray-700"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setInput('')}
            className="bg-gray-100 hover:bg-gray-200 rounded-2xl py-3 text-sm font-bold text-gray-500 col-span-1"
          >
            Xóa
          </button>
          <button
            onClick={() => setInput(prev => (prev + '0').slice(0, 2))}
            className="bg-gray-100 hover:bg-gray-200 rounded-2xl py-3 text-xl font-bold text-gray-700"
          >
            0
          </button>
          <button
            onClick={() => check(input)}
            className="bg-orange-400 hover:bg-orange-500 rounded-2xl py-3 text-sm font-bold text-white col-span-1"
          >
            OK
          </button>
        </div>
      </motion.div>
    </div>
  );
}
