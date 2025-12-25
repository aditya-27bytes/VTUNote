import express from 'express';
import { protect } from '../middleware/auth.js';
import { createPlan, getPlans, deletePlan } from '../controllers/studyPlannerController.js';

const router = express.Router();

// Create a new study plan
router.post('/', protect, createPlan);

// List current user's plans
router.get('/', protect, getPlans);

// Delete plan
router.delete('/:id', protect, deletePlan);

export default router;
