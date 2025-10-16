import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'blocked', 'inactive'], default: 'pending' },
  connectMessage: { type: String, default: 'Request to connect' },
  responseMessage: { type: String, default: '' },
  requestedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  lastInteraction: { type: Date, default: Date.now },
  lastStatusUpdate: { type: Date },
  notifications: [{
    type: { type: String, enum: ['request', 'approved', 'rejected', 'blocked', 'status_update'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdFor: { type: String, enum: ['student', 'teacher'], required: true },
    readAt: { type: Date }
  }]
}, { timestamps: true });

connectionSchema.index({ student: 1, teacher: 1 }, { unique: true });

const Connection = mongoose.model('Connection', connectionSchema);
export default Connection;


