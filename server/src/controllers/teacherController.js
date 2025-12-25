import Teacher from '../models/Teacher.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register teacher (legacy - kept for backward compatibility)
// @route   POST /api/teachers/register
// @access  Public
export const registerTeacher = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      employeeId,
      department,
      designation,
      qualification,
      experience,
      phone,
      college,
      subjects,
      bio
    } = req.body;

    // Check if teacher already exists
    const teacherExists = await Teacher.findOne({ email });
    if (teacherExists) {
      return res.status(400).json({ message: 'Teacher already exists with this email' });
    }

    // Check if employee ID already exists
    const employeeExists = await Teacher.findOne({ employeeId });
    if (employeeExists) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }

    // Create teacher with auto-verification for development
    const teacher = await Teacher.create({
      name,
      email,
      password,
      employeeId,
      department,
      designation,
      qualification,
      experience,
      phone,
      college,
      subjects: subjects || [],
      bio: bio || '',
      isVerified: true // Auto-verify teachers for development
    });

    if (teacher) {
      res.status(201).json({
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        employeeId: teacher.employeeId,
        department: teacher.department,
        designation: teacher.designation,
        qualification: teacher.qualification,
        experience: teacher.experience,
        phone: teacher.phone,
        college: teacher.college,
        subjects: teacher.subjects,
        isVerified: teacher.isVerified,
        isActive: teacher.isActive,
        profileImage: teacher.profileImage,
        bio: teacher.bio,
        role: teacher.role,
        token: generateToken(teacher._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid teacher data' });
    }
  } catch (error) {
    console.error('Teacher registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate teacher & get token
// @route   POST /api/teachers/login
// @access  Public
export const loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find teacher by email
    const teacher = await Teacher.findOne({ email });

    if (!teacher) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordMatch = await teacher.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is active
    if (!teacher.isActive) {
      return res.status(401).json({ message: 'Account is deactivated. Please contact admin.' });
    }

    // Note: Teachers registered via OTP need admin verification to access dashboard
    // but they can still log in to see their pending status
    if (!teacher.isVerified) {
      console.log(`⚠️ Login by unverified teacher: ${email}`);
      // Allows login but frontend will show pending admin verification status
    }

    // Generate token
    const token = generateToken(teacher._id);
    
    if (!token) {
      return res.status(500).json({ message: 'Failed to generate authentication token' });
    }

    res.json({
      message: teacher.isVerified ? "✅ Login successful" : "⚠️ Login successful - Awaiting admin verification",
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      employeeId: teacher.employeeId,
      department: teacher.department,
      designation: teacher.designation,
      qualification: teacher.qualification,
      experience: teacher.experience,
      phone: teacher.phone,
      college: teacher.college,
      subjects: teacher.subjects,
      isVerified: teacher.isVerified,
      isActive: teacher.isActive,
      profileImage: teacher.profileImage,
      bio: teacher.bio,
      role: teacher.role,
      token: token,
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get teacher profile
// @route   GET /api/teachers/profile
// @access  Private
export const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id).select('-password');
    if (teacher) {
      res.json(teacher);
    } else {
      res.status(404).json({ message: 'Teacher not found' });
    }
  } catch (error) {
    console.error('Get teacher profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update teacher profile
// @route   PUT /api/teachers/profile
// @access  Private
export const updateTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id);

    if (teacher) {
      teacher.name = req.body.name || teacher.name;
      teacher.phone = req.body.phone || teacher.phone;
      teacher.department = req.body.department || teacher.department;
      teacher.designation = req.body.designation || teacher.designation;
      teacher.qualification = req.body.qualification || teacher.qualification;
      teacher.experience = req.body.experience || teacher.experience;
      teacher.college = req.body.college || teacher.college;
      teacher.subjects = req.body.subjects || teacher.subjects;
      teacher.bio = req.body.bio || teacher.bio;
      teacher.profileImage = req.body.profileImage || teacher.profileImage;

      if (req.body.password) {
        teacher.password = req.body.password;
      }

      const updatedTeacher = await teacher.save();

      res.json({
        _id: updatedTeacher._id,
        name: updatedTeacher.name,
        email: updatedTeacher.email,
        employeeId: updatedTeacher.employeeId,
        department: updatedTeacher.department,
        designation: updatedTeacher.designation,
        qualification: updatedTeacher.qualification,
        experience: updatedTeacher.experience,
        phone: updatedTeacher.phone,
        college: updatedTeacher.college,
        subjects: updatedTeacher.subjects,
        isVerified: updatedTeacher.isVerified,
        isActive: updatedTeacher.isActive,
        profileImage: updatedTeacher.profileImage,
        bio: updatedTeacher.bio,
        role: updatedTeacher.role,
        token: generateToken(updatedTeacher._id),
      });
    } else {
      res.status(404).json({ message: 'Teacher not found' });
    }
  } catch (error) {
    console.error('Update teacher profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all teachers (for admin)
// @route   GET /api/teachers
// @access  Private/Admin
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({}).select('-password');
    res.json(teachers);
  } catch (error) {
    console.error('Get all teachers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify teacher (admin only)
// @route   PUT /api/teachers/:id/verify
// @access  Private/Admin
export const verifyTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (teacher) {
      teacher.isVerified = req.body.isVerified;
      const updatedTeacher = await teacher.save();
      res.json(updatedTeacher);
    } else {
      res.status(404).json({ message: 'Teacher not found' });
    }
  } catch (error) {
    console.error('Verify teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle teacher active status (admin only)
// @route   PUT /api/teachers/:id/toggle-status
// @access  Private/Admin
export const toggleTeacherStatus = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (teacher) {
      teacher.isActive = !teacher.isActive;
      const updatedTeacher = await teacher.save();
      res.json(updatedTeacher);
    } else {
      res.status(404).json({ message: 'Teacher not found' });
    }
  } catch (error) {
    console.error('Toggle teacher status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
