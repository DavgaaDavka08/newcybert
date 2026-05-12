// src/models/Category.ts
import { Schema, model, models } from "mongoose";

const CategorySchema = new Schema(
  {
    name:        { type: String, required: true },
    nameEn:      { type: String },
    icon:        { type: String, default: "⚡" },
    color:       { type: String, default: "#FFD23F" },
    totalLevels: { type: Number, default: 5 },
    isActive:    { type: Boolean, default: true },
    order:       { type: Number, default: 0 },
    description: { type: String },
  },
  { timestamps: true }
);

export const Category = models.Category ?? model("Category", CategorySchema);
