// src/models/User.ts
import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:     { type: String, select: false },
    phone:        { type: String },
    province:     { type: String },
    school:       { type: String },
    /** Дунд сургуулийн анги (6–12), сурагчид */
    grade:        { type: Number, min: 6, max: 12 },
    role:         { type: String, enum: ["student", "teacher", "admin"], default: "student" },
    googleId:     { type: String, sparse: true },
    avatar:       { type: String },
    isVerified:   { type: Boolean, default: false },

    // ── Premium ──────────────────────────────────────
    isPremium:    { type: Boolean, default: false },
    premiumUntil: { type: Date },
    premiumType:  { type: String, enum: ["monthly", "pro"], default: null },

    // ── Game stats ───────────────────────────────────
    xp:           { type: Number, default: 0 },
    level:        { type: Number, default: 1 },
    coins:        { type: Number, default: 100 },
    lives:        { type: Number, default: 5 },
    maxLives:     { type: Number, default: 5 },
    streak:       { type: Number, default: 0 },
    lastLoginDate:{ type: Date },
    streakFreezeCount: { type: Number, default: 0 },

    // ── Category progress ────────────────────────────
    progress: [
      {
        categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
        level:      { type: Number, default: 1 },
        completed:  { type: Boolean, default: false },
      },
    ],

    // ── Daily free limits ────────────────────────────
    dailyFreeAIUsed:       { type: Number, default: 0 },
    dailyFreeProblemUsed:  { type: Number, default: 0 },
    lastDailyReset:        { type: Date },

    // ── Teacher code (for teacher role) ─────────────
    teacherCode: { type: String, sparse: true },
    isTeacherVerified: { type: Boolean, default: false },

    // ── Password reset ───────────────────────────────
    resetPasswordToken:   { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// XP → Level calculation
UserSchema.methods.calculateLevel = function () {
  this.level = Math.floor(this.xp / 100) + 1;
};

// Lives refill (1 life per 30 min)
UserSchema.virtual("livesRefillAt").get(function () {
  if (this.lives >= this.maxLives) return null;
  return new Date(Date.now() + 30 * 60 * 1000);
});

export const User = models.User ?? model("User", UserSchema);
