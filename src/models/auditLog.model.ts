import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  actorEmail: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  metadata?: any;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  actorEmail: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  userAgent: {
    type: String,
    required: true,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
