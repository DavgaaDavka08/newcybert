import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer { questionId: string; selectedOption: string; }
export interface IAttempt extends Document {
  studentId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  answers: IAnswer[];
  score: number; totalQuestions: number;
  isSubmitted: boolean; finishedAt?: Date;
  createdAt: Date; updatedAt: Date;
}

const answerSchema = new Schema<IAnswer>(
  { questionId: String, selectedOption: String },
  { _id: false }
);
const attemptSchema = new Schema<IAttempt>(
  {
    studentId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examId:         { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    answers:        { type: [answerSchema], default: [] },
    score:          { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    isSubmitted:    { type: Boolean, default: false },
    finishedAt:     Date,
  },
  { timestamps: true }
);

attemptSchema.index({ studentId: 1, examId: 1 });

export const AttemptModel = mongoose.models.Attempt ?? mongoose.model<IAttempt>('Attempt', attemptSchema);
