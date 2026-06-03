// src/types/index.ts

export type UserRole = "student" | "teacher" | "admin";

// ── App state (client-side game state) ──────────────────────
export interface AppState {
  xp: number;
  level: number;
  coins: number;
  lives: number;
  streak: number;
  name: string;
  isPremium: boolean;
  dailyFreeAIRemaining: number;
  dailyFreeProblemRemaining: number;
}

export type Screen = 'dashboard' | 'game';

// ── Navigation ───────────────────────────────────────────────
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

// ── Rank ─────────────────────────────────────────────────────
export interface Rank {
  name: string;
  min: number;
  color: string;
}

// ── Mock data types ───────────────────────────────────────────
export interface Student { name: string; xp: number; score: number; weak: string; streak: number; }
export interface ClassRoom { id: string; name: string; subject: string; students: number; avgXP: number; avgScore: number; }
export interface Exam { id: number; year: string; q: number; time: number; cost: number; diff: string; }
export interface Question { q: string; img?: boolean; opts: string[]; correct: number; }
export interface Lesson { title: string; topic: string; type: string; dur: string; xp: number; }

// ── Live game session (realtime) ─────────────────────────────
export interface LiveGameSession {
  id: string;
  pin: string;
  hostId: string;
  status: 'waiting' | 'active' | 'paused' | 'finished';
  topic: string;
  currentQuestion: number;
  timerSeconds: number;
  players: LivePlayer[];
  createdAt: Date;
}

export interface LivePlayer {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  streak: number;
  isConnected: boolean;
  answers: number[];
}

export type AuthScreen = 'login' | 'register' | 'teacherVerify' | 'forgot' | 'admin';

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  province?: string;
  school?: string;
  /** Дунд сургуулийн анги (6–12) */
  grade?: number;
  role: UserRole;
  isVerified: boolean;
  isPremium: boolean;
  premiumUntil?: Date;
  xp: number;
  level: number;
  coins: number;
  lives: number;
  streak: number;
  lastLoginDate?: Date;
  streakFreezeCount: number;
  avatar?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestion {
  _id: string;
  categoryId: string;
  level: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  coinReward: number;
  createdAt: Date;
}

export interface ICategory {
  _id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  totalLevels: number;
  isActive: boolean;
  order: number;
}

export interface IPayment {
  _id: string;
  userId: string;
  amount: number;
  type: "premium_monthly" | "premium_pro" | "coins_500" | "coins_1000" | "quiz_pack";
  status: "pending" | "success" | "failed";
  method: "qpay" | "khan_bank";
  invoiceId?: string;
  paidAt?: Date;
  createdAt: Date;
}

export interface IGameSession {
  categoryId: string;
  level: number;
  questions: IQuestion[];
  currentIndex: number;
  score: number;
  lives: number;
  coins: number;
  startedAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  todayActiveUsers: number;
  totalPayments: number;
  totalRevenue: number;
  avgScore: number;
  totalCoinSpent: number;
}
