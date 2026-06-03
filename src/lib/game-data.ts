'use client';

import type { GameTopic as GameTopicBase, LessonType as LessonTypeBase } from '@/lib/game-defaults';
import {
  DEFAULT_TOPICS as DEF_TOPICS,
  DEFAULT_LESSON_SEQUENCE as DEF_LESSON_SEQ,
  LEVELS_PER_TOPIC as LPT,
} from '@/lib/game-defaults';

export type GameTopic = GameTopicBase;
export type LessonType = LessonTypeBase;

export interface GameQuestion {
  id: string; topicId: string; q: string; opts: string[]; correct: number; exp: string;
}
export interface GameSettings {
  livesCount: number; xpPerCorrect: number; coinsPerCorrect: number;
  livesRefillCoins: number; livesRefillMinutes: number;
}
export interface LivesState { lives: number; refillAt: number | null; }

export type LessonStatus = 'completed' | 'current' | 'locked';

export interface SubjectLesson { id: string; title: string; type: LessonType; xp: number; coins: number; }
export interface Subject { id: string; title: string; color: string; icon: string; progress: number; lessons: SubjectLesson[]; }

export const DEFAULT_LESSON_SEQUENCE: Omit<SubjectLesson, 'id'>[] = DEF_LESSON_SEQ.map(n => ({
  title: n.title,
  type: n.type,
  xp: n.xp,
  coins: n.coins,
}));

export function generateDefaultLessons(topicId: string): SubjectLesson[] {
  return DEFAULT_LESSON_SEQUENCE.map((item, i) => ({ ...item, id: `${topicId}_lesson_${i}` }));
}

export const LEVELS_PER_TOPIC = LPT;

export const DEFAULT_TOPICS: GameTopic[] = DEF_TOPICS;

export const DEFAULT_QUESTIONS: GameQuestion[] = [
  { id: 'q1',  topicId: 't1', q: 'Ом-ын хуулийн томьёо?',              opts: ['V=IR','F=ma','P=IV','E=mc²'],              correct: 0, exp: 'V = I × R — Вольт = Ампер × Ом' },
  { id: 'q2',  topicId: 't1', q: 'Цахилгаан гүйдлийн SI нэгж?',       opts: ['Ватт','Ампер','Вольт','Кулон'],             correct: 1, exp: 'Ампер (A) — SI системийн гүйдлийн нэгж' },
  { id: 'q3',  topicId: 't1', q: 'Параллел холболтод хүчдэл?',         opts: ['Нэмэгдэнэ','Ижил байна','Хуваагдана','Тэглэнэ'], correct: 1, exp: 'Параллел холболтод хүчдэл тэнцүү байна' },
  { id: 'q4',  topicId: 't1', q: 'Цуваа холболтод гүйдэл?',           opts: ['Нэмэгдэнэ','Ижил байна','Хуваагдана','Тэглэнэ'], correct: 1, exp: 'Цуваа холболтод гүйдэл тэнцүү байна' },
  { id: 'q5',  topicId: 't1', q: 'Ватт нь юуны нэгж вэ?',             opts: ['Хүч','Эрчим хүч','Цахилгаан цэнэг','Хурд'], correct: 0, exp: 'Ватт (W) — хүчний нэгж (Жоуль/секунд)' },
  { id: 'q6',  topicId: 't2', q: 'Ньютоны 2-р хуулийн томьёо?',      opts: ['F=ma','V=IR','P=IV','E=mc²'],              correct: 0, exp: 'F = m × a — Хүч = масс × хурдатгал' },
  { id: 'q7',  topicId: 't2', q: 'Хурдны SI нэгж?',                   opts: ['км/ц','м/с','м/с²','Ньютон'],             correct: 1, exp: 'Хурдны SI нэгж: метр/секунд (м/с)' },
  { id: 'q8',  topicId: 't2', q: 'Жин гэж юу вэ?',                    opts: ['Масс×хурдатгал','Масс×g','Масс/g','Масс+g'], correct: 1, exp: 'Жин W = m × g (g = 9.8 м/с²)' },
  { id: 'q9',  topicId: 't2', q: 'Импульсийн томьёо?',                opts: ['p=mv','p=ma','p=Ft','p=mgh'],              correct: 0, exp: 'Импульс p = m × v (масс × хурд)' },
  { id: 'q10', topicId: 't2', q: 'Кинетик энергийн томьёо?',          opts: ['½mv²','mgh','Fd','mv'],                   correct: 0, exp: 'Кинетик энерги Ek = ½ × m × v²' },
  { id: 'q11', topicId: 't3', q: 'Дулааны тэлэлтийн томьёо?',        opts: ['ΔL=αL₀ΔT','Q=mcΔT','P=Q/t','F=ma'],      correct: 0, exp: 'ΔL = α × L₀ × ΔT' },
  { id: 'q12', topicId: 't3', q: 'Дулаан багтаамжийн нэгж?',         opts: ['Ж/(кг·К)','Ж/кг','Вт/К','Па'],            correct: 0, exp: 'Дулаан багтаамж: Жоуль/(кг × Кельвин)' },
  { id: 'q13', topicId: 't4', q: 'Соронзон индукцийн нэгж?',         opts: ['Тесла','Ватт','Ампер','Вольт'],            correct: 0, exp: 'Соронзон индукц B — нэгж: Тесла (Тл)' },
  { id: 'q14', topicId: 't4', q: 'Лоренцийн хүчний томьёо?',        opts: ['F=qvB','F=ma','F=qE','F=kq₁q₂/r²'],       correct: 0, exp: 'F = q × v × B' },
  { id: 'q15', topicId: 't5', q: 'Даралтын SI нэгж?',               opts: ['Паскаль','Ньютон','Жоуль','Ватт'],         correct: 0, exp: 'Даралт Р — нэгж: Паскаль (Па = Н/м²)' },
];

