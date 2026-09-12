import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email?: string;
  passwordHash?: string;
  preferredPersona: 'dad' | 'mom' | 'grandparent' | 'sibling' | 'friend';
  emotionalProfile: {
    dominantEmotion?: string;
    sessionCount: number;
    lastSession?: Date;
  };
  friends: string[];
  knowledgeBase: string[];
  contact: string;
  shareContact: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    passwordHash: { type: String },
    preferredPersona: {
      type: String,
      enum: ['dad', 'mom', 'grandparent', 'sibling', 'friend'],
      default: 'mom',
    },
    emotionalProfile: {
      dominantEmotion: String,
      sessionCount: { type: Number, default: 0 },
      lastSession: Date,
    },
    friends: { type: [String], default: [] },
    knowledgeBase: { type: [String], default: [] },
    contact: { type: String, default: '' },
    shareContact: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', userSchema);
