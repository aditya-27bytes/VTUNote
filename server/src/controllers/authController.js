import jwt from "jsonwebtoken";
import User from "../models/User.js";

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, usn, college, branch, semester } = req.body || {};
    if (!name || !email || !password || !usn || !college || !branch || !semester) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const usnExists = await User.findOne({ usn });
    if (usnExists) return res.status(409).json({ error: "USN already registered" });

    const user = await User.create({ name, email, password, usn, college, branch, semester: parseInt(semester) });
    res.json({ 
      message: "Registered successfully", 
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = sign(user._id);
    res.json({
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};
