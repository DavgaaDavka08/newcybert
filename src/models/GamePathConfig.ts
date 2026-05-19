import { Schema, model, models } from 'mongoose';

const LessonNodeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['lesson', 'quiz', 'lab', 'boss', 'review'],
      default: 'lesson',
    },
    xp: { type: Number, default: 10 },
    coins: { type: Number, default: 5 },
  },
  { _id: false }
);

const PathTopicSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: 'zap' },
    color: { type: String, default: '#2563EB' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

/** Singleton game path (topics + 10 lesson nodes template per topic). */
const GamePathConfigSchema = new Schema(
  {
    key: { type: String, default: 'default', unique: true },
    topics: { type: [PathTopicSchema], default: [] },
    lessonNodes: { type: [LessonNodeSchema], default: [] },
  },
  { timestamps: true }
);

export type IPathTopic = { id: string; name: string; icon: string; color: string; order: number };
export type ILessonNode = { title: string; type: string; xp: number; coins: number };

/** Lean document shape for API routes (avoid `lean()` union typing issues). */
export type GamePathConfigLean = {
  key?: string;
  topics?: IPathTopic[];
  lessonNodes?: ILessonNode[];
};

export const GamePathConfig = models.GamePathConfig ?? model('GamePathConfig', GamePathConfigSchema);
