import express from 'express';
import { protect } from '../middleware/auth.js';
import { getStudentAvailableNotes, getStudentNoteDetail } from '../controllers/studentNoteController.js';

const router = express.Router();

// GET /api/student/notes - Get notes available to a student (public + connected teachers)
router.get('/', protect, getStudentAvailableNotes);

// GET /api/student/notes/:id - Get individual teacher note details
router.get('/:id', protect, getStudentNoteDetail);

export default router;
