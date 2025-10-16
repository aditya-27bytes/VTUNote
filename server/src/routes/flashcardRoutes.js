import express from 'express';
import { protect } from '../middleware/auth.js';
import { startSession, completeSession, userStats } from '../controllers/flashcardController.js';

const router = express.Router();

router.post('/sessions', protect, startSession);
router.post('/sessions/:sessionId/complete', protect, completeSession);
router.get('/stats/me', protect, userStats);

export default router;


