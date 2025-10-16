import Connection from '../models/Connection.js';
import mongoose from 'mongoose';

export const connectToTeacher = async (req, res) => {
  try {
    const { teacherId, message } = req.body;
    
    if (!teacherId) {
      return res.status(400).json({ 
        success: false,
        message: 'Teacher ID is required' 
      });
    }

    // Check if teacher exists and is active (accept _id or employeeId)
    const Teacher = (await import('../models/Teacher.js')).default;
    let teacher;
    if (/^[a-fA-F0-9]{24}$/.test(teacherId)) {
      // Looks like a MongoDB ObjectId
      teacher = await Teacher.findOne({ _id: teacherId, isActive: true });
    } else {
      // Try employeeId
      teacher = await Teacher.findOne({ employeeId: teacherId, isActive: true });
    }
    if (!teacher) {
      return res.status(404).json({ 
        success: false,
        message: 'Teacher not found or is not currently accepting connections' 
      });
    }

    // Check student's existing connections count
    const studentConnectionCount = await Connection.countDocuments({ 
      student: req.user._id,
      status: { $in: ['pending', 'approved'] }
    });

    const MAX_CONNECTIONS = 5;
    if (studentConnectionCount >= MAX_CONNECTIONS) {
      return res.status(400).json({
        success: false,
        message: `You have reached the maximum limit of ${MAX_CONNECTIONS} teacher connections`,
        currentCount: studentConnectionCount
      });
    }

    // Check if connection already exists
    const existing = await Connection.findOne({ 
      student: req.user._id, 
      teacher: teacher._id 
    });

    if (existing) {
      if (existing.status === 'approved') {
        return res.json({
          success: true,
          message: 'Already connected to this teacher',
          connection: existing,
          status: 'active'
        });
      } else if (existing.status === 'pending') {
        return res.json({
          success: true,
          message: 'Connection request already pending',
          connection: existing,
          status: 'pending'
        });
      }
    }

    // Create new connection with notification
    const conn = await Connection.create({ 
      student: req.user._id, 
      teacher: teacher._id,
      connectMessage: message || 'Request to connect',
      status: 'pending',
      requestedAt: new Date(),
      notifications: [{
        type: 'request',
        message: `New connection request from ${req.user.name}`,
        createdAt: new Date(),
        createdFor: 'teacher'
      }]
    });

    // Update teacher's notification count (implement this in Teacher model)
    await teacher.updateOne({ 
      $inc: { unreadNotifications: 1 }
    });
    
    res.status(201).json({ 
      success: true,
      message: 'Connection request sent successfully',
      connection: conn,
      status: 'pending'
    });

  } catch (err) {
    console.error('connectToTeacher error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send connection request',
      error: err.message 
    });
  }
};

export const listStudentConnections = async (req, res) => {
  try {
    const conns = await Connection.find({ student: req.user._id, status: 'approved' })
      .populate('teacher', 'name email department designation');
    res.json(conns);
  } catch (err) {
    console.error('listStudentConnections error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listTeacherStudents = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10, search } = req.query;
    
    // Build query
    const query = { 
      teacher: req.teacher._id 
    };
    
    // Add status filter if specified
    if (status !== 'all') {
      query.status = status;
    }
    
    // Add search filter if provided
    const searchRegex = search ? new RegExp(search, 'i') : null;
    
    // Execute query with pagination
    const connections = await Connection.find(query)
      .populate({
        path: 'student',
        select: 'name email usn branch semester lastActive',
        match: searchRegex ? {
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { usn: searchRegex }
          ]
        } : {}
      })
      .sort({ updatedAt: -1, requestedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalConnections = await Connection.countDocuments(query);
    
    // Calculate stats
    const stats = {
      total: totalConnections,
      approved: await Connection.countDocuments({ ...query, status: 'approved' }),
      pending: await Connection.countDocuments({ ...query, status: 'pending' }),
      inactive: await Connection.countDocuments({ ...query, status: 'inactive' })
    };
    
    // Filter out null student records (from search filter) and format response
    const formattedConnections = connections
      .filter(conn => conn.student)
      .map(conn => ({
        _id: conn._id,
        status: conn.status,
        student: {
          _id: conn.student._id,
          name: conn.student.name,
          email: conn.student.email,
          usn: conn.student.usn,
          branch: conn.student.branch,
          semester: conn.student.semester,
          lastActive: conn.student.lastActive
        },
        connectMessage: conn.connectMessage,
        requestedAt: conn.requestedAt,
        updatedAt: conn.updatedAt,
        lastInteraction: conn.lastInteraction || conn.updatedAt,
        hasUnreadNotifications: (conn.notifications || [])
          .some(n => !n.readAt && n.createdFor === 'teacher')
      }));
    
    res.json({
      success: true,
      connections: formattedConnections,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalConnections,
        pages: Math.ceil(totalConnections / limit)
      },
      stats
    });
    
  } catch (err) {
    console.error('listTeacherStudents error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to list teacher students',
      error: err.message
    });
  }
};

