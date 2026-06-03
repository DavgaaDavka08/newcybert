// ── Socket.IO Server ─────────────────────────────────────────
// Standalone server — run with: npx ts-node src/socket/server.ts
// Or integrate with Next.js custom server.
//
// Install: npm install socket.io
//
// NOTE: For development, this runs on port 3001 separately from Next.js (port 3000).
// For production, use a dedicated WebSocket service or integrate with a custom server.

import { createServer } from 'http';
import { EVENTS } from './events';
import type {
  CreateGamePayload, JoinGamePayload, SubmitAnswerPayload,
  LeaderboardEntry, PlayerJoinedPayload,
} from './events';

interface Player {
  id: string;
  name: string;
  socketId: string;
  score: number;
  streak: number;
  isConnected: boolean;
  answers: number[];
  lastAnswerTime?: number;
}

interface GameSession {
  id: string;
  pin: string;
  hostSocketId: string;
  hostId: string;
  topicId: string;
  status: 'waiting' | 'active' | 'paused' | 'finished';
  currentQuestion: number;
  timerSeconds: number;
  players: Map<string, Player>;
  timerInterval?: ReturnType<typeof setInterval>;
  roomId: string;
}

const sessions = new Map<string, GameSession>();
const pinToSession = new Map<string, string>();
const socketToSession = new Map<string, string>();

function generatePIN(): string {
  let pin: string;
  do { pin = String(Math.floor(100000 + Math.random() * 900000)); } while (pinToSession.has(pin));
  return pin;
}

function buildLeaderboard(session: GameSession): LeaderboardEntry[] {
  return Array.from(session.players.values())
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      rank: i + 1,
      playerId: p.id,
      playerName: p.name,
      score: p.score,
      streak: p.streak,
      isConnected: p.isConnected,
    }));
}

function validatePin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

// Anti-spam: track last action time per socket
const lastAction = new Map<string, number>();
function rateLimited(socketId: string, minMs = 200): boolean {
  const now = Date.now();
  const last = lastAction.get(socketId) ?? 0;
  if (now - last < minMs) return true;
  lastAction.set(socketId, now);
  return false;
}

