import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Plus, Volume2 } from 'lucide-react';
import { VOICE_PROFILES } from '@/lib/voiceProfiles';
import { useSpeech } from '@/hooks/useSpeech';
import { builtinLessons } from '@/data/registry';
import type { Lesson } from '@/data/schema';

interface Props {
  voiceId: string;
  setVoiceId: (id: string) => void;
  parentLessons: Lesson[];
  deleteParentLesson: (id: string) => void;
  onAddLesson: () => void;
  onBack: () => void;
}

export function ContentManager({
  voiceId,
  setVoiceId,
  parentLessons,
  deleteParentLesson,
  onAddLesson,
  onBack,
}: Props) {
  const { speak } = useSpeech(voiceId);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);
  const previewSpeech = useSpeech(previewVoiceId ?? voiceId);

  const handlePreview = (id: string) => {
    setPreviewVoiceId(id);
    setTimeout(() => previewSpeech.speak('Xin chào, đây là giọng đọc thử nhé!'), 50);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="bg-white rounded-full p-3 shadow-md">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-extrabold text-gray-700">Khu Vực Phụ Huynh</h1>
      </div>

      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        {/* Chọn giọng đọc */}
        <section className="bg-white rounded-3xl p-6 shadow-md">
          <h2 className="font-bold text-gray-700 mb-4">Giọng đọc cho bé</h2>
          <div className="grid grid-cols-2 gap-3">
            {VOICE_PROFILES.map(v => (
              <div
                key={v.id}
                className={`rounded-2xl p-4 border-2 flex items-center justify-between ${
                  voiceId === v.id ? 'border-orange-400 bg-orange-50' : 'border-gray-100'
                }`}
              >
                <button onClick={() => setVoiceId(v.id)} className="text-left flex-1">
                  <span className="font-semibold text-gray-700">{v.label}</span>
                </button>
                <button
                  onClick={() => handlePreview(v.id)}
                  className="text-gray-400 hover:text-orange-400 p-1"
                  aria-label="Nghe thử"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Nội dung có sẵn */}
        <section className="bg-white rounded-3xl p-6 shadow-md">
          <h2 className="font-bold text-gray-700 mb-4">Bài học có sẵn</h2>
          <div className="flex flex-col gap-2">
            {builtinLessons.map(l => (
              <div key={l.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                <span className="text-2xl">{l.emoji}</span>
                <span className="font-semibold text-gray-600 flex-1">{l.title}</span>
                <span className="text-xs text-gray-400">{l.ageGroup} tuổi</span>
              </div>
            ))}
          </div>
        </section>

        {/* Nội dung phụ huynh tự thêm */}
        <section className="bg-white rounded-3xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-700">Bài học tự thêm</h2>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onAddLesson}
              className="flex items-center gap-1 bg-orange-400 text-white font-semibold text-sm rounded-full px-4 py-2"
            >
              <Plus className="w-4 h-4" /> Thêm bài học
            </motion.button>
          </div>

          {parentLessons.length === 0 ? (
            <p className="text-gray-400 text-sm">Chưa có bài học nào do bạn tự thêm.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {parentLessons.map(l => (
                <div key={l.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                  <span className="text-2xl">{l.emoji}</span>
                  <span className="font-semibold text-gray-600 flex-1">{l.title}</span>
                  <button
                    onClick={() => deleteParentLesson(l.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                    aria-label="Xóa"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
