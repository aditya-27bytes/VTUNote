import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import {
  registerTeacher,
  loginTeacher,
  getTeacherProfile,
  updateTeacherProfile,
  getAllTeachers,
  verifyTeacher,
  toggleTeacherStatus
} from '../controllers/teacherController.js';
import { protectTeacher, isVerifiedTeacher, isActiveTeacher } from '../middleware/teacherAuth.js';
import { protect, isAdmin } from '../middleware/auth.js';
import Teacher from '../models/Teacher.js';
import OTP from '../models/OTP.js';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();

// ============ OTP-BASED REGISTRATION ============

// Step 1: Request OTP for teacher registration
router.post('/register-request', async (req, res) => {
  try {
    const { name, email, employeeId, department, designation, qualification, experience, phone, college, subjects } = req.body;

    if (!name || !email || !employeeId || !department || !designation || !qualification || !experience || !phone || !college) {
      return res.status(400).json({ error: "All required fields must be provided" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate phone format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({ error: "Invalid phone number. Please enter a 10-digit number." });
    }

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ 
      $or: [{ email }, { employeeId }] 
    });
    if (existingTeacher) {
      const field = existingTeacher.email === email ? "email" : "Employee ID";
      return res.status(400).json({ error: `Teacher with this ${field} already exists` });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Save OTP to database
    const otpRecord = new OTP({
      email,
      otp,
      userType: 'teacher'
    });
    await otpRecord.save();

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp, 'teacher');
    
    if (!emailResult.success) {
      return res.status(500).json({ error: "Failed to send OTP. Please try again." });
    }

    res.json({
      message: "✅ OTP sent to your email. Please verify within 5 minutes.",
      email,
      registrationData: {
        name,
        email,
        employeeId,
        department,
        designation,
        qualification,
        experience,
        phone,
        college,
        subjects
      }
    });
  } catch (error) {
    console.error("❌ Teacher register request error:", error);
    res.status(500).json({ error: "Server error during registration request" });
  }
});

// Step 2: Teacher verify OTP and complete registration
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, password, name, employeeId, department, designation, qualification, experience, phone, college, subjects } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ error: "Email, OTP, and password are required" });
    }

    // Find and verify OTP
    const otpRecord = await OTP.findOne({ email, userType: 'teacher' });
    
    if (!otpRecord) {
      return res.status(400).json({ error: "OTP expired or not found. Please request a new OTP." });
    }

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const attemptsLeft = 5 - otpRecord.attempts;
      return res.status(400).json({ 
        error: `Invalid OTP. ${attemptsLeft} attempts remaining.` 
      });
    }

    // Mark OTP as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    // Create new teacher
    const teacher = new Teacher({
      name,
      email,
      password,
      employeeId,
      department,
      designation,
      qualification,
      experience: parseInt(experience),
      phone,
      college,
      subjects: subjects || [],
      isVerified: false // Admin needs to verify teacher
    });
    await teacher.save();

    // Send welcome email
    await sendWelcomeEmail(email, name, 'teacher');

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate JWT token
    const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET || "secretkey", { expiresIn: "7d" });

    res.json({
      message: "✅ Registration successful! Email verified. Awaiting admin verification.",
      token,
      user: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        employeeId: teacher.employeeId,
        department: teacher.department,
        designation: teacher.designation,
        college: teacher.college,
        role: teacher.role,
        isVerified: teacher.isVerified
      }
    });
  } catch (error) {
    console.error("❌ Teacher OTP verification error:", error);
    res.status(500).json({ error: "Server error during OTP verification" });
  }
});

// ============ GOOGLE AUTHENTICATION ============

// Google Auth for teachers
router.post('/google-auth', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Google token is required" });
    }

    // Verify Google token
    const googleResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`
    );

    const { email, name, picture } = googleResponse.data;

    if (!email || !name) {
      return res.status(400).json({ error: "Failed to retrieve Google user info" });
    }

    // Check if teacher already exists
    let teacher = await Teacher.findOne({ email });

    if (teacher) {
      // Teacher exists, generate token
      const jwtToken = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET || "secretkey", { expiresIn: "7d" });
      return res.json({
        message: "✅ Login successful",
        token: jwtToken,
        user: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          employeeId: teacher.employeeId,
          department: teacher.department,
          college: teacher.college,
          role: teacher.role,
          isVerified: teacher.isVerified
        }
      });
    }

    // New teacher - send OTP for registration completion
    const otp = generateOTP();
    
    const otpRecord = new OTP({
      email,
      otp,
      userType: 'teacher'
    });
    await otpRecord.save();

    // Send OTP
    await sendOTPEmail(email, otp, 'teacher');

    res.json({
      message: "✅ Google authentication successful. Please verify OTP to complete registration.",
      email,
      name,
      picture,
      googleAuth: true
    });
  } catch (error) {
    console.error("❌ Google auth error:", error);
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
});

// Complete Google registration with OTP
router.post('/complete-google-registration', async (req, res) => {
  try {
    const { email, otp, employeeId, department, designation, qualification, experience, phone, college, subjects, name } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, userType: 'teacher' });
    
    if (!otpRecord) {
      return res.status(400).json({ error: "OTP expired. Please start registration again." });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Create teacher with Google auth (no password)
    const teacher = new Teacher({
      name: name || email.split('@')[0],
      email,
      password: Math.random().toString(36).slice(2), // Random password since using Google auth
      employeeId,
      department,
      designation,
      qualification,
      experience: parseInt(experience),
      phone,
      college,
      subjects: subjects || [],
      isVerified: false // Admin needs to verify
    });
    await teacher.save();

    // Delete OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Send welcome email
    await sendWelcomeEmail(email, name || email.split('@')[0], 'teacher');

    // Generate JWT token
    const jwtToken = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET || "secretkey", { expiresIn: "7d" });

    res.json({
      message: "✅ Registration completed successfully. Awaiting admin verification.",
      token: jwtToken,
      user: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        employeeId: teacher.employeeId,
        department: teacher.department,
        college: teacher.college,
        role: teacher.role,
        isVerified: teacher.isVerified
      }
    });
  } catch (error) {
    console.error("❌ Complete Google registration error:", error);
    res.status(500).json({ error: "Server error during registration completion" });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Delete existing OTP if any
    await OTP.deleteOne({ email, userType: 'teacher' });

    // Generate new OTP
    const otp = generateOTP();
    const otpRecord = new OTP({ email, otp, userType: 'teacher' });
    await otpRecord.save();

    // Send OTP
    const emailResult = await sendOTPEmail(email, otp, 'teacher');
    
    if (!emailResult.success) {
      return res.status(500).json({ error: "Failed to send OTP" });
    }

    res.json({ message: "✅ OTP resent successfully" });
  } catch (error) {
    console.error("❌ Resend OTP error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ============ LEGACY AUTHENTICATION & REGISTRATION ============

// Legacy login for existing teachers (pre-OTP system)
router.post('/login', loginTeacher);

// Legacy register for backward compatibility
router.post('/register', registerTeacher);

// Protected teacher routes
router.get('/me', protectTeacher, getTeacherProfile);
router.get('/profile', protectTeacher, getTeacherProfile);
router.put('/profile', protectTeacher, updateTeacherProfile);

// Admin routes for teacher management
router.get('/', protect, isAdmin, getAllTeachers);
router.put('/:id/verify', protect, isAdmin, verifyTeacher);
router.put('/:id/toggle-status', protect, isAdmin, toggleTeacherStatus);

export default router;
