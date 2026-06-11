import mongoose, { Schema, Document } from 'mongoose';

export interface IConfessionAttempt {
  guessName: string;
  contactInfo: string;
  matched: boolean;
  createdAt: Date;
}

export interface IConfession extends Document {
  userId: string;
  secretToken: string;
  creatorName: string;
  creatorHandle: string;
  creatorContact: string;
  attempts: IConfessionAttempt[];
  matched: boolean;
  matchedWith?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConfessionSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  secretToken: { type: String, required: true },
  creatorName: { type: String, required: true },
  creatorHandle: { type: String, required: true },
  creatorContact: { type: String, required: true },
  attempts: [{
    guessName: { type: String, required: true },
    contactInfo: { type: String, required: true },
    matched: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  matched: { type: Boolean, required: true, default: false },
  matchedWith: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<IConfession>('Confession', ConfessionSchema);
