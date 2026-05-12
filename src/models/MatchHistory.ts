import mongoose, { Schema, Document } from 'mongoose';

export interface IMatchHistory extends Document {
  sessionId: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  playerName: string;
  topicName: string;
  score: number;
  rank: number;
  totalPlayers: number;
  xpEarned: number;
  coinsEarned: number;
  correctAnswers: number;
  totalQuestions: number;
  maxStreak: number;
  playedAt: Date;
}

const MatchHistorySchema = new Schema<IMatchHistory>({
  sessionId:       { type: Schema.Types.ObjectId, ref: 'GameSession', required: true },
  playerId:        { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  playerName:      { type: String, required: true },
  topicName:       { type: String, required: true },
  score:           { type: Number, required: true },
  rank:            { type: Number, required: true },
  totalPlayers:    { type: Number, required: true },
  xpEarned:        { type: Number, default: 0 },
  coinsEarned:     { type: Number, default: 0 },
  correctAnswers:  { type: Number, default: 0 },
  totalQuestions:  { type: Number, default: 0 },
  maxStreak:       { type: Number, default: 0 },
  playedAt:        { type: Date, default: Date.now },
}, { timestamps: false });

MatchHistorySchema.index({ playerId: 1, playedAt: -1 });

export const MatchHistory = mongoose.models.MatchHistory ?? mongoose.model<IMatchHistory>('MatchHistory', MatchHistorySchema);
