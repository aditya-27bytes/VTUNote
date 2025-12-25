import Note from '../models/Note.js';
import Connection from '../models/Connection.js';
import Teacher from '../models/Teacher.js';

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

// @desc    Get notes available to a student (public + connected teachers)
// @route   GET /api/student/notes
// @access  Private/User
export const getStudentAvailableNotes = async (req, res) => {
  try {
    const { module, subject, branch, semester, teacher, search, sortBy = 'newest', limit = 50, page = 1 } = req.query;
    
    console.log('Student notes request:', { module, subject, branch, semester, teacher, search });

    // Build base query filters
    const baseFilters = {
      noteType: 'teacher',
      isApproved: true
    };

    // Add optional filters
    if (module) baseFilters.module = new RegExp(module, 'i');
    if (subject) baseFilters.subject = new RegExp(subject, 'i');
    if (branch) baseFilters.branch = new RegExp(branch, 'i');
    if (semester) baseFilters.semester = parseInt(semester);
    if (search) {
      baseFilters.$or = [
        { title: new RegExp(search, 'i') },
        { summary: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') }
      ];
    }

    // 1. Get all public teacher notes with filters
    const publicNotesQuery = { ...baseFilters, isPublic: true };
    const publicNotes = await Note.find(publicNotesQuery)
      .populate('teacherId', 'name department designation college')
      .lean();

    // 2. Get teacher IDs the student is connected to (approved connections)
    const connections = await Connection.find({
      student: req.user._id,
      status: 'approved'
    }).select('teacher').lean();
    const connectedTeacherIds = connections.map(conn => conn.teacher);

    // 3. Get notes from connected teachers (public or private) with filters
    let connectedTeacherNotes = [];
    if (connectedTeacherIds.length > 0) {
      const connectedNotesQuery = {
        ...baseFilters,
        teacherId: { $in: connectedTeacherIds }
      };
      connectedTeacherNotes = await Note.find(connectedNotesQuery)
        .populate('teacherId', 'name department designation college')
        .lean();
    }

    // 4. Merge and deduplicate notes (by _id)
    const allNotesMap = new Map();
    [...publicNotes, ...connectedTeacherNotes].forEach(note => {
      allNotesMap.set(note._id.toString(), {
        ...note,
        isConnectedTeacher: connectedTeacherIds.some(id => id.toString() === note.teacherId?._id.toString())
      });
    });
    let allNotes = Array.from(allNotesMap.values());

    // 5. Apply teacher name filter if specified
    if (teacher) {
      const teacherRegex = new RegExp(teacher, 'i');
      allNotes = allNotes.filter(note => 
        note.teacherId?.name && teacherRegex.test(note.teacherId.name)
      );
    }

    // 6. Sort notes
    const sortOptions = {
      newest: (a, b) => new Date(b.publishedDate || b.createdAt) - new Date(a.publishedDate || a.createdAt),
      oldest: (a, b) => new Date(a.publishedDate || a.createdAt) - new Date(b.publishedDate || b.createdAt),
      popular: (a, b) => (b.views || 0) - (a.views || 0),
      liked: (a, b) => (b.likes || 0) - (a.likes || 0),
      alphabetical: (a, b) => a.title.localeCompare(b.title)
    };
    if (sortOptions[sortBy]) {
      allNotes.sort(sortOptions[sortBy]);
    }

    // 7. Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedNotes = allNotes.slice(startIndex, endIndex);

    // 8. Get unique filter options for frontend
    const filterOptions = {
      modules: [...new Set(allNotes.map(note => note.module).filter(Boolean))].sort(),
      subjects: [...new Set(allNotes.map(note => note.subject).filter(Boolean))].sort(),
      branches: [...new Set(allNotes.map(note => note.branch).filter(Boolean))].sort(),
      semesters: [...new Set(allNotes.map(note => note.semester).filter(Boolean))].sort((a, b) => a - b),
      teachers: [...new Set(allNotes.map(note => note.teacherId?.name).filter(Boolean))].sort()
    };

    console.log(`Returning ${paginatedNotes.length} notes out of ${allNotes.length} total`);

    // Add download URL for PDFs
    const notesWithUrls = paginatedNotes.map(note => ({
      ...note,
      downloadUrl: note.pdfPath ? (note.pdfPath.startsWith('/uploads/') ? note.pdfPath : (note.pdfPath.startsWith('uploads/') ? `/${note.pdfPath}` : `/uploads/${note.pdfPath}`)) : null,
      hasImages: note.extractedImages && note.extractedImages.length > 0,
      hasFlashcards: note.flashcards && note.flashcards.length > 0,
      imageCount: note.extractedImages ? note.extractedImages.length : 0,
      flashcardCount: note.flashcards ? note.flashcards.length : 0
    }));

    // Anonymize provider labels
    notesWithUrls.forEach(n => {
      if (n.provider) n.provider = mapProviderToModelLabel(n.provider);
    });

    res.json({
      notes: notesWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allNotes.length,
        pages: Math.ceil(allNotes.length / limit),
        hasNext: parseInt(page) < Math.ceil(allNotes.length / limit),
        hasPrev: parseInt(page) > 1
      },
      filters: filterOptions,
      stats: {
        totalPublic: publicNotes.length,
        totalConnected: connectedTeacherNotes.length,
        totalUnique: allNotes.length,
        connectedTeachers: connectedTeacherIds.length
      },
      success: true
    });
  } catch (error) {
    console.error('Get student available notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get individual teacher note details for student
// @route   GET /api/student/notes/:id
// @access  Private/User
export const getStudentNoteDetail = async (req, res) => {
  try {
    const noteId = req.params.id;
    
    // Get the note with full details
    const note = await Note.findById(noteId)
      .populate('teacherId', 'name department designation college email')
      .lean();
    
    if (!note || note.noteType !== 'teacher' || !note.isApproved) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Check if student has access to this note
    const hasAccess = note.isPublic || await Connection.exists({
      student: req.user._id,
      teacher: note.teacherId._id,
      status: 'approved'
    });
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this note' });
    }
    
    // Increment view count
    await Note.findByIdAndUpdate(noteId, { $inc: { views: 1 } });
    
    // Prepare response data
    const noteDetail = {
      ...note,
      downloadUrl: note.pdfPath ? (note.pdfPath.startsWith('/uploads/') ? note.pdfPath : (note.pdfPath.startsWith('uploads/') ? `/${note.pdfPath}` : `/uploads/${note.pdfPath}`)) : null,
      images: note.extractedImages ? note.extractedImages.map(img => ({
        ...img,
        url: img.path.startsWith('/uploads/') ? img.path : (img.path.startsWith('uploads/') ? `/${img.path}` : `/uploads/${img.path}`)
      })) : [],
      hasImages: note.extractedImages && note.extractedImages.length > 0,
      hasFlashcards: note.flashcards && note.flashcards.length > 0,
      imageCount: note.extractedImages ? note.extractedImages.length : 0,
      flashcardCount: note.flashcards ? note.flashcards.length : 0,
      views: (note.views || 0) + 1 // Include the incremented view
    };
    if (noteDetail.provider) noteDetail.provider = mapProviderToModelLabel(noteDetail.provider);
    
    res.json({
      note: noteDetail,
      success: true
    });
  } catch (error) {
    console.error('Get student note detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
