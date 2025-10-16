import express from 'express';
import { protect } from '../middleware/auth.js';
import { protectTeacher } from '../middleware/teacherAuth.js';
import { 
  connectToTeacher, 
  listStudentConnections, 
  listTeacherStudents, 
  getAvailableTeachers,
  respondToConnection,
  updateConnectionStatus,
  markNotificationsRead 
} from '../controllers/connectionController.js';

const router = express.Router();

// Student routes
router.post('/connect', protect, connectToTeacher);
router.get('/me', protect, listStudentConnections);
router.get('/teachers', protect, getAvailableTeachers);
router.patch('/status/:connectionId', protect, updateConnectionStatus);
router.post('/notifications/read', protect, markNotificationsRead);

// Teacher routes
router.get('/teacher/students', protectTeacher, listTeacherStudents);
router.patch('/teacher/respond/:connectionId', protectTeacher, respondToConnection);
router.post('/teacher/notifications/read', protectTeacher, markNotificationsRead);

export default router;


