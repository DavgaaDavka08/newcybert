/** Game path defaults + types (server-safe, no 'use client'). */

export interface GameTopic {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const LEVELS_PER_TOPIC = 10;

export const DEFAULT_TOPICS: GameTopic[] = [
  { id: 't1', name: 'Цахилгаан', icon: 'zap', color: '#2563EB' },
  { id: 't2', name: 'Механик', icon: 'game', color: '#D97706' },
  { id: 't3', name: 'Дулаан', icon: 'flame', color: '#DC2626' },
  { id: 't4', name: 'Соронзон', icon: 'award', color: '#7C3AED' },
  { id: 't5', name: 'Хэмжигдэхүүн', icon: 'barChart', color: '#0D9488' },
];

export type LessonType = 'lesson' | 'quiz' | 'lab' | 'boss' | 'review';

export const DEFAULT_LESSON_SEQUENCE: { title: string; type: LessonType; xp: number; coins: number }[] = [
  { title: 'Давталт 1', type: 'lesson', xp: 10, coins: 5 },
  { title: 'Давталт 2', type: 'lesson', xp: 10, coins: 5 },
  { title: 'Сорил 1', type: 'quiz', xp: 20, coins: 10 },
  { title: 'Давталт 3', type: 'lesson', xp: 10, coins: 5 },
  { title: 'Туршилт', type: 'lab', xp: 15, coins: 8 },
  { title: 'Давталт 4', type: 'lesson', xp: 10, coins: 5 },
  { title: 'Давталт 5', type: 'lesson', xp: 10, coins: 5 },
  { title: 'Сорил 2', type: 'quiz', xp: 20, coins: 10 },
  { title: 'Дүгнэлт', type: 'review', xp: 15, coins: 8 },
  { title: 'Дарга', type: 'boss', xp: 50, coins: 25 },
];
