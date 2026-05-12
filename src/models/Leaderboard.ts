import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaderboardEntry extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  period: 'daily' | 'weekly' | 'alltime';
  xp: number;
  score: number;
  level: number;
  gamesPlayed: number;
  rank: number;
  updatedAt: Date;
}

const LeaderboardSchema = new Schema<ILeaderboardEntry>({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName:    { type: String, required: true },
  period:      { type: String, enum: ['daily', 'weekly', 'alltime'], required: true },
  xp:          { type: Number, default: 0 },
  score:       { type: Number, default: 0 },
  level:       { type: Number, default: 1 },
  gamesPlayed: { type: Number, default: 0 },
  rank:        { type: Number, default: 0 },
  updatedAt:   { type: Date, default: Date.now },
}, { timestamps: false });

LeaderboardSchema.index({ period: 1, xp: -1 });
LeaderboardSchema.index({ userId: 1, period: 1 }, { unique: true });

export const Leaderboard = mongoose.models.Leaderboard ?? mongoose.model<ILeaderboardEntry>('Leaderboard', LeaderboardSchema);
