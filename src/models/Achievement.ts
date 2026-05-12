import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'streak_7' | 'streak_30' | 'perfect_score' | 'level_5' | 'level_10' | 'first_win' | 'top_3';
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  earnedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:        { type: String, required: true },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  icon:        { type: String, default: '🏆' },
  xpReward:    { type: Number, default: 50 },
  earnedAt:    { type: Date, default: Date.now },
}, { timestamps: false });

AchievementSchema.index({ userId: 1, type: 1 }, { unique: true });

export const Achievement = mongoose.models.Achievement ?? mongoose.model<IAchievement>('Achievement', AchievementSchema);
