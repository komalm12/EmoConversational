import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  userId?: string;
  sessionId: string;
  personaType: 'dad' | 'mom' | 'grandparent' | 'sibling';
  messages: IMessage[];
  emotionalJourney: Array<{
    emotion: string;
    intensity: number;
    timestamp: Date;
  }>;
  sessionDuration: number; // seconds
  mode: 'voice' | 'text';
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    emotion: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversation>(
  {
    userId: String,
    sessionId: { type: String, required: true, index: true },
    personaType: {
      type: String,
      enum: ['dad', 'mom', 'grandparent', 'sibling'],
      required: true,
    },
    messages: [messageSchema],
    emotionalJourney: [
      {
        emotion: String,
        intensity: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    sessionDuration: { type: Number, default: 0 },
    mode: { type: String, enum: ['voice', 'text'], default: 'text' },
  },
  { timestamps: true }
);

export const ConversationModel = mongoose.model<IConversation>(
  'Conversation',
  conversationSchema
);
