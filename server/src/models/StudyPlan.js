import mongoose from 'mongoose';

const StudyPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  scheduledAt: { type: Date, required: true },
  notified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('StudyPlan', StudyPlanSchema);
