import mongoose from 'mongoose';

const flashcardAnswerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  givenAnswer: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true }
}, { _id: false });

const flashcardSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  totalCards: { type: Number, required: true },
  correctCount: { type: Number, required: true },
  accuracy: { type: Number, required: true }, // percentage
  startedAt: { type: Date, required: true },
  finishedAt: { type: Date, required: true },
  answers: { type: [flashcardAnswerSchema], default: [] }
}, { timestamps: true });

flashcardSessionSchema.index({ user: 1, note: 1, createdAt: -1 });

const FlashcardSession = mongoose.model('FlashcardSession', flashcardSessionSchema);
export default FlashcardSession;


