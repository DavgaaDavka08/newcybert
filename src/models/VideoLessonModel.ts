import mongoose, { Schema } from "mongoose";

export interface IVideoLesson {
  title: string;
  description: string;
  publicId: string;
  url: string;
  thumbnailUrl?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  uploadedBy: string;
  uploadedByName?: string;
}

const VideoLessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    durationSec: { type: Number },
    width: { type: Number },
    height: { type: Number },
    uploadedBy: { type: String, required: true },
    uploadedByName: { type: String },
  },
  { timestamps: true }
);

VideoLessonSchema.index({ createdAt: -1 });

export const VideoLessonModel =
  mongoose.models.VideoLesson || mongoose.model("VideoLesson", VideoLessonSchema);
