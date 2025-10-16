
import express from 'express';
import { protect } from '../middleware/auth.js';
import { protectTeacher } from '../middleware/teacherAuth.js';
import {
  createQuiz,
  generateQuizFromNote,
  getQuiz,
  submitAttempt,
  getTeacherStats,
  listAvailableQuizzes
} from '../controllers/quizController.js';

const router = express.Router();

// List available quizzes for students
router.get('/', protect, listAvailableQuizzes);
// Teacher creates quiz
router.post('/', protectTeacher, createQuiz);
// Auto-generate from note flashcards
router.post('/generate', protectTeacher, generateQuizFromNote);
// Student self-generation from their notes
router.post('/generate-self', protect, generateQuizFromNote);
// Get quiz
router.get('/:id', protect, getQuiz);
// Submit attempt by student
router.post('/:id/attempts', protect, submitAttempt);
// Teacher stats
router.get('/teacher/stats/overview', protectTeacher, getTeacherStats);

export default router;


