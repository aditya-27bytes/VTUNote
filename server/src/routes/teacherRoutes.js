import express from 'express';
import {
  registerTeacher,
  loginTeacher,
  getTeacherProfile,
  updateTeacherProfile,
  getAllTeachers,
  verifyTeacher,
  toggleTeacherStatus
} from '../controllers/teacherController.js';
import { protectTeacher, isVerifiedTeacher, isActiveTeacher } from '../middleware/teacherAuth.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', registerTeacher);
router.post('/login', loginTeacher);

// Protected teacher routes
router.get('/me', protectTeacher, getTeacherProfile);
router.get('/profile', protectTeacher, getTeacherProfile);
router.put('/profile', protectTeacher, updateTeacherProfile);

// Admin routes for teacher management
router.get('/', protect, isAdmin, getAllTeachers);
router.put('/:id/verify', protect, isAdmin, verifyTeacher);
router.put('/:id/toggle-status', protect, isAdmin, toggleTeacherStatus);

export default router;
