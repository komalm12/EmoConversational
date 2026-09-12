import mongoose, { Schema, Document } from 'mongoose';

export interface IEmotionalState extends Document {
  conversationId: string;
  userId?: string;
  emotion: string;
  intensity: number; // 0-1
  confidence: number; // 0-1
  triggerText: string;
  timestamp: Date;
}

const emotionalStateSchema = new Schema<IEmotionalState>(
  {
    conversationId: { type: String, required: true, index: true },
    userId: String,
    emotion: { type: String, required: true },
    intensity: { type: Number, required: true, min: 0, max: 1 },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    triggerText: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const EmotionalStateModel = mongoose.model<IEmotionalState>(
  'EmotionalState',
  emotionalStateSchema
);
