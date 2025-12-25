import Note from '../models/Note.js';
import Teacher from '../models/Teacher.js';
import { processWithAI } from '../services/aiService.js';

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
// @desc    Get teacher's notes
// @route   GET /api/teacher/notes
// @access  Private/Teacher
export const getTeacherNotes = async (req, res) => {
  try {
    console.log('Getting teacher notes for teacher:', req.teacher._id);
    
    const notes = await Note.find({ 
      $or: [
        { teacherId: req.teacher._id },
        { owner: req.teacher._id }
      ],
      noteType: 'teacher'
    }).populate('teacherId', 'name department designation')
    .sort({ createdAt: -1 });
    
    console.log('Found notes:', notes.length);
    
    // Sanitize provider field before sending to client
    const sanitized = notes.map(n => {
      const obj = n.toObject ? n.toObject() : n;
      obj.provider = mapProviderToModelLabel(obj.provider);
      return obj;
    });
    res.json(sanitized);
  } catch (error) {
    console.error('Get teacher notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get teacher note by ID
// @route   GET /api/teacher/notes/:id
// @access  Private/Teacher
export const getTeacherNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { teacherId: req.teacher._id },
        { owner: req.teacher._id }
      ],
      noteType: 'teacher'
    }).populate('teacherId', 'name department designation');
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    const obj = note.toObject ? note.toObject() : note;
    obj.provider = mapProviderToModelLabel(obj.provider);
    res.json(obj);
  } catch (error) {
    console.error('Get teacher note by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Serve PDF file for teacher note
// @route   GET /api/teacher/notes/pdf/:id
// @access  Private/Teacher
export const serveTeacherNotePdf = async (req, res) => {
  try {
    console.log('Serving PDF for note ID:', req.params.id);
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { teacherId: req.teacher._id },
        { owner: req.teacher._id }
      ],
      noteType: 'teacher'
    });
    
    console.log('Found note:', {
      id: note?._id,
      title: note?.title,
      pdfPath: note?.pdfPath
    });
    
    if (!note) {
      console.log('Note not found');
      return res.status(404).json({ message: 'Note not found' });
    }
    
    if (!note.pdfPath) {
      console.log('Note has no PDF path');
      return res.status(404).json({ message: 'PDF not found' });
    }
    
    // Update view count
    note.views = note.views ? note.views + 1 : 1;
    await note.save();
    
    // Send the file - handle path properly
    const fs = await import('fs');
    const path = await import('path');
    
    let filePath = note.pdfPath;
    
    // Handle both absolute and relative paths
    if (!path.default.isAbsolute(filePath)) {
      // If relative, make it absolute by joining with current working directory
      filePath = path.default.join(process.cwd(), filePath);
    } else {
      // If absolute path, use it as is
      filePath = path.default.normalize(filePath);
    }
    
    // Ensure the file exists before serving
    if (!fs.default.existsSync(filePath)) {
      console.error('PDF file not found:', filePath);
      return res.status(404).json({ message: 'PDF file not found on server' });
    }
    
    console.log('Serving PDF file:', filePath);
    
    // Set appropriate headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.default.basename(filePath)}"`);
    
    // Use sendFile with absolute path (no root needed)
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve teacher note PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create teacher note
// @route   POST /api/teacher/notes
// @access  Private/Teacher
export const createTeacherNote = async (req, res) => {
  try {
    const {
      title,
      content,
      module,
      subject,
      semester,
      branch,
      summary,
      keyPoints,
      concepts,
      isPublic,
      noteType = 'teacher',
      useAI,
      aiPrompt
    } = req.body;

    // Validate required fields
    if (!title || !module || !subject || !semester || !branch) {
      return res.status(400).json({ message: 'Missing required fields: title, module, subject, semester, branch.' });
    }
    
    // Validate that either content or PDF file is provided
    if (!content && !req.file) {
      return res.status(400).json({ message: 'Please provide either note content or upload a PDF file.' });
    }

    // Create note object with basic fields
    const noteData = {
      title,
      module,
      subject,
      semester: parseInt(semester), // Convert to number
      branch,
      summary,
      keyPoints,
      concepts,
      isPublic: isPublic === 'true', // Convert string to boolean
      noteType,
      isTeacherNote: true,
      teacherId: req.teacher._id,
      owner: req.teacher._id, // For teacher notes, owner is the teacher
      publishedDate: new Date(),
      isApproved: true // Auto-approve teacher notes
    };

    // Handle content field
    if (content) {
      noteData.content = content;
    }

    // Handle PDF file if uploaded
    if (req.file) {
      if (!req.file.path) {
        return res.status(400).json({ message: 'PDF upload failed. Please try again.' });
      }
      // Store relative path instead of absolute path
      const path = await import('path');
      const relativePath = path.default.relative(process.cwd(), req.file.path);
      noteData.pdfPath = relativePath;
      noteData.size = req.file.size || undefined;
      // PDF text extraction
      try {
        const fs = await import('fs');
        const pdfParse = (await import('pdf-parse')).default;
        const dataBuffer = fs.default.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        noteData.extractedText = pdfData.text || '';
        noteData.numPages = pdfData.numpages || 1;
      } catch (pdfErr) {
        console.error('PDF text extraction failed:', pdfErr);
        noteData.extractedText = '';
        noteData.numPages = 1;
      }
    }

    // Handle AI processing if requested
    if (useAI === 'true' && aiPrompt && (content || req.file)) {
      try {
        console.log('🤖 Processing AI request for teacher note...');
        // Determine which text to process
        let textToAnalyze = content || '';
        // If there's a PDF and no content, use extracted text
        if (!textToAnalyze && req.file && noteData.extractedText) {
          textToAnalyze = noteData.extractedText;
        }
        // If still no text, use a placeholder
        if (!textToAnalyze && req.file) {
          textToAnalyze = `This note contains a PDF file: ${req.file.originalname}. The teacher has requested AI analysis with the instruction: "${aiPrompt}". AI will process any extracted content from this document.`;
        }
        // Create context for AI analysis
        const aiContext = {
          module: noteData.module,
          subject: noteData.subject,
          branch: noteData.branch,
          semester: noteData.semester,
          provider: 'perplexity' // Default provider
        };
        // Call the AI service
        const aiResult = await processWithAI(textToAnalyze, aiContext, aiPrompt);
        console.log('✅ AI analysis completed:', {
          summaryLength: aiResult.summary?.length || 0,
          keyPointsCount: aiResult.keyPoints?.length || 0,
          conceptsCount: aiResult.concepts?.length || 0,
          flashcardsCount: aiResult.flashcards?.length || 0
        });
        // Apply AI results to note data
        noteData.provider = aiResult.provider || 'perplexity';
        noteData.summary = aiResult.summary || `AI analysis requested: ${aiPrompt}`;
        noteData.keyPoints = aiResult.keyPoints || [];
        noteData.concepts = aiResult.concepts || [];
        // Add flashcards if available
        if (aiResult.flashcards && aiResult.flashcards.length > 0) {
          noteData.flashcards = aiResult.flashcards;
        }
      } catch (aiError) {
        console.error('❌ AI processing failed:', aiError);
        // Don't fail the note creation, but provide fallback content
        noteData.provider = 'failed';
        noteData.summary = `AI processing was requested but failed. Teacher's instruction: "${aiPrompt}". Error: ${aiError.message}`;
        noteData.keyPoints = [
          `AI processing failed for instruction: ${aiPrompt}`,
          `Subject: ${noteData.subject}`,
          `Module: ${noteData.module}`,
          `Content available: ${content ? 'Yes' : 'PDF only'}`
        ];
      }
    }

    try {
      const note = await Note.create(noteData);
      res.status(201).json(note);
    } catch (err) {
      console.error('Create teacher note error:', err);
      
      // Handle validation errors specifically
      if (err.name === 'ValidationError') {
        const validationErrors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: validationErrors 
        });
      }
      
      // Handle duplicate key errors
      if (err.code === 11000) {
        return res.status(400).json({ 
          message: 'A note with this title already exists' 
        });
      }
      
      res.status(500).json({ message: 'Failed to create note. Please check your input and try again.' });
    }
  } catch (error) {
    console.error('Create teacher note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update teacher note
// @route   PUT /api/teacher/notes/:id
// @access  Private/Teacher
export const updateTeacherNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if note belongs to the teacher
    if (note.teacherId.toString() !== req.teacher._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedNote);
  } catch (error) {
    console.error('Update teacher note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete teacher note
// @route   DELETE /api/teacher/notes/:id
// @access  Private/Teacher
export const deleteTeacherNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if note belongs to the teacher
    if (note.teacherId.toString() !== req.teacher._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete teacher note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Publish teacher note (make it public)
// @route   PUT /api/teacher/notes/:id/publish
// @access  Private/Teacher
export const publishTeacherNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if note belongs to the teacher
    if (note.teacherId.toString() !== req.teacher._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to publish this note' });
    }

    note.isPublic = true;
    note.publishedDate = new Date();
    const updatedNote = await note.save();

    res.json(updatedNote);
  } catch (error) {
    console.error('Publish teacher note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unpublish teacher note (make it private)
// @route   PUT /api/teacher/notes/:id/unpublish
// @access  Private/Teacher
export const unpublishTeacherNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if note belongs to the teacher
    if (note.teacherId.toString() !== req.teacher._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to unpublish this note' });
    }

    note.isPublic = false;
    const updatedNote = await note.save();

    res.json(updatedNote);
  } catch (error) {
    console.error('Unpublish teacher note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get teacher note statistics
// @route   GET /api/teacher/notes/stats
// @access  Private/Teacher
export const getTeacherNoteStats = async (req, res) => {
  try {
    console.log('Getting teacher stats for teacher:', req.teacher._id);
    
    const teacherQuery = {
      $or: [
        { teacherId: req.teacher._id },
        { owner: req.teacher._id }
      ],
      noteType: 'teacher'
    };
    
    const totalNotes = await Note.countDocuments(teacherQuery);
    
    const publicNotes = await Note.countDocuments({ 
      ...teacherQuery,
      isPublic: true
    });
    
    const privateNotes = await Note.countDocuments({ 
      ...teacherQuery,
      isPublic: false
    });
    
    const totalViews = await Note.aggregate([
      { $match: teacherQuery },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    const totalLikes = await Note.aggregate([
      { $match: teacherQuery },
      { $group: { _id: null, totalLikes: { $sum: '$likes' } } }
    ]);

    console.log('Teacher stats:', {
      totalNotes,
      publicNotes,
      privateNotes,
      totalViews: totalViews[0]?.totalViews || 0,
      totalLikes: totalLikes[0]?.totalLikes || 0
    });

    res.json({
      totalNotes,
      publicNotes,
      privateNotes,
      totalViews: totalViews[0]?.totalViews || 0,
      totalLikes: totalLikes[0]?.totalLikes || 0
    });
  } catch (error) {
    console.error('Get teacher note stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all teacher notes (for students to view)
// @route   GET /api/teacher-notes
// @access  Public
export const getAllTeacherNotes = async (req, res) => {
  try {
    const { subject, semester, branch, module } = req.query;
    
    let query = { 
      noteType: 'teacher',
      isPublic: true,
      isApproved: true
    };

    if (subject) query.subject = subject;
    if (semester) query.semester = parseInt(semester);
    if (branch) query.branch = branch;
    if (module) query.module = module;

    const notes = await Note.find(query)
      .populate('teacherId', 'name department designation college')
      .sort({ publishedDate: -1 });

    res.json(notes);
  } catch (error) {
    console.error('Get all teacher notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Serve PDF file for teacher note (public access for students)
// @route   GET /api/teacher-notes/public/pdf/:id
// @access  Public
export const servePublicTeacherNotePdf = async (req, res) => {
  try {
    console.log('Serving public PDF for note ID:', req.params.id);
    
    // Find the note - only allow access to public, approved teacher notes
    const note = await Note.findOne({
      _id: req.params.id,
      noteType: 'teacher',
      isPublic: true,
      isApproved: true
    });
    
    console.log('Found note:', {
      id: note?._id,
      title: note?.title,
      pdfPath: note?.pdfPath,
      isPublic: note?.isPublic
    });
    
    if (!note) {
      console.log('Note not found or not public');
      return res.status(404).json({ message: 'Note not found or not accessible' });
    }
    
    if (!note.pdfPath) {
      console.log('Note has no PDF path');
      return res.status(404).json({ message: 'PDF not found' });
    }
    
    // Update view count
    note.views = note.views ? note.views + 1 : 1;
    await note.save();
    
    // Send the file - handle path properly
    const fs = await import('fs');
    const path = await import('path');
    
    let filePath = note.pdfPath;
    
    // Handle both absolute and relative paths
    if (!path.default.isAbsolute(filePath)) {
      // If relative, make it absolute by joining with current working directory
      filePath = path.default.join(process.cwd(), filePath);
    } else {
      // If absolute path, use it as is
      filePath = path.default.normalize(filePath);
    }
    
    // Ensure the file exists before serving
    if (!fs.default.existsSync(filePath)) {
      console.error('PDF file not found:', filePath);
      return res.status(404).json({ message: 'PDF file not found on server' });
    }
    
    console.log('Serving public PDF file:', filePath);
    
    // Set appropriate headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${note.title}.pdf"`);
    
    // Use sendFile with absolute path (no root needed)
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve public teacher note PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
