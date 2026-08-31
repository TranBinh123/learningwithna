import { LessonEngine } from '@/components/LessonEngine/LessonEngine';
import { builtinLessons } from '@/data/registry';
import type { Lesson } from '@/data/schema';

interface Props {
  lessonId: string;
  parentLessons: Lesson[];
  voiceId: string;
  onExit: () => void;
  onLessonComplete: (lessonId: string, starsEarned: number) => void;
}

export function LessonPlayer({ lessonId, parentLessons, voiceId, onExit, onLessonComplete }: Props) {
  const lesson = [...builtinLessons, ...parentLessons].find(l => l.id === lessonId);

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <p className="text-gray-500 font-semibold">Không tìm thấy bài học này.</p>
        <button onClick={onExit} className="bg-orange-400 text-white font-bold py-3 px-8 rounded-full shadow-lg">
          Quay Lại
        </button>
      </div>
    );
  }

  return (
    <LessonEngine
      lesson={lesson}
      voiceId={lesson.defaultVoiceId || voiceId}
      onExit={onExit}
      onLessonComplete={stars => onLessonComplete(lesson.id, stars)}
    />
  );
}
