import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Register
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

    // Create user (password will be hashed by pre-save hook)
    const user = new User({ 
      name, 
      email, 
      password, 
      usn: usn.toUpperCase(), 
      college, 
      branch, 
      semester: parseInt(semester)
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
