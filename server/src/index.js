// server.js
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import authRoutes from "./routes/authRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import aiRoutes from "./routes/ai.js";
import adminRoutes from "./routes/admin.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import teacherNoteRoutes from "./routes/teacherNoteRoutes.js";
import studentNoteRoutes from "./routes/studentNoteRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import connectionRoutes from "./routes/connectionRoutes.js";

dotenv.config();

// Verify environment variables are loaded
console.log('🔍 Environment variables check:');
console.log('- PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? `${process.env.PERPLEXITY_API_KEY.substring(0, 15)}...` : '❌ NOT FOUND');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 15)}...` : '❌ NOT FOUND');
console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 15)}...` : '❌ NOT FOUND');
console.log('- MONGO_URI:', process.env.MONGO_URI ? '✅ Found' : '❌ NOT FOUND');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Found' : '❌ NOT FOUND');
console.log('- Actual MONGO_URI being used:', process.env.MONGO_URI || "mongodb://localhost:27017/ai-notes");

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ----------------- MIDDLEWARE -----------------
app.use(express.json({ limit: '50mb' })); // Parse JSON with increased limit for large PDF content
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Handle URL encoded data with increased limit
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));         // Enable CORS with specific settings
app.use(helmet());       // Security headers
app.use(morgan("dev"));  // Request logging

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ----------------- ROUTES -----------------
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/teacher-notes", teacherNoteRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/connections", connectionRoutes);

// Student notes endpoint (public + connected teacher notes)
app.use("/api/student/notes", studentNoteRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ----------------- MONGODB CONNECTION -----------------
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-notes";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT signal, shutting down gracefully...");
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed due to app termination");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.log('Uncaught Exception:', error);
});

// ----------------- START SERVER -----------------
const PORT = process.env.PORT || 5000;

const startServer = (port) => {
  try {
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is busy, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Failed to start server:', err);
    }
  }
};

startServer(PORT);
