// src/types/index.ts

export type UserRole = "student" | "teacher" | "admin";

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  province?: string;
  school?: string;
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
