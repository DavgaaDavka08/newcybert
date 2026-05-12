// ── Socket.IO Event Types ────────────────────────────────────
// All events and their payloads for the realtime game system

export const EVENTS = {
  // ── Admin → Server ─────────────────────────────────────────
  CREATE_GAME:    'create_game',
  START_GAME:     'start_game',
  PAUSE_GAME:     'pause_game',
  RESUME_GAME:    'resume_game',
  END_GAME:       'end_game',
  NEXT_QUESTION:  'next_question',
  KICK_PLAYER:    'kick_player',
  LOCK_LESSON:    'lock_lesson',
  UNLOCK_LESSON:  'unlock_lesson',
  SEND_ANNOUNCEMENT: 'send_announcement',
  SET_TIMER:      'set_timer',
  BONUS_ROUND:    'bonus_round',

  // ── Student → Server ───────────────────────────────────────
  JOIN_GAME:      'join_game',
  SUBMIT_ANSWER:  'submit_answer',
  LEAVE_GAME:     'leave_game',

  // ── Server → Clients (broadcast) ──────────────────────────
  GAME_CREATED:   'game_created',
  GAME_STARTED:   'game_started',
  GAME_PAUSED:    'game_paused',
  GAME_RESUMED:   'game_resumed',
  GAME_FINISHED:  'game_finished',
  PLAYER_JOINED:  'player_joined',
  PLAYER_LEFT:    'player_left',
  PLAYER_KICKED:  'player_kicked',
  QUESTION_PUSHED: 'question_pushed',
  ANSWER_RESULT:  'answer_result',
  LEADERBOARD_UPDATE: 'leaderboard_update',
  TIMER_UPDATE:   'timer_update',
  ANNOUNCEMENT:   'announcement',
  LESSON_LOCKED:  'lesson_locked',
  LESSON_UNLOCKED: 'lesson_unlocked',
  BONUS_STARTED:  'bonus_started',

  // ── System ─────────────────────────────────────────────────
  ERROR:          'error',
  RECONNECT_SYNC: 'reconnect_sync',
} as const;

export type EventKey = typeof EVENTS[keyof typeof EVENTS];

// ── Payload types ─────────────────────────────────────────────
export interface CreateGamePayload {
  topicId: string;
  timerSeconds: number;
  hostId: string;
}

export interface JoinGamePayload {
  pin: string;
  playerName: string;
  playerId: string;
}

export interface SubmitAnswerPayload {
  sessionId: string;
  playerId: string;
  questionIndex: number;
  answerIndex: number;
  timeMs: number;
}

export interface GameCreatedPayload {
  sessionId: string;
  pin: string;
  topic: string;
  hostId: string;
}

export interface QuestionPayload {
  index: number;
  question: string;
  options: string[];
  timerSeconds: number;
}

export interface AnswerResultPayload {
  playerId: string;
  correct: boolean;
  xpEarned: number;
  coinsEarned: number;
  streak: number;
  correctIndex: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  streak: number;
  isConnected: boolean;
}

export interface LeaderboardUpdatePayload {
  entries: LeaderboardEntry[];
  questionIndex: number;
}

export interface PlayerJoinedPayload {
  playerId: string;
  playerName: string;
  totalPlayers: number;
}

export interface TimerUpdatePayload {
  remaining: number;
  total: number;
}

export interface AnnouncementPayload {
  message: string;
  from: string;
  type: 'info' | 'warning' | 'bonus';
}
