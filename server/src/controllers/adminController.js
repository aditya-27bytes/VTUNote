import User from "../models/User.js";
import Note from "../models/Note.js";

export const getUsers = async (_req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  res.json({ message: "User deleted" });
};

export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!["user", "admin"].includes(role)) return res.status(400).json({ error: "Invalid role" });
  const updated = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
  res.json(updated);
};

export const getDashboardStats = async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    let daysToSubtract = 30;
    let activityDays = 7;
    
    switch (range) {
      case '7d':
        daysToSubtract = 7;
        activityDays = 7;
        break;
      case '30d':
        daysToSubtract = 30;
        activityDays = 7;
        break;
      case '90d':
        daysToSubtract = 90;
        activityDays = 14;
        break;
      case '1y':
        daysToSubtract = 365;
        activityDays = 30;
        break;
      default:
        daysToSubtract = 30;
        activityDays = 7;
    }
    
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: "admin" });
    const usersByBranch = await User.aggregate([
      { $group: { _id: "$branch", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const usersBySemester = await User.aggregate([
      { $group: { _id: "$semester", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const usersByCollege = await User.aggregate([
      { $group: { _id: "$college", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get note statistics
    const totalNotes = await Note.countDocuments();
    const publicNotes = await Note.countDocuments({ isPublic: true });
    const privateNotes = await Note.countDocuments({ isPublic: false });
    const notesBySubject = await Note.aggregate([
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const notesByModule = await Note.aggregate([
      { $group: { _id: "$module", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const notesBySemester = await Note.aggregate([
      { $group: { _id: "$semester", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get recent activity based on date range
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: startDate }
    });
    
    const recentNotes = await Note.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Get most viewed notes
    const mostViewedNotes = await Note.find()
      .select('title subject module views isPublic createdAt')
      .sort({ views: -1 })
      .limit(10);

    // Get daily activity for the specified number of days
    const dailyActivity = [];
    for (let i = activityDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const usersCreated = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      const notesCreated = await Note.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      dailyActivity.push({
        date: startOfDay.toISOString().split('T')[0],
        users: usersCreated,
        notes: notesCreated
      });
    }

    res.json({
      users: {
        total: totalUsers,
        admins: adminUsers,
        recent: recentUsers,
        byBranch: usersByBranch,
        bySemester: usersBySemester,
        byCollege: usersByCollege
      },
      notes: {
        total: totalNotes,
        public: publicNotes,
        private: privateNotes,
        recent: recentNotes,
        bySubject: notesBySubject,
        byModule: notesByModule,
        bySemester: notesBySemester,
        mostViewed: mostViewedNotes
      },
      activity: {
        daily: dailyActivity
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};

// Get all notes with filtering options
export const getNotes = async (req, res) => {
  try {
    const { subject, semester, branch, module } = req.query;
    
    // Build filter object based on query parameters
    const filter = {};
    if (subject) filter.subject = subject;
    if (semester) filter.semester = parseInt(semester);
    if (branch) filter.branch = branch;
    if (module) filter.module = module;
    
    // Get notes with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const notes = await Note.find(filter)
      .select('title subject semester branch module views isPublic createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Note.countDocuments(filter);
    
    res.json({
      notes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
};

// Delete a note
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    await Note.findByIdAndDelete(id);
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
};

// Toggle note visibility (public/private)
export const toggleNoteVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);
    
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    note.isPublic = !note.isPublic;
    await note.save();
    
    res.json({ 
      message: `Note ${note.isPublic ? 'made public' : 'made private'} successfully`,
      isPublic: note.isPublic 
    });
  } catch (error) {
    console.error("Toggle note visibility error:", error);
    res.status(500).json({ error: "Failed to toggle note visibility" });
  }
};

// Get public notes for admin management
export const getPublicNotes = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const publicNotes = await Note.find({ isPublic: true })
      .select('title subject semester branch module views isPublic createdAt')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Note.countDocuments({ isPublic: true });
    
    res.json({
      notes: publicNotes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get public notes error:", error);
    res.status(500).json({ error: "Failed to fetch public notes" });
  }
};
