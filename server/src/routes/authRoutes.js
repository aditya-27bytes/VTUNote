import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from "../services/emailService.js";
import axios from "axios";

const router = express.Router();

// ============ OTP-BASED REGISTRATION ============

// Step 1: Request OTP for registration
router.post("/register-request", async (req, res) => {
  try {
    const { name, email, usn, college, branch, semester } = req.body;

    if (!name || !email || !usn || !college || !branch || !semester) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate USN format (VTU format: e.g., 1XX21CSXXX)
    const usnRegex = /^[1-4][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/;
    if (!usnRegex.test(usn.toUpperCase())) {
      return res.status(400).json({ error: "Invalid USN format. Please enter a valid VTU USN" });
    }

    // Validate semester
    if (semester < 1 || semester > 8) {
      return res.status(400).json({ error: "Semester must be between 1 and 8" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { usn: usn.toUpperCase() }] 
    });
    if (existingUser) {
      const field = existingUser.email === email ? "email" : "USN";
      return res.status(400).json({ error: `User with this ${field} already exists` });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Save OTP to database
    const otpRecord = new OTP({
      email,
      otp,
      userType: 'student'
    });
    await otpRecord.save();

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp, 'student');
    
    if (!emailResult.success) {
      return res.status(500).json({ error: "Failed to send OTP. Please try again." });
    }

    res.json({
      message: "✅ OTP sent to your email. Please verify within 5 minutes.",
      email,
      registrationData: { name, email, usn, college, branch, semester }
    });
  } catch (error) {
    console.error("❌ Register request error:", error);
    res.status(500).json({ error: "Server error during registration request" });
  }
});

// Step 2: Verify OTP and complete registration
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, password, name, usn, college, branch, semester } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ error: "Email, OTP, and password are required" });
    }

    // Find and verify OTP
    const otpRecord = await OTP.findOne({ email, userType: 'student' });
    
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

    // Create new user (mark as verified)
    const user = new User({
      name,
      email,
      password,
      usn: usn.toUpperCase(),
      college,
      branch,
      semester: parseInt(semester),
      isVerified: true,
      verifiedAt: new Date()
    });
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(email, name, 'student');

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secretkey", { expiresIn: "7d" });

    res.json({
      message: "✅ Registration successful! Email verified.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        usn: user.usn,
        college: user.college,
        branch: user.branch,
        semester: user.semester,
        role: user.role
      }
    });
  } catch (error) {
    console.error("❌ OTP verification error:", error);
    res.status(500).json({ error: "Server error during OTP verification" });
  }
});

// ============ GOOGLE AUTHENTICATION ============

// Google Auth for students
router.post("/google-auth", async (req, res) => {
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

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, generate token
      const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secretkey", { expiresIn: "7d" });
      return res.json({
        message: "✅ Login successful",
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          usn: user.usn,
          college: user.college,
          branch: user.branch,
          semester: user.semester,
          role: user.role
        }
      });
    }

    // New user - send OTP for registration completion
    const otp = generateOTP();
    
    const otpRecord = new OTP({
      email,
      otp,
      userType: 'student'
    });
    await otpRecord.save();

    // Send OTP
    await sendOTPEmail(email, otp, 'student');

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
router.post("/complete-google-registration", async (req, res) => {
  try {
    const { email, otp, usn, college, branch, semester, name } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, userType: 'student' });
    
    if (!otpRecord) {
      return res.status(400).json({ error: "OTP expired. Please start registration again." });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Create user with Google auth (no password) and mark verified
    const user = new User({
      name: name || email.split('@')[0],
      email,
      password: Math.random().toString(36).slice(2), // Random password since using Google auth
      usn: usn.toUpperCase(),
      college,
      branch,
      semester: parseInt(semester),
      isVerified: true,
      verifiedAt: new Date()
    });
    await user.save();

    // Delete OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Send welcome email
    await sendWelcomeEmail(email, name || email.split('@')[0], 'student');

    // Generate JWT token
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secretkey", { expiresIn: "7d" });

    res.json({
      message: "✅ Registration completed successfully",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        usn: user.usn,
        college: user.college,
        branch: user.branch,
        semester: user.semester,
        role: user.role
      }
    });
  } catch (error) {
    console.error("❌ Complete Google registration error:", error);
    res.status(500).json({ error: "Server error during registration completion" });
  }
});