async function startSocketServer(port = 3001) {
  try {
    // Dynamic import — server-only
    const { Server } = await import('socket.io');
    const httpServer = createServer();
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket: any) => {
      console.log(`[Socket] Connected: ${socket.id}`);

      // ── CREATE GAME (admin) ──────────────────────────
      socket.on(EVENTS.CREATE_GAME, (payload: CreateGamePayload) => {
        if (rateLimited(socket.id, 1000)) return;
        const sessionId = `sess_${Date.now()}`;
        const pin       = generatePIN();
        const roomId    = `room_${sessionId}`;

        const session: GameSession = {
          id: sessionId, pin, hostSocketId: socket.id, hostId: payload.hostId,
          topicId: payload.topicId, status: 'waiting', currentQuestion: 0,
          timerSeconds: payload.timerSeconds, players: new Map(), roomId,
        };

        sessions.set(sessionId, session);
        pinToSession.set(pin, sessionId);
        socketToSession.set(socket.id, sessionId);
        socket.join(roomId);

        socket.emit(EVENTS.GAME_CREATED, { sessionId, pin, topicId: payload.topicId });
        console.log(`[Socket] Game created: PIN=${pin}, Session=${sessionId}`);
      });

      // ── JOIN GAME (student) ──────────────────────────
      socket.on(EVENTS.JOIN_GAME, (payload: JoinGamePayload) => {
        if (!validatePin(payload.pin)) { socket.emit(EVENTS.ERROR, { message: 'Invalid PIN' }); return; }
        const sessionId = pinToSession.get(payload.pin);
        if (!sessionId) { socket.emit(EVENTS.ERROR, { message: 'Game not found' }); return; }
        const session = sessions.get(sessionId);
        if (!session) { socket.emit(EVENTS.ERROR, { message: 'Session expired' }); return; }
        if (session.status === 'finished') { socket.emit(EVENTS.ERROR, { message: 'Game already finished' }); return; }

        const player: Player = {
          id: payload.playerId, name: payload.playerName,
          socketId: socket.id, score: 0, streak: 0, isConnected: true, answers: [],
        };
        session.players.set(payload.playerId, player);
        socketToSession.set(socket.id, sessionId);
        socket.join(session.roomId);

        const joinedPayload: PlayerJoinedPayload = {
          playerId: payload.playerId, playerName: payload.playerName,
          totalPlayers: session.players.size,
        };
        io.to(session.roomId).emit(EVENTS.PLAYER_JOINED, joinedPayload);
        console.log(`[Socket] ${payload.playerName} joined game ${session.pin}`);
      });

      // ── START GAME (admin) ───────────────────────────
      socket.on(EVENTS.START_GAME, (data: { sessionId: string }) => {
        const session = sessions.get(data.sessionId);
        if (!session || session.hostSocketId !== socket.id) return;
        session.status = 'active';
        io.to(session.roomId).emit(EVENTS.GAME_STARTED, { sessionId: session.id });
      });

      // ── PAUSE / RESUME / END ─────────────────────────
      socket.on(EVENTS.PAUSE_GAME,  (d: { sessionId: string }) => {
        const s = sessions.get(d.sessionId);
        if (!s || s.hostSocketId !== socket.id) return;
        s.status = 'paused';
        clearInterval(s.timerInterval);
        io.to(s.roomId).emit(EVENTS.GAME_PAUSED, {});
      });

      socket.on(EVENTS.RESUME_GAME, (d: { sessionId: string }) => {
        const s = sessions.get(d.sessionId);
        if (!s || s.hostSocketId !== socket.id) return;
        s.status = 'active';
        io.to(s.roomId).emit(EVENTS.GAME_RESUMED, {});
      });

      socket.on(EVENTS.END_GAME, (d: { sessionId: string }) => {
        const s = sessions.get(d.sessionId);
        if (!s || s.hostSocketId !== socket.id) return;
        clearInterval(s.timerInterval);
        s.status = 'finished';
        io.to(s.roomId).emit(EVENTS.GAME_FINISHED, { leaderboard: buildLeaderboard(s) });
      });

      // ── NEXT QUESTION (admin) ────────────────────────
      socket.on(EVENTS.NEXT_QUESTION, (d: { sessionId: string; question: unknown }) => {
        const s = sessions.get(d.sessionId);
        if (!s || s.hostSocketId !== socket.id) return;
        clearInterval(s.timerInterval);
        s.currentQuestion++;

        let remaining = s.timerSeconds;
        io.to(s.roomId).emit(EVENTS.QUESTION_PUSHED, Object.assign({}, d.question as object, { index: s.currentQuestion, timerSeconds: s.timerSeconds }));

        s.timerInterval = setInterval(() => {
          remaining--;
          io.to(s.roomId).emit(EVENTS.TIMER_UPDATE, { remaining, total: s.timerSeconds });
          if (remaining <= 0) clearInterval(s.timerInterval);
        }, 1000);
      });

      // ── SUBMIT ANSWER (student) ──────────────────────
      socket.on(EVENTS.SUBMIT_ANSWER, (payload: SubmitAnswerPayload) => {
        if (rateLimited(socket.id)) return;
        const session = sessions.get(payload.sessionId);
        if (!session || session.status !== 'active') return;
        const player = session.players.get(payload.playerId);
        if (!player) return;
        if (player.answers[payload.questionIndex] !== undefined) return; // already answered

        // Scoring: speed bonus
        const speedBonus = Math.max(0, Math.floor((1 - payload.timeMs / (session.timerSeconds * 1000)) * 5));
        const correct    = payload.answerIndex === 0; // Real impl: validate against question DB
        const baseXP     = correct ? 10 : 0;
        const xpEarned   = correct ? baseXP + speedBonus : 0;

        player.answers[payload.questionIndex] = payload.answerIndex;
        if (correct) { player.score += 10 + speedBonus; player.streak++; }
        else { player.streak = 0; }

        socket.emit(EVENTS.ANSWER_RESULT, {
          playerId: payload.playerId, correct, xpEarned, coinsEarned: correct ? 5 : 0,
          streak: player.streak, correctIndex: 0,
        });

        // Broadcast updated leaderboard
        io.to(session.roomId).emit(EVENTS.LEADERBOARD_UPDATE, {
          entries: buildLeaderboard(session), questionIndex: session.currentQuestion,
        });
      });

      // ── ANNOUNCEMENT (admin) ─────────────────────────
      socket.on(EVENTS.SEND_ANNOUNCEMENT, (d: { sessionId: string; message: string }) => {
        const s = sessions.get(d.sessionId);
        if (!s || s.hostSocketId !== socket.id) return;
        io.to(s.roomId).emit(EVENTS.ANNOUNCEMENT, { message: d.message, from: 'Багш', type: 'info' });
      });

      // ── KICK (admin) ─────────────────────────────────
      socket.on(EVENTS.KICK_PLAYER, (d: { sessionId: string; playerId: string }) => {
        const s = sessions.get(d.sessionId);
        if (!s || s.hostSocketId !== socket.id) return;
        const player = s.players.get(d.playerId);
        if (player) {
          s.players.delete(d.playerId);
          io.to(player.socketId).emit(EVENTS.PLAYER_KICKED, { reason: 'Kicked by host' });
          io.to(s.roomId).emit(EVENTS.PLAYER_LEFT, { playerId: d.playerId, totalPlayers: s.players.size });
        }
      });

      // ── DISCONNECT ───────────────────────────────────
      socket.on('disconnect', () => {
        const sessionId = socketToSession.get(socket.id);
        socketToSession.delete(socket.id);
        if (!sessionId) return;
        const session = sessions.get(sessionId);
        if (!session) return;

        // Mark player disconnected (don't remove — allow reconnect)
        session.players.forEach(p => {
          if (p.socketId === socket.id) {
            p.isConnected = false;
            io.to(session.roomId).emit(EVENTS.PLAYER_LEFT, { playerId: p.id, totalPlayers: session.players.size });
          }
        });

        // If host disconnected, pause game
        if (session.hostSocketId === socket.id) {
          session.status = 'paused';
          clearInterval(session.timerInterval);
          io.to(session.roomId).emit(EVENTS.GAME_PAUSED, { reason: 'Host disconnected' });
        }

        console.log(`[Socket] Disconnected: ${socket.id}`);
      });

      // ── RECONNECT SYNC ───────────────────────────────
      socket.on(EVENTS.RECONNECT_SYNC, (d: { sessionId?: string; playerId?: string; pin?: string }) => {
        const sessionId = d.sessionId ?? (d.pin ? pinToSession.get(d.pin) : undefined);
        if (!sessionId) return;
        const session = sessions.get(sessionId);
        if (!session) return;

        // Re-join room and restore player state
        socket.join(session.roomId);
        if (d.playerId) {
          const player = session.players.get(d.playerId);
          if (player) {
            player.socketId = socket.id;
            player.isConnected = true;
            socketToSession.set(socket.id, sessionId);
          }
        }

        socket.emit(EVENTS.RECONNECT_SYNC, {
          sessionId, status: session.status,
          currentQuestion: session.currentQuestion,
          leaderboard: buildLeaderboard(session),
        });
      });
    });

    httpServer.listen(port, () => {
      console.log(`[Socket] Server running on port ${port}`);
    });
  } catch {
    console.error('[Socket] Failed to start — install socket.io: npm install socket.io');
  }
}

startSocketServer();
