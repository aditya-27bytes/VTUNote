import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  
  // VTU Module Organization
  module: { type: String, required: true }, // Module name/number (e.g., "Module 1", "Module 2")
  subject: { type: String, required: true }, // Subject name (e.g., "Data Structures", "DBMS")
  semester: { type: Number, required: true, min: 1, max: 8 },
  branch: { type: String, required: true }, // Engineering branch
  
  // PDF Processing
  summary: { type: String },           // AI-generated summary
  provider: { type: String },          // AI provider used (openai, gemini, perplexity, etc.)
  numPages: { type: Number },          // Number of pages in PDF
  pdfPath: { type: String },          // store file path
  originalFileName: { type: String },  // original PDF filename
  extractedText: { type: String },    // extracted PDF text
  
  // Image Extraction
  extractedImages: [{
    filename: { type: String, required: true },
    path: { type: String, required: true },
    pageNumber: { type: Number, required: true },
    description: { type: String }, // AI-generated description of the image
    isImportant: { type: Boolean, default: false }, // Marked as important by AI
    size: { type: Number }, // File size in bytes
    mimetype: { type: String, default: 'image/png' }
  }],
  
  // Flashcards
  flashcards: [{
    question: { type: String, required: true },
    answer: { type: String, required: true },
    explanation: { type: String }, // Detailed explanation
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    tags: [String] // Topic tags
  }],
  
  // Text Analysis
  keyPoints: [String], // Important points extracted
  concepts: [{
    term: String,
    definition: String,
    explanation: String
  }],
  
  // Metadata
  isPublic: { type: Boolean, default: false }, // Can be shared with other students
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  
  // Teacher-specific fields
  isTeacherNote: { type: Boolean, default: false }, // Indicates if note is published by teacher
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }, // Reference to teacher
  noteType: { type: String, enum: ['student', 'teacher'], default: 'student' }, // Note type
  isApproved: { type: Boolean, default: true }, // For teacher notes, admin approval status
  publishedDate: { type: Date }, // When teacher published the note
  
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("Note", noteSchema);
