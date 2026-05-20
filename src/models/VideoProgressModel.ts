import mongoose, { Schema } from "mongoose";

export interface IVideoProgress {
  userId: string;
  videoId: mongoose.Types.ObjectId;
  xpAwarded: number;
}

const VideoProgressSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    videoId: { type: Schema.Types.ObjectId, ref: "VideoLesson", required: true },
    xpAwarded: { type: Number, default: 10 },
  },
  { timestamps: true },
);

VideoProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export const VideoProgressModel =
  mongoose.models.VideoProgress || mongoose.model("VideoProgress", VideoProgressSchema);
