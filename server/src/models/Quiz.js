import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  // Optional MCQ options; if empty, treat as short answer comparison to correctAnswer
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [{ type: String }]
}, { _id: true });

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' },
  createdByTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  isPublic: { type: Boolean, default: false },
  questions: { type: [quizQuestionSchema], default: [] },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;


