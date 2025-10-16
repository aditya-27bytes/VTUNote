import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getTeacherNotes,
  getTeacherNoteById,
  serveTeacherNotePdf,
  createTeacherNote,
  updateTeacherNote,
  deleteTeacherNote,
  publishTeacherNote,
  unpublishTeacherNote,
  getTeacherNoteStats,
  getAllTeacherNotes,
  servePublicTeacherNotePdf
} from '../controllers/teacherNoteController.js';
import { protectTeacher, isVerifiedTeacher, isActiveTeacher } from '../middleware/teacherAuth.js';

const router = express.Router();

// Create uploads directory for teacher notes if it doesn't exist
const teacherNotesDir = path.join(process.cwd(), 'uploads/teacher-notes');
if (!fs.existsSync(teacherNotesDir)) {
  fs.mkdirSync(teacherNotesDir, { recursive: true });
}

// Configure multer storage for teacher notes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, teacherNotesDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Public route for students to view teacher notes
router.get('/public', getAllTeacherNotes);

// Public route for students to download teacher note PDFs
router.get('/public/pdf/:id', servePublicTeacherNotePdf);

// Protected teacher routes - Removed verification requirements for basic operations
router.get('/stats', protectTeacher, isActiveTeacher, getTeacherNoteStats);
router.get('/', protectTeacher, isActiveTeacher, getTeacherNotes);
router.get('/pdf/:id', protectTeacher, isActiveTeacher, serveTeacherNotePdf);
router.get('/:id', protectTeacher, isActiveTeacher, getTeacherNoteById);
router.post('/', protectTeacher, isActiveTeacher, upload.single('file'), createTeacherNote);
router.put('/:id', protectTeacher, isActiveTeacher, updateTeacherNote);
router.delete('/:id', protectTeacher, isActiveTeacher, deleteTeacherNote);
// Publishing requires verification
router.put('/:id/publish', protectTeacher, isVerifiedTeacher, isActiveTeacher, publishTeacherNote);
router.put('/:id/unpublish', protectTeacher, isActiveTeacher, unpublishTeacherNote);

export default router;
