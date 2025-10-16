import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  givenAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  correctAnswer: { type: String, required: true },
  explanation: { type: String },
  question: { type: String }
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true }, // percentage 0-100
  totalQuestions: { type: Number, required: true },
  correctCount: { type: Number, required: true },
  answers: { type: [answerSchema], default: [] },
  startedAt: { type: Date, required: true },
  finishedAt: { type: Date, required: true }
}, { timestamps: true });

quizAttemptSchema.index({ quiz: 1, student: 1, createdAt: -1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;


