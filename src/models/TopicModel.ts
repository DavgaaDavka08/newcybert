import { Schema, model, models } from 'mongoose';

const TopicSchema = new Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  color:       { type: String, default: '#3B82F6' },
  icon:        { type: String, default: 'Φ' },
  order:       { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

export const TopicModel = models.Topic ?? model('Topic', TopicSchema);
