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

  // QUAN TRỌNG: luôn ưu tiên lựa chọn giọng đọc của phụ huynh (voiceId toàn cục,
  // lưu trong Settings/ContentManager). `lesson.defaultVoiceId` chỉ là giá trị
  // khởi tạo lúc tạo bài học (dùng khi build lesson), KHÔNG được phép ghi đè
  // lựa chọn hiện tại của người dùng — nếu không 4 nhân vật giọng đọc sẽ
  // không bao giờ có tác dụng khi chơi bài học thật sự.
  return (
    <LessonEngine
      lesson={lesson}
      voiceId={voiceId}
      onExit={onExit}
      onLessonComplete={stars => onLessonComplete(lesson.id, stars)}
    />
  );
}
