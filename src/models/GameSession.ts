import mongoose, { Schema, Document } from "mongoose";

export interface ILivePlayer {
  playerId: string;
  playerName: string;
  score: number;
  streak: number;
  isConnected: boolean;
  answers: number[];
  joinedAt: Date;
}

export interface IGameSession extends Document {
  pin: string;
  hostId: mongoose.Types.ObjectId;
  topicId: string;
  topicName: string;
  status: "waiting" | "active" | "paused" | "finished";
  currentQuestion: number;
  timerSeconds: number;
  players: ILivePlayer[];
  announcement?: string;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}

const LivePlayerSchema = new Schema<ILivePlayer>(
  {
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    score: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    isConnected: { type: Boolean, default: true },
    answers: { type: [Number], default: [] },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const GameSessionSchema = new Schema<IGameSession>(
  {
    pin: { type: String, required: true, unique: true, index: true },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    topicId: { type: String, required: true },
    topicName: { type: String, required: true },
    status: {
      type: String,
      enum: ["waiting", "active", "paused", "finished"],
      default: "waiting",
    },
    currentQuestion: { type: Number, default: 0 },
    timerSeconds: { type: Number, default: 30 },
    players: { type: [LivePlayerSchema], default: [] },
    announcement: { type: String },
    startedAt: { type: Date },
    finishedAt: { type: Date },
  },
  { timestamps: true },
);

GameSessionSchema.index(
  { finishedAt: 1 },
  {
    expireAfterSeconds: 86400,
    partialFilterExpression: { status: "finished" },
  },
);

export const GameSession =
  mongoose.models.GameSession ??
  mongoose.model<IGameSession>("GameSession", GameSessionSchema);
