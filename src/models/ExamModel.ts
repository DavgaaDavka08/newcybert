import mongoose, { Schema, Document } from 'mongoose';

export interface IOption { id: string; text: string; }
export interface IQuestion {
  id: string; question: string;
  options: IOption[]; correctAnswer: string;
}
export interface IExam extends Document {
  title: string; description?: string;
  duration: number; questions: IQuestion[];
  createdAt: Date; updatedAt: Date;
}

const optionSchema = new Schema<IOption>({ id: String, text: String }, { _id: false });
const questionSchema = new Schema<IQuestion>(
  { id: String, question: String, options: [optionSchema], correctAnswer: String },
  { _id: false }
);
const examSchema = new Schema<IExam>(
  { title: { type: String, required: true }, description: String, duration: { type: Number, default: 60 }, questions: [questionSchema] },
  { timestamps: true }
);

export const ExamModel = mongoose.models.Exam ?? mongoose.model<IExam>('Exam', examSchema);
