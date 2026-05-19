import { Schema, model, models } from 'mongoose';

const QuestionEmbedSchema = new Schema({
  question:     { type: String, required: true },
  options:      { type: [String], required: true, validate: (v: string[]) => v.length === 4 },
  correctIndex: { type: Number, required: true, min: 0, max: 3 },
  explanation:  { type: String, default: '' },
}, { _id: true });

const SubtopicSchema = new Schema({
  topicId:     { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  content:     { type: String, default: '' },
  order:       { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  questions:   { type: [QuestionEmbedSchema], default: [] },
}, { timestamps: true });

export const SubtopicModel = models.Subtopic ?? model('Subtopic', SubtopicSchema);
