import type { Lesson } from './schema';

import { colorsLesson01 } from './builtinLessons/colors-01';
import { shapesLesson02 } from './builtinLessons/shapes-02';

// ============================================================================
// DANH SÁCH BÀI HỌC CÓ SẴN
// ============================================================================

export const builtinLessons: Lesson[] = [
  colorsLesson01,
  shapesLesson02,
];
