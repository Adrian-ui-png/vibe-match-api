import mongoose, { Schema, Document } from 'mongoose';

export interface IUnlockedReport {
  tierName: string;
  matchPercentage: number;
  overallDescription: string;
  crushHacks: string[];
  icebreaker: string;
}

export interface ITransaction extends Document {
  userId?: mongoose.Types.ObjectId;
  featureType: 'quiz' | 'roast' | 'confess' | 'predict' | 'certificate';
  paymentStatus: 'pending' | 'completed' | 'failed';
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
  sessionId?: string;
  unlockedInsights?: any;

  // Vibe Quiz (Original)
  userNames?: {
    self: string;
    crush: string;
  };
  totalScore?: number;
  tier?: 'Tier 1' | 'Tier 2' | 'Tier 3';
  unlockedReport?: IUnlockedReport;

  // AI Photo Roast
  photoBase64?: string;
  roastOutput?: string[];

  // AI Future Prediction
  predictionInputs?: {
    name: string;
    major: string;
    dreamLife: string;
  };
  predictionOutput?: string;

  // Smart Certificate
  certificateInputs?: {
    name: string;
    testType: 'rizz' | 'greenflag' | 'audit';
    score: number;
    title: string;
  };
  certificateOutput?: {
    score: number;
    title: string;
    badgeColor: string;
  };

  // Crush Confession setup
  confessInputs?: {
    creatorName: string;
    creatorHandle: string;
    creatorContact: string;
  };
}

const UnlockedReportSchema: Schema = new Schema({
  tierName: { type: String, required: true },
  matchPercentage: { type: Number, required: true },
  overallDescription: { type: String, required: true },
  crushHacks: [{ type: String, required: true }],
  icebreaker: { type: String, required: true }
});

const TransactionSchema: Schema = new Schema({
  featureType: {
    type: String,
    enum: ['quiz', 'roast', 'confess', 'predict', 'certificate'],
    default: 'quiz',
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
    required: true
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  razorpayOrderId: { type: String, required: true, unique: true, index: true },
  razorpayPaymentId: { type: String },
  sessionId: { type: String, index: true },
  unlockedInsights: { type: Schema.Types.Mixed },

  // Vibe Quiz (made optional)
  userNames: {
    self: { type: String },
    crush: { type: String }
  },
  totalScore: { type: Number },
  tier: { 
    type: String, 
    enum: ['Tier 1', 'Tier 2', 'Tier 3']
  },
  unlockedReport: { type: UnlockedReportSchema },

  // AI Photo Roast
  photoBase64: { type: String },
  roastOutput: [{ type: String }],

  // AI Future Prediction
  predictionInputs: {
    name: { type: String },
    major: { type: String },
    dreamLife: { type: String }
  },
  predictionOutput: { type: String },

  // Smart Certificate
  certificateInputs: {
    name: { type: String },
    testType: { type: String, enum: ['rizz', 'greenflag', 'audit'] },
    score: { type: Number },
    title: { type: String }
  },
  certificateOutput: {
    score: { type: Number },
    title: { type: String },
    badgeColor: { type: String }
  },

  // Crush Confession
  confessInputs: {
    creatorName: { type: String },
    creatorHandle: { type: String },
    creatorContact: { type: String }
  }
}, {
  timestamps: true
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
