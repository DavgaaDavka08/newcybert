'use client';

export interface GameTopic {
  id: string; name: string; icon: string; color: string;
}
export interface GameQuestion {
  id: string; topicId: string; q: string; opts: string[]; correct: number; exp: string;
}
export interface GameSettings {
  livesCount: number; xpPerCorrect: number; coinsPerCorrect: number;
  livesRefillCoins: number; livesRefillMinutes: number;
}
export interface LivesState { lives: number; refillAt: number | null; }

export type LessonType   = 'lesson' | 'quiz' | 'lab' | 'boss' | 'review';
export type LessonStatus = 'completed' | 'current' | 'locked';

export interface SubjectLesson { id: string; title: string; type: LessonType; xp: number; coins: number; }
export interface Subject { id: string; title: string; color: string; icon: string; progress: number; lessons: SubjectLesson[]; }

export const DEFAULT_LESSON_SEQUENCE: Omit<SubjectLesson, 'id'>[] = [
  { title: 'Давталт 1', type: 'lesson', xp: 10, coins: 5  },
  { title: 'Давталт 2', type: 'lesson', xp: 10, coins: 5  },
  { title: 'Сорил 1',   type: 'quiz',   xp: 20, coins: 10 },
  { title: 'Давталт 3', type: 'lesson', xp: 10, coins: 5  },
  { title: 'Туршилт',   type: 'lab',    xp: 15, coins: 8  },
  { title: 'Давталт 4', type: 'lesson', xp: 10, coins: 5  },
  { title: 'Давталт 5', type: 'lesson', xp: 10, coins: 5  },
  { title: 'Сорил 2',   type: 'quiz',   xp: 20, coins: 10 },
  { title: 'Дүгнэлт',   type: 'review', xp: 15, coins: 8  },
  { title: 'Дарга',     type: 'boss',   xp: 50, coins: 25 },
];

export function generateDefaultLessons(topicId: string): SubjectLesson[] {
  return DEFAULT_LESSON_SEQUENCE.map((item, i) => ({ ...item, id: `${topicId}_lesson_${i}` }));
}

export const LEVELS_PER_TOPIC = 10;

export const DEFAULT_TOPICS: GameTopic[] = [
  { id: 't1', name: 'Цахилгаан',    icon: 'zap',      color: '#2563EB' },
  { id: 't2', name: 'Механик',       icon: 'game',     color: '#D97706' },
  { id: 't3', name: 'Дулаан',        icon: 'flame',    color: '#DC2626' },
  { id: 't4', name: 'Соронзон',      icon: 'award',    color: '#7C3AED' },
  { id: 't5', name: 'Хэмжигдэхүүн', icon: 'barChart', color: '#0D9488' },
];

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
  livesCount: 5, xpPerCorrect: 10, coinsPerCorrect: 5, livesRefillCoins: 50, livesRefillMinutes: 300,
};

const KEYS = { topics: 'cp_topics', questions: 'cp_questions', settings: 'cp_settings', lives: 'cp_lives', stars: 'cp_stars' };

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key: string, val: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export const getTopics    = () => load<GameTopic[]>(KEYS.topics, DEFAULT_TOPICS);
export const setTopics    = (v: GameTopic[]) => save(KEYS.topics, v);
export const getQuestions = () => load<GameQuestion[]>(KEYS.questions, DEFAULT_QUESTIONS);
export const setQuestions = (v: GameQuestion[]) => save(KEYS.questions, v);
export const getSettings  = () => load<GameSettings>(KEYS.settings, DEFAULT_SETTINGS);
export const setSettings  = (v: GameSettings) => save(KEYS.settings, v);

export const getLivesState  = (def: number): LivesState => load<LivesState>(KEYS.lives, { lives: def, refillAt: null });
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