// ============ LEGACY REGISTRATION (Keep backward compatibility) ============

// Register (kept for backward compatibility)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, usn, college, branch, semester } = req.body;

    if (!name || !email || !password || !usn || !college || !branch || !semester) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate USN format (VTU format: e.g., 1XX21CSXXX)
    const usnRegex = /^[1-4][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/;
    if (!usnRegex.test(usn.toUpperCase())) {
      return res.status(400).json({ error: "Invalid USN format. Please enter a valid VTU USN" });
    }

    // Validate semester
    if (semester < 1 || semester > 8) {
      return res.status(400).json({ error: "Semester must be between 1 and 8" });
    }

    // Check if user exists (by email or USN)
    const existingUser = await User.findOne({ 
      $or: [{ email }, { usn: usn.toUpperCase() }] 
    });
    if (existingUser) {
      const field = existingUser.email === email ? "email" : "USN";
      return res.status(400).json({ error: `User with this ${field} already exists` });
    }

    // Create user (password will be hashed by pre-save hook). Legacy register considered verified.
    const user = new User({ 
      name, 
      email, 
      password, 
      usn: usn.toUpperCase(), 
      college, 
      branch, 
      semester: parseInt(semester),
      isVerified: true,
      verifiedAt: new Date()
    });
    await user.save();

    res.json({ message: "✅ User registered successfully" });
  } catch (err) {
    console.error("Register error:", err.message);
    if (err.code === 11000) {
      const field = err.keyValue.email ? "email" : "USN";
      return res.status(400).json({ error: `User with this ${field} already exists` });
    }
    res.status(500).json({ error: "❌ Server error during registration" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔑 Login attempt:", { email, passwordLength: password?.length });

    if (!email || !password) {
      console.log("❌ Missing credentials");
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findOne({ email });
    console.log("👤 User found:", user ? "Yes" : "No");
    if (!user) {
      console.log("❌ User not found for email:", email);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Compare password using model method
    const isMatch = await user.comparePassword(password);
    console.log("🔒 Password match:", isMatch);
    if (!isMatch) {
      console.log("❌ Password mismatch for user:", email);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Ensure the user has verified their email via OTP
    if (!user.isVerified) {
      console.log("❌ Login attempt for unverified user:", email);
      return res.status(403).json({
        error: "Account not verified. Please verify your email with OTP before logging in.",
        actions: {
          resendOtp: "/api/auth/resend-otp",
          requestOtp: "/api/auth/register-request"
        }
      });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secretkey", { expiresIn: "7d" });
    console.log("✅ Login successful for:", email);

    res.json({ 
      message: "✅ Login successful", 
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        usn: user.usn,
        college: user.college,
        branch: user.branch,
        semester: user.semester,
        role: user.role 
      }
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { email, userType = 'student' } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Delete existing OTP if any
    await OTP.deleteOne({ email, userType });

    // Generate new OTP
    const otp = generateOTP();
    const otpRecord = new OTP({ email, otp, userType });
    await otpRecord.save();

    // Send OTP
    const emailResult = await sendOTPEmail(email, otp, userType);
    
    if (!emailResult.success) {
      return res.status(500).json({ error: "Failed to send OTP" });
    }

    res.json({ message: "✅ OTP resent successfully" });
  } catch (error) {
    console.error("❌ Resend OTP error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get current user info
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        usn: user.usn,
        college: user.college,
        branch: user.branch,
        semester: user.semester,
        role: user.role 
      } 
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Debug route to list users (development only)
router.get("/debug/users", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).limit(10);
    res.json({ users, count: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug route to reset password (development only)
router.post("/debug/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password required" });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();
    
    res.json({ message: "Password reset successfully", email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug route to create test user
router.post("/debug/create-test-user", async (req, res) => {
  try {
    const testUser = {
      name: "Test User",
      email: "test@example.com",
      password: "password123"
    };
    
    const existingUser = await User.findOne({ email: testUser.email });
    if (existingUser) {
      return res.json({ message: "Test user already exists" });
    }
    
    const user = new User(testUser);
    await user.save();
    
    res.json({ message: "Test user created", email: testUser.email, password: testUser.password });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
