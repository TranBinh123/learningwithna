import { useCallback, useEffect, useState } from 'react';
import type { Lesson } from '@/data/schema';
import { DEFAULT_VOICE_ID } from '@/lib/voiceProfiles';

const KEYS = {
  voice: 'behocvui_voice_id',
  progress: 'behocvui_progress',
  parentLessons: 'behocvui_parent_lessons',
  builtinStatus: 'behocvui_builtin_status',
};

interface ProgressEntry {
  starsEarned: number;
  completedAt: string;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Lưu dữ liệu thất bại:', e);
  }
}

export function useLocalData() {
  const [voiceId, setVoiceIdState] = useState<string>(DEFAULT_VOICE_ID);
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [parentLessons, setParentLessons] = useState<Lesson[]>([]);
  const [builtinStatus, setBuiltinStatusState] = useState<Record<string, 'active' | 'inactive'>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setVoiceIdState(readJson(KEYS.voice, DEFAULT_VOICE_ID));
    setProgress(readJson(KEYS.progress, {}));
    setParentLessons(readJson(KEYS.parentLessons, []));
    setBuiltinStatusState(readJson(KEYS.builtinStatus, {}));
    setLoaded(true);
  }, []);

  const setVoiceId = useCallback((id: string) => {
    setVoiceIdState(id);
    writeJson(KEYS.voice, id);
  }, []);

  const recordCompletion = useCallback((lessonId: string, starsEarned: number) => {
    setProgress(prev => {
      const existing = prev[lessonId]?.starsEarned ?? 0;
      const updated = {
        ...prev,
        [lessonId]: { starsEarned: Math.max(existing, starsEarned), completedAt: new Date().toISOString() },
      };
      writeJson(KEYS.progress, updated);
      return updated;
    });
  }, []);

  const addParentLesson = useCallback((lesson: Lesson) => {
    setParentLessons(prev => {
      const updated = [...prev, lesson];
      writeJson(KEYS.parentLessons, updated);
      return updated;
    });
  }, []);

  const deleteParentLesson = useCallback((lessonId: string) => {
    setParentLessons(prev => {
      const updated = prev.filter(l => l.id !== lessonId);
      writeJson(KEYS.parentLessons, updated);
      return updated;
    });
  }, []);

  const updateParentLesson = useCallback((lesson: Lesson) => {
    setParentLessons(prev => {
      const updated = prev.map(l => (l.id === lesson.id ? lesson : l));
      writeJson(KEYS.parentLessons, updated);
      return updated;
    });
  }, []);

  const setParentLessonStatus = useCallback((lessonId: string, status: 'active' | 'inactive') => {
    setParentLessons(prev => {
      const updated = prev.map(l => (l.id === lessonId ? { ...l, status } : l));
      writeJson(KEYS.parentLessons, updated);
      return updated;
    });
  }, []);

  const setBuiltinLessonStatus = useCallback((lessonId: string, status: 'active' | 'inactive') => {
    setBuiltinStatusState(prev => {
      const updated = { ...prev, [lessonId]: status };
      writeJson(KEYS.builtinStatus, updated);
      return updated;
    });
  }, []);

  const getBuiltinStatus = useCallback(
    (lessonId: string, fallback: 'active' | 'inactive' = 'active') => builtinStatus[lessonId] ?? fallback,
    [builtinStatus]
  );

  const getStarsFor = useCallback((lessonId: string) => progress[lessonId]?.starsEarned ?? 0, [progress]);

  return {
    loaded,
    voiceId,
    setVoiceId,
    getStarsFor,
    parentLessons,
    addParentLesson,
    updateParentLesson,
    deleteParentLesson,
    setParentLessonStatus,
    setBuiltinLessonStatus,
    getBuiltinStatus,
    recordCompletion,
  };
}