// Get list of available teachers for students to connect with
export const getAvailableTeachers = async (req, res) => {
  try {
    const { search, department, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    // Add search filter
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { department: new RegExp(search, 'i') }
      ];
    }

    // Add department filter
    if (department) {
      query.department = department;
    }

    const Teacher = (await import('../models/Teacher.js')).default;
    
    // Get teachers with pagination
    const teachers = await Teacher.find(query)
      .select('_id name email department designation profileImage subjects')
      .sort({ rating: -1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Teacher.countDocuments(query);

    // Get unique departments for filtering
    const departments = await Teacher.distinct('department');

    // Get connection status for each teacher
    const connections = await Connection.find({
      student: req.user._id,
      teacher: { $in: teachers.map(t => t._id) }
    }).select('teacher status').lean();

    // Add connection status to teacher objects
    const teachersWithStatus = teachers.map(teacher => {
      const connection = connections.find(c => c.teacher.equals(teacher._id));
      return {
        ...teacher,
        connectionStatus: connection ? connection.status : null
      };
    });

    res.json({
      success: true,
      teachers: teachersWithStatus,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        departments
      }
    });

  } catch (err) {
    console.error('getAvailableTeachers error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get available teachers',
      error: err.message
    });
  }
};

// Handle teacher's response to connection requests
export const respondToConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { status, message } = req.body;

    if (!['approved', 'rejected', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      teacher: req.teacher._id,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found'
      });
    }

    // Update connection status
    connection.status = status;
    connection.responseMessage = message || '';
    connection.respondedAt = new Date();

    // Add notification
    connection.notifications.push({
      type: status,
      message: status === 'approved' 
        ? 'Your connection request was approved!' 
        : `Your connection request was ${status}`,
      createdAt: new Date(),
      createdFor: 'student'
    });

    await connection.save();

    // Update student's notification count
    const User = (await import('../models/User.js')).default;
    await User.updateOne(
      { _id: connection.student },
      { $inc: { unreadNotifications: 1 } }
    );

    res.json({
      success: true,
      message: `Connection request ${status}`,
      connection
    });

  } catch (err) {
    console.error('respondToConnection error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to connection',
      error: err.message
    });
  }
};

// Update connection status (for students)
export const updateConnectionStatus = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      student: req.user._id,
      status: 'approved'
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    // Update connection status
    connection.status = status;
    connection.lastStatusUpdate = new Date();

    // Add notification for teacher
    connection.notifications.push({
      type: 'status_update',
      message: `Student ${req.user.name} has marked the connection as ${status}`,
      createdAt: new Date(),
      createdFor: 'teacher'
    });

    await connection.save();

    // Update teacher's notification count
    const Teacher = (await import('../models/Teacher.js')).default;
    await Teacher.updateOne(
      { _id: connection.teacher },
      { $inc: { unreadNotifications: 1 } }
    );

    res.json({
      success: true,
      message: `Connection marked as ${status}`,
      connection
    });

  } catch (err) {
    console.error('updateConnectionStatus error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update connection status',
      error: err.message
    });
  }
};

// Mark notifications as read
export const markNotificationsRead = async (req, res) => {
  try {
    const { connectionIds } = req.body;
    const isTeacher = !!req.teacher;
    
    // Update all specified connections
    await Connection.updateMany(
      { 
        _id: { $in: connectionIds },
        [isTeacher ? 'teacher' : 'student']: isTeacher ? req.teacher._id : req.user._id
      },
      { 
        $set: { 
          'notifications.$[notification].readAt': new Date()
        }
      },
      {
        arrayFilters: [
          { 
            'notification.createdFor': isTeacher ? 'teacher' : 'student',
            'notification.readAt': null 
          }
        ]
      }
    );

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });

  } catch (err) {
    console.error('markNotificationsRead error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: err.message
    });
  }
};
