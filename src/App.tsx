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

  // --- QUẢN LÝ NHẠC NỀN TOÀN CỤC DUY NHẤT TẠI ĐÂY ---
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/bg-music.mp3');
    audio.loop = true;
    audio.volume = 0.2;
    bgAudioRef.current = audio;

    return () => {
      audio.pause();
      bgAudioRef.current = null;
    };
  }, []);

  const toggleBackgroundMusic = () => {
    if (!bgAudioRef.current) return;

    if (isMusicPlaying) {
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
      setIsMusicPlaying(false);
    } else {
      bgAudioRef.current.pause();
      bgAudioRef.current.currentTime = 0;
      bgAudioRef.current.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(err => {
        console.warn('Không thể phát nhạc nền:', err);
      });
    }
  };

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center text-4xl">🌈</div>;
  }

  return (
    <div className="relative min-h-screen">
      {/* Nút bật/tắt nhạc nền ở góc dưới bên trái */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={toggleBackgroundMusic}
          className="px-3.5 py-2 bg-white/90 backdrop-blur-sm border border-amber-300 rounded-full shadow-lg text-sm font-medium text-amber-700 hover:bg-amber-50 transition-all flex items-center gap-2 active:scale-95"
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
