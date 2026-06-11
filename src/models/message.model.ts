import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  sender: 'guru' | 'user';
  text: string;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  sessionId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  sender: { type: String, enum: ['guru', 'user'], required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMessage>('Message', MessageSchema);
