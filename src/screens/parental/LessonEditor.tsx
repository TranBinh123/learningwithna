import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Volume2, Save } from 'lucide-react';
import { buildLesson } from '@/data/lessonBuilder';
import { useSpeech } from '@/hooks/useSpeech';
import type { Lesson } from '@/data/schema';

interface ConceptDraft {
  id: string;
  name: string;
  emoji: string;
  narrationIntro: string;
  narrationOnTap: string;
}

interface Props {
  voiceId: string;
  onSave: (lesson: Lesson) => void;
  onCancel: () => void;
}

const EMOJI_PRESETS = ['🎨', '🐾', '🔢', '🚗', '🍎', '🏠', '🎵', '⭐'];

function emptyConcept(): ConceptDraft {
  return { id: `c${Date.now()}${Math.random()}`, name: '', emoji: '', narrationIntro: '', narrationOnTap: '' };
}

export function LessonEditor({ voiceId, onSave, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_PRESETS[0]);
  const [concepts, setConcepts] = useState<ConceptDraft[]>([emptyConcept(), emptyConcept()]);
  const { speak } = useSpeech(voiceId);

  const updateConcept = (id: string, patch: Partial<ConceptDraft>) => {
    setConcepts(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addConcept = () => setConcepts(prev => [...prev, emptyConcept()]);
  const removeConcept = (id: string) => setConcepts(prev => prev.filter(c => c.id !== id));

  const canSave =
    title.trim().length > 0 &&
    concepts.filter(c => c.name.trim() && c.narrationIntro.trim()).length >= 1;

  const handleSave = () => {
    const validConcepts = concepts.filter(c => c.name.trim() && c.narrationIntro.trim());
    const lessonId = `parent-${Date.now()}`;

    const lesson = buildLesson({
      id: lessonId,
      ageGroup: '4-5',
      title: title.trim(),
      emoji,
      defaultVoiceId: voiceId,
      introNarration: `Chào bé! Hôm nay chúng mình cùng học về ${title.trim().toLowerCase()} nhé!`,
      concepts: validConcepts.map(c => ({
        id: c.id,
        name: c.name.trim(),
        emoji: c.emoji.trim() || '⭐',
        narrationIntro: c.narrationIntro.trim(),
        narrationOnTap: c.narrationOnTap.trim() || c.narrationIntro.trim(),
      })),
      createdBy: 'parent',
    });

    onSave(lesson);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onCancel} className="bg-white rounded-full p-3 shadow-md">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-extrabold text-gray-700">Thêm Bài Học Mới</h1>
      </div>

      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Tên bài học + icon */}
        <section className="bg-white rounded-3xl p-6 shadow-md">
          <label className="block text-sm font-bold text-gray-500 mb-2">Tên bài học</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ví dụ: Bé học con vật"
            className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 mb-4 focus:border-orange-300 outline-none"
          />

          <label className="block text-sm font-bold text-gray-500 mb-2">Icon đại diện</label>
          <div className="flex gap-2 flex-wrap">
            {EMOJI_PRESETS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center border-2 ${
                  emoji === e ? 'border-orange-400 bg-orange-50' : 'border-gray-100'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </section>

        {/* Danh sách khái niệm */}
        <section className="flex flex-col gap-4">
          {concepts.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-5 shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-400 text-sm">Mục {idx + 1}</span>
                {concepts.length > 1 && (
                  <button
                    onClick={() => removeConcept(c.id)}
                    className="text-red-400 hover:text-red-600"
                    aria-label="Xóa mục"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-[64px_1fr] gap-3 mb-3">
                <input
                  value={c.emoji}
                  onChange={e => updateConcept(c.id, { emoji: e.target.value })}
                  placeholder="🐱"
                  className="text-center text-2xl border-2 border-gray-100 rounded-2xl focus:border-orange-300 outline-none"
                />
                <input
                  value={c.name}
                  onChange={e => updateConcept(c.id, { name: e.target.value })}
                  placeholder="Tên (vd: Con mèo)"
                  className="border-2 border-gray-100 rounded-2xl px-4 focus:border-orange-300 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <input
                  value={c.narrationIntro}
                  onChange={e => updateConcept(c.id, { narrationIntro: e.target.value })}
                  placeholder='Lời giới thiệu (vd: "Đây là con mèo")'
                  className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-2 focus:border-orange-300 outline-none text-sm"
                />
                <button
                  onClick={() => c.narrationIntro.trim() && speak(c.narrationIntro)}
                  className="text-gray-400 hover:text-orange-400 p-2 flex-shrink-0"
                  aria-label="Nghe thử"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={c.narrationOnTap}
                  onChange={e => updateConcept(c.id, { narrationOnTap: e.target.value })}
                  placeholder='Lời nói khi bé chạm vào (vd: "Mèo kêu meo meo")'
                  className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-2 focus:border-orange-300 outline-none text-sm"
                />
                <button
                  onClick={() => c.narrationOnTap.trim() && speak(c.narrationOnTap)}
                  className="text-gray-400 hover:text-orange-400 p-2 flex-shrink-0"
                  aria-label="Nghe thử"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}

          <button
            onClick={addConcept}
            className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-3xl py-4 text-gray-400 font-semibold hover:border-orange-300 hover:text-orange-400 transition"
          >
            <Plus className="w-5 h-5" /> Thêm mục
          </button>
        </section>
      </div>

      {/* Nút lưu cố định dưới màn hình */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex justify-center">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`flex items-center gap-2 font-bold text-white rounded-full px-8 py-3 shadow-lg ${
            canSave ? 'bg-gradient-to-r from-orange-400 to-pink-400' : 'bg-gray-300'
          }`}
        >
          <Save className="w-5 h-5" /> Lưu Bài Học
        </button>
      </div>
    </div>
  );
}
