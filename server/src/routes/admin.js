import express from "express";
import { protect, isAdmin } from "../middleware/auth.js";
import { 
  getUsers, 
  deleteUser, 
  updateRole, 
  getDashboardStats, 
  getNotes, 
  deleteNote,
  toggleNoteVisibility,
  getPublicNotes 
} from "../controllers/adminController.js";

const router = express.Router();

// Dashboard and Analytics
router.get("/dashboard-stats", protect, isAdmin, getDashboardStats);

// User Management
router.get("/users", protect, isAdmin, getUsers);
router.delete("/users/:id", protect, isAdmin, deleteUser);
router.patch("/users/:id/role", protect, isAdmin, updateRole);

// Note Management
router.get("/notes", protect, isAdmin, getNotes);
router.get("/public-notes", protect, isAdmin, getPublicNotes);
router.delete("/notes/:id", protect, isAdmin, deleteNote);
router.patch("/notes/:id/visibility", protect, isAdmin, toggleNoteVisibility);

export default router;
