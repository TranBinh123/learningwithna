import { useState, useEffect, useRef } from 'react';
import { Home } from '@/screens/Home';
import { LessonPlayer } from '@/screens/LessonPlayer';
import { PinGate } from '@/screens/parental/PinGate';
import { ContentManager } from '@/screens/parental/ContentManager';
import { LessonEditor } from '@/screens/parental/LessonEditor';
import { useLocalData } from '@/hooks/useLocalData';

type Screen = 'home' | 'lesson-player' | 'content-manager' | 'lesson-editor';

export default function App() {
  const {
    loaded,
    voiceId,
    setVoiceId,
    getStarsFor,
    parentLessons,
    addParentLesson,
    deleteParentLesson,
    recordCompletion,
  } = useLocalData();

  const [screen, setScreen] = useState<Screen>('home');
  const [currentLessonId, setCurrentLessonId] = useState<string>('');
  const [showPinGate, setShowPinGate] = useState(false);
  
  // Trạng thái quản lý nhạc nền xuyên suốt
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  // Khởi tạo nhạc nền chạy xuyên suốt (vòng lặp loop)
  useEffect(() => {
    // Bạn có thể thay đổi đường dẫn file nhạc nền trong thư mục public (ví dụ: /bg-music.mp3)
    const audio = new Audio('/bg-music.mp3');
    audio.loop = true;
    audio.volume = 0.2; // Âm lượng vừa phải để không lấn át giọng đọc của bé
    backgroundAudioRef.current = audio;

    return () => {
      audio.pause();
      backgroundAudioRef.current = null;
    };
  }, []);

  // Hàm kích hoạt nhạc nền lần đầu tiên khi người dùng có tương tác đầu tiên (vượt qua hàng rào Autoplay của Tablet/PC)
  const toggleBackgroundMusic = () => {
    if (!backgroundAudioRef.current) return;
    
    if (isMusicPlaying) {
      backgroundAudioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      backgroundAudioRef.current.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(err => {
        console.log('Trình duyệt chặn phát nhạc tự động:', err);
      });
    }
  };

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center text-4xl">🌈</div>;
  }

  return (
    <div className="relative min-h-screen">
      {/* Nút bật/tắt nhạc nền nổi ở góc màn hình để vượt qua cơ chế chặn Autoplay trên Tablet/PC */}
      <div className="fixed top-3 right-3 z-50">
        <button
          onClick={toggleBackgroundMusic}
          className="px-3 py-1.5 bg-white/85 backdrop-blur-sm border border-amber-300 rounded-full shadow-md text-sm font-medium text-amber-700 hover:bg-amber-50 transition-all flex items-center gap-1.5"
          title="Bật/Tắt nhạc nền"
        >
          {isMusicPlaying ? '🎵 Nhạc: Bật' : '🔇 Nhạc: Tắt'}
        </button>
      </div>

      {/* Các màn hình điều hướng */}
      {screen === 'home' && (
        <Home
          parentLessons={parentLessons}
          getStarsFor={getStarsFor}
          onSelectLesson={id => {
            setCurrentLessonId(id);
            setScreen('lesson-player');
          }}
          onOpenParental={() => setShowPinGate(true)}
        />
      )}

      {screen === 'lesson-player' && (
        <LessonPlayer
          lessonId={currentLessonId}
          parentLessons={parentLessons}
          voiceId={voiceId}
          onExit={() => setScreen('home')}
          onLessonComplete={(lessonId, stars) => recordCompletion(lessonId, stars)}
        />
      )}

      {screen === 'content-manager' && (
        <ContentManager
          voiceId={voiceId}
          setVoiceId={setVoiceId}
          parentLessons={parentLessons}
          deleteParentLesson={deleteParentLesson}
          onAddLesson={() => setScreen('lesson-editor')}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'lesson-editor' && (
        <LessonEditor
          voiceId={voiceId}
          onSave={lesson => {
            addParentLesson(lesson);
            setScreen('content-manager');
          }}
          onCancel={() => setScreen('content-manager')}
        />
      )}

      {showPinGate && (
        <PinGate
          onSuccess={() => {
            setShowPinGate(false);
            setScreen('content-manager');
          }}
          onCancel={() => setShowPinGate(false)}
        />
      )}
    </div>
  );
}
