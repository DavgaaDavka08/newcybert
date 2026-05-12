'use client';
// ── Socket.IO Client ─────────────────────────────────────────
// Manages the singleton socket connection with reconnect support

import { EVENTS } from './events';
import type {
  JoinGamePayload, SubmitAnswerPayload,
  LeaderboardUpdatePayload, PlayerJoinedPayload,
  QuestionPayload, AnswerResultPayload,
  TimerUpdatePayload, AnnouncementPayload,
} from './events';

// Dynamic import guard — socket.io-client is optional
type SocketInstance = {
  id: string;
  connected: boolean;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  off: (event: string, cb?: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
  disconnect: () => void;
  connect: () => void;
};

let socket: SocketInstance | null = null;
let socketUrl = '';

export async function getSocket(url?: string): Promise<SocketInstance | null> {
  if (typeof window === 'undefined') return null;

  const targetUrl = url ?? socketUrl ?? process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

  if (socket && socket.connected && socketUrl === targetUrl) return socket;

  try {
    // Dynamic import so app doesn't break without socket.io-client installed
    const { io } = await import('socket.io-client');
    socketUrl = targetUrl;

    if (socket) socket.disconnect();

    socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    }) as unknown as SocketInstance;

    return socket;
  } catch {
    // socket.io-client not installed — silently no-op
    console.warn('[Socket] socket.io-client not available. Install with: npm install socket.io-client');
    return null;
  }
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

// ── Typed helper functions ────────────────────────────────────
export async function joinGame(payload: JoinGamePayload) {
  const s = await getSocket();
  s?.emit(EVENTS.JOIN_GAME, payload);
}

export async function submitAnswer(payload: SubmitAnswerPayload) {
  const s = await getSocket();
  s?.emit(EVENTS.SUBMIT_ANSWER, payload);
}

export async function leaveGame(sessionId: string, playerId: string) {
  const s = await getSocket();
  s?.emit(EVENTS.LEAVE_GAME, { sessionId, playerId });
}

// ── React hook ────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';

export function useSocket() {
  const [connected, setConnected]       = useState(false);
  const [sessionId, setSessionId]       = useState<string | null>(null);
  const [leaderboard, setLeaderboard]   = useState<LeaderboardUpdatePayload | null>(null);
  const [currentQ, setCurrentQ]         = useState<QuestionPayload | null>(null);
  const [timer, setTimer]               = useState<TimerUpdatePayload | null>(null);
  const [announcement, setAnnouncement] = useState<AnnouncementPayload | null>(null);
  const [lastAnswer, setLastAnswer]     = useState<AnswerResultPayload | null>(null);
  const [players, setPlayers]           = useState<PlayerJoinedPayload[]>([]);
  const socketRef = useRef<SocketInstance | null>(null);

  useEffect(() => {
    let mounted = true;
    getSocket().then(s => {
      if (!s || !mounted) return;
      socketRef.current = s;

      s.on('connect',     () => mounted && setConnected(true));
      s.on('disconnect',  () => mounted && setConnected(false));

      s.on(EVENTS.LEADERBOARD_UPDATE, (data: unknown) => mounted && setLeaderboard(data as LeaderboardUpdatePayload));
      s.on(EVENTS.QUESTION_PUSHED,    (data: unknown) => mounted && setCurrentQ(data as QuestionPayload));
      s.on(EVENTS.TIMER_UPDATE,       (data: unknown) => mounted && setTimer(data as TimerUpdatePayload));
      s.on(EVENTS.ANNOUNCEMENT,       (data: unknown) => mounted && setAnnouncement(data as AnnouncementPayload));
      s.on(EVENTS.ANSWER_RESULT,      (data: unknown) => mounted && setLastAnswer(data as AnswerResultPayload));
      s.on(EVENTS.PLAYER_JOINED,      (data: unknown) => mounted && setPlayers(prev => [...prev, data as PlayerJoinedPayload]));
      s.on(EVENTS.GAME_CREATED,       (data: unknown) => mounted && setSessionId((data as { sessionId: string }).sessionId));

      s.on(EVENTS.RECONNECT_SYNC, (data: unknown) => {
        const sync = data as { sessionId?: string };
        if (mounted && sync.sessionId) setSessionId(sync.sessionId);
      });

      setConnected(s.connected);
    });

    return () => {
      mounted = false;
      const s = socketRef.current;
      if (s) {
        [EVENTS.LEADERBOARD_UPDATE, EVENTS.QUESTION_PUSHED, EVENTS.TIMER_UPDATE,
          EVENTS.ANNOUNCEMENT, EVENTS.ANSWER_RESULT, EVENTS.PLAYER_JOINED,
          EVENTS.GAME_CREATED, EVENTS.RECONNECT_SYNC].forEach(ev => s.off(ev));
      }
    };
  }, []);

  return { connected, sessionId, leaderboard, currentQ, timer, announcement, lastAnswer, players, socket: socketRef.current };
}
