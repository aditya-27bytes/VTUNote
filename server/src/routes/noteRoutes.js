import express from "express";
import Note from "../models/Note.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Map provider ids to generic model labels for responses/UI
function mapProviderToModelLabel(provider) {
  switch (provider) {
    case 'perplexity': return 'Model 1';
    case 'openai': return 'Model 2';
    case 'gemini': return 'Model 3';
    case 'huggingface': return 'Model 4';
    default: return provider || 'Model';
  }
}

// Create comprehensive note with all features
router.post("/", protect, async (req, res) => {
  try {
    const {
      title,
      module,
      subject,
      semester,
      branch,
      content,
      summary,
      provider,
      numPages,
      extractedText,
      flashcards,
      keyPoints,
      concepts,
      extractedImages,
      isPublic,
      pdfPath,
      originalFileName
    } = req.body;

    // Validation
    if (!title || !module || !subject || !semester || !branch) {
      return res.status(400).json({ 
        error: "Title, module, subject, semester, and branch are required" 
      });
    }

    const newNote = new Note({
      title,
      module,
      subject,
      semester: parseInt(semester),
      branch,
      content,
      summary,
      provider,
      numPages,
      extractedText,
      flashcards: flashcards || [],
      keyPoints: keyPoints || [],
      concepts: concepts || [],
      extractedImages: extractedImages || [],
      isPublic: Boolean(isPublic),
      pdfPath: pdfPath,
      originalFileName: originalFileName,
      owner: req.user._id
    });

    const savedNote = await newNote.save();
    console.log(`✅ Note saved successfully: ${savedNote.title}`);
    
    const noteObj = savedNote.toObject ? savedNote.toObject() : savedNote;
    if (noteObj.provider) noteObj.provider = mapProviderToModelLabel(noteObj.provider);
    res.status(201).json({ 
      message: "Note created successfully", 
      note: noteObj 
    });
  } catch (err) {
    console.error("Create note error:", err);
    res.status(500).json({ error: "Server error while creating note" });
  }
});

// Get all notes with filtering options
router.get("/", protect, async (req, res) => {
  try {
    const { module, subject, semester, branch, isPublic } = req.query;
    
    // Build filter query
    let filter = { owner: req.user._id };
    
    if (module) filter.module = module;
    if (subject) filter.subject = subject;
    if (semester) filter.semester = parseInt(semester);
    if (branch) filter.branch = branch;
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
    
    const notes = await Note.find(filter)
      .sort({ createdAt: -1 })
      .select('-extractedText'); // Exclude large text field for list view
    
    const sanitizedNotes = notes.map(n => n.toObject ? ({ ...n.toObject(), provider: mapProviderToModelLabel(n.provider) }) : n);
    res.json({
      notes: sanitizedNotes,
      count: sanitizedNotes.length,
      filters: { module, subject, semester, branch, isPublic }
    });
  } catch (err) {
    console.error("Fetch notes error:", err);
    res.status(500).json({ error: "Server error while fetching notes" });
  }
});

// Get public notes (for sharing between students)
router.get("/public", async (req, res) => {
  try {
    const { module, subject, semester, branch } = req.query;
    
    let filter = { isPublic: true };
    
    if (module) filter.module = module;
    if (subject) filter.subject = subject;
    if (semester) filter.semester = parseInt(semester);
    if (branch) filter.branch = branch;
    
    const notes = await Note.find(filter)
      .populate('owner', 'name usn college')
      .sort({ createdAt: -1, likes: -1 })
      .select('-extractedText');
    
    const sanitizedPublicNotes = notes.map(n => n.toObject ? ({ ...n.toObject(), provider: mapProviderToModelLabel(n.provider) }) : n);
    res.json({
      notes: sanitizedPublicNotes,
      count: sanitizedPublicNotes.length
    });
  } catch (err) {
    console.error("Fetch public notes error:", err);
    res.status(500).json({ error: "Server error while fetching public notes" });
  }
});

// Get single note with full details
router.get("/:id", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('owner', 'name usn college');
    
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    // Check access permissions
    // Allow access if:
    // - Note is public
    // - User is owner
    // - Note is a teacher note and user is connected to teacher
    // - Note is public and owner is user's friend (connection)
    let canAccess = false;
    if (note.isPublic) {
      canAccess = true;
    } else if (note.owner._id.toString() === req.user._id.toString()) {
      canAccess = true;
    } else if (note.teacherId) {
      // Check if user is connected to teacher
      const Connection = (await import('../models/Connection.js')).default;
      const connected = await Connection.findOne({ student: req.user._id, teacher: note.teacherId, status: 'approved' });
      if (connected) canAccess = true;
    } else {
      // Check if owner is user's friend (connection)
      const Connection = (await import('../models/Connection.js')).default;
      const friendConn = await Connection.findOne({ student: req.user._id, teacher: note.owner._id, status: 'approved' });
      if (friendConn) canAccess = true;
    }
    if (!canAccess) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Increment view count
    note.views = (note.views || 0) + 1;
    await note.save();
    
    const obj = note.toObject ? note.toObject() : note;
    if (obj.provider) obj.provider = mapProviderToModelLabel(obj.provider);
    res.json(obj);
  } catch (err) {
    console.error("Fetch single note error:", err);
    res.status(500).json({ error: "Server error while fetching note" });
  }
});

// Update note
router.put("/:id", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    const updatedObj = updatedNote.toObject ? updatedNote.toObject() : updatedNote;
    if (updatedObj.provider) updatedObj.provider = mapProviderToModelLabel(updatedObj.provider);
    res.json({
      message: "Note updated successfully",
      note: updatedObj
    });
  } catch (err) {
    console.error("Update note error:", err);
    res.status(500).json({ error: "Server error while updating note" });
  }
});

// Delete note
router.delete("/:id", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    await Note.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Delete note error:", err);
    res.status(500).json({ error: "Server error while deleting note" });
  }
});

// Like/Unlike note
router.post("/:id/like", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    if (!note.isPublic) {
      return res.status(403).json({ error: "Cannot like private notes" });
    }
    
    note.likes = (note.likes || 0) + 1;
    await note.save();
    
    res.json({ message: "Note liked", likes: note.likes });
  } catch (err) {
    console.error("Like note error:", err);
    res.status(500).json({ error: "Server error while liking note" });
  }
});

// Get notes statistics
router.get("/stats/overview", protect, async (req, res) => {
  try {
    const stats = await Note.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          totalFlashcards: { $sum: { $size: "$flashcards" } },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: "$likes" },
          subjectBreakdown: {
            $push: {
              subject: "$subject",
              module: "$module"
            }
          }
        }
      }
    ]);
    
    const moduleStats = await Note.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: { subject: "$subject", module: "$module" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      overview: stats[0] || {
        totalNotes: 0,
        totalFlashcards: 0,
        totalViews: 0,
        totalLikes: 0
      },
      moduleBreakdown: moduleStats
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Server error while fetching stats" });
  }
});

export default router;
