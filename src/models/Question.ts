// src/models/Question.ts
import { Schema, model, models } from "mongoose";

const QuestionSchema = new Schema(
  {
    categoryId:   { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    level:        { type: Number, required: true, min: 1 },
    question:     { type: String, required: true },
    formula:      { type: String },
    options:      { type: [String], required: true, validate: (v: string[]) => v.length === 4 },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation:  { type: String, required: true },
    difficulty:   { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    xpReward:     { type: Number, default: 10 },
    coinReward:   { type: Number, default: 5 },
    isActive:     { type: Boolean, default: true },
    imageUrl:     { type: String },
  },
  { timestamps: true }
);

export const Question = models.Question ?? model("Question", QuestionSchema);
