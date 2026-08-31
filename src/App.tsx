import { useState } from 'react';
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

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center text-4xl">🌈</div>;
  }

  return (
    <>
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
    </>
  );
}
