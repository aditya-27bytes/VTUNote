import express from "express";
import { protect } from "../middleware/auth.js";
import { summarize, comprehensiveAnalysis, questionAnswer } from "../controllers/aiController.js";

const router = express.Router();

router.post("/summarize", summarize); // Basic summarization
router.post("/comprehensive-analysis", comprehensiveAnalysis); // Complete analysis with flashcards, concepts, etc.
router.post("/qa", protect, questionAnswer); // Q&A endpoint for asking questions about documents

export default router;