export const DEFAULT_SETTINGS: GameSettings = {
  livesCount: 5,
  xpPerCorrect: 5,        // Зөв хариулт бүр +5 XP
  coinsPerCorrect: 0,     // Зоос тоглоомоос биш streak-ээс олгоно
  livesRefillCoins: 5,    // Full Heal = 5 Coin
  livesRefillMinutes: 30, // 30 мин тутам +1 амь
};

const KEYS = {
  topics: 'cp_topics',
  questions: 'cp_questions',
  settings: 'cp_settings',
  lives: 'cp_lives',
  stars: 'cp_stars',
  lessonSeq: 'cp_lesson_seq',
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key: string, val: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export const getTopics    = () => load<GameTopic[]>(KEYS.topics, []);
export const setTopics    = (v: GameTopic[]) => save(KEYS.topics, v);
export const getQuestions = () => load<GameQuestion[]>(KEYS.questions, []);
export const setQuestions = (v: GameQuestion[]) => save(KEYS.questions, v);
export const getSettings  = () => load<GameSettings>(KEYS.settings, DEFAULT_SETTINGS);
export const setSettings  = (v: GameSettings) => save(KEYS.settings, v);

export const getLessonSequence = (): Omit<SubjectLesson, 'id'>[] =>
  load<Omit<SubjectLesson, 'id'>[]>(KEYS.lessonSeq, DEFAULT_LESSON_SEQUENCE);

export const setLessonSequence = (v: Omit<SubjectLesson, 'id'>[]) => save(KEYS.lessonSeq, v);

/** Серверээс замыг татаж localStorage-д хадгална (сурагчийн тоглоом). */
export async function hydrateGamePathFromApi(): Promise<boolean> {
  try {
    const r = await fetch('/api/game/path');
    if (!r.ok) return false;
    const d = await r.json();
    if (Array.isArray(d.topics) && d.topics.length) setTopics(d.topics);
    if (Array.isArray(d.lessonNodes) && d.lessonNodes.length === LPT) {
      setLessonSequence(
        d.lessonNodes.map((n: { title: string; type: string; xp?: number; coins?: number }) => ({
          title: String(n.title ?? ''),
          type: (['lesson', 'quiz', 'lab', 'boss', 'review'].includes(n.type) ? n.type : 'lesson') as LessonType,
          xp: Number(n.xp) || 10,
          coins: Number(n.coins) || 5,
        }))
      );
    }
    return true;
  } catch {
    return false;
  }
}
export const getLivesState = (def: number): LivesState => load<LivesState>(KEYS.lives, { lives: def, refillAt: null });
export const setLivesState  = (v: LivesState) => save(KEYS.lives, v);
export const getStars       = (): Record<string, number[]> => load(KEYS.stars, {});
export const setNodeStars   = (topicId: string, nodeIdx: number, stars: number) => {
  const all = getStars();
  if (!all[topicId]) all[topicId] = Array(LEVELS_PER_TOPIC).fill(0);
  all[topicId][nodeIdx] = stars;
  save(KEYS.stars, all);
};
export const calcStars = (mistakes: number): 0 | 1 | 2 | 3 => {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
};

// ── V2: DB-driven topics with subtopics ────────────────────────

export interface GameSubtopic {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface GameTopicWithSubtopics {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  subtopics: GameSubtopic[];
}

const KEYS_V2 = {
  topicsV2: 'cp_topics_v2',
  starsV2:  'cp_stars_v2',
};

export const getTopicsV2     = (): GameTopicWithSubtopics[] => load(KEYS_V2.topicsV2, []);
export const setTopicsV2     = (v: GameTopicWithSubtopics[]) => save(KEYS_V2.topicsV2, v);

export const getStarsV2      = (): Record<string, number> => load(KEYS_V2.starsV2, {});
export const setSubtopicStars = (subtopicId: string, stars: number) => {
  const all = getStarsV2();
  all[subtopicId] = stars;
  save(KEYS_V2.starsV2, all);
};

export async function hydrateTopicsV2(): Promise<boolean> {
  try {
    const r = await fetch('/api/game/topics');
    if (!r.ok) return false;
    const d = await r.json();
    if (Array.isArray(d.topics) && d.topics.length) {
      setTopicsV2(d.topics);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
