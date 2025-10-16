import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
// Note: pdf2pic and sharp will be installed separately
// import pdf2pic from "pdf2pic";
// import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const imagesDir = path.join(uploadsDir, 'images');
const pdfsDir = path.join(uploadsDir, 'pdfs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
}

// Image extraction function (simplified version without pdf2pic for now)
async function extractImagesFromPDF(pdfBuffer, filename) {
  const extractedImages = [];
  
  try {
    // For now, we'll create a placeholder implementation
    // In a full implementation, this would use pdf2pic to extract actual images
    console.log(`📸 Extracting images from PDF: ${filename}`);
    
    // Placeholder: Return empty array for now
    // TODO: Implement actual image extraction using pdf2pic
    return extractedImages;
  } catch (error) {
    console.error('❌ Image extraction error:', error);
    return [];
  }
}

// Multer config to store uploaded files in memory
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log("🔍 Multer fileFilter called:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    cb(null, true);
  }
});

// Test route for debugging
router.post("/test", upload.single("pdf"), async (req, res) => {
  console.log("🧪 Test upload request received");
  console.log("📄 Test file info:", req.file ? {
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    fieldname: req.file.fieldname
  } : "No file received");
  console.log("📋 Request body:", req.body);
  console.log("📡 Request headers:", req.headers);
  
  res.json({
    message: "Test upload received",
    hasFile: !!req.file,
    fileInfo: req.file ? {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    } : null
  });
});

// Upload and parse PDF - removed auth middleware temporarily for testing
router.post("/upload", upload.single("pdf"), async (req, res) => {
  console.log("📤 PDF Upload request received");
  console.log("📄 Raw req.file:", req.file);
  console.log("📄 Raw req.files:", req.files);
  console.log("📋 Request body:", req.body);
  console.log("📡 Content-Type:", req.headers['content-type']);
  
  try {
    // Check if file exists in the request
    if (!req.file) {
      console.log("❌ No PDF file uploaded");
      return res.status(400).json({ error: "No PDF file uploaded" });
    }
    
    console.log("📄 File info:", { 
      originalname: req.file.originalname, 
      size: req.file.size,
      mimetype: req.file.mimetype,
      fieldname: req.file.fieldname,
      buffer: req.file.buffer ? `Buffer(${req.file.buffer.length} bytes)` : 'No buffer'
    });

    // Verify buffer exists
    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.log("❌ Empty file buffer");
      return res.status(400).json({ error: "Empty PDF file" });
    }

    console.log("🔍 Starting PDF parsing...");
    // Parse PDF with error handling
    try {
      const data = await pdfParse(req.file.buffer);
      console.log("✅ PDF parsed successfully:", {
        pages: data.numpages,
        textLength: data.text?.length || 0
      });

      // Save the PDF file to disk
      const timestamp = Date.now();
      const sanitizedFilename = req.file.originalname.replace(/[^a-zA-Z0-9\.\-_]/g, '_');
      const pdfFilename = `${timestamp}_${sanitizedFilename}`;
      const pdfPath = path.join(pdfsDir, pdfFilename);
      
      console.log("💾 Saving PDF file to:", pdfPath);
      fs.writeFileSync(pdfPath, req.file.buffer);
      console.log("✅ PDF file saved successfully");

      // Extract images from PDF
      console.log("📸 Starting image extraction...");
      const extractedImages = await extractImagesFromPDF(req.file.buffer, req.file.originalname);
      console.log(`✅ Image extraction completed: ${extractedImages.length} images found`);

      res.json({
        text: data.text, // Extracted text
        numPages: data.numpages,
        info: data.info,
        images: extractedImages, // Add extracted images to response
        pdfPath: `pdfs/${pdfFilename}`, // Relative path for storage
        originalFileName: req.file.originalname // Original filename
      });
    } catch (parseErr) {
      console.error("❌ PDF parse error:", parseErr);
      return res.status(400).json({ error: "Could not parse PDF file. Please ensure it's a valid PDF." });
    }
  } catch (err) {
    console.error("❌ PDF upload error:", err);
    res.status(500).json({ error: "Failed to process PDF upload" });
  }
});

// Download PDF route
router.get("/download/:noteId", async (req, res) => {
  try {
    console.log("📋 PDF download request for note:", req.params.noteId);
    
    // Import Note model dynamically to avoid circular imports
    const { default: Note } = await import("../models/Note.js");
    
    // Find the note and get the PDF path
    const note = await Note.findById(req.params.noteId);
    
    if (!note) {
      console.log("❌ Note not found:", req.params.noteId);
      return res.status(404).json({ error: "Note not found" });
    }
    
    if (!note.pdfPath) {
      console.log("❌ No PDF file associated with note:", req.params.noteId);
      return res.status(404).json({ error: "PDF file not found for this note" });
    }
    
    // Construct the full path to the PDF file
    const fullPdfPath = path.join(uploadsDir, note.pdfPath);
    console.log("📂 Looking for PDF at:", fullPdfPath);
    
    // Check if file exists
    if (!fs.existsSync(fullPdfPath)) {
      console.log("❌ PDF file does not exist at:", fullPdfPath);
      return res.status(404).json({ error: "PDF file not found on server" });
    }
    
    // Get the original filename or use a default
    const downloadFilename = note.originalFileName || `${note.title}.pdf`;
    
    console.log("✅ Serving PDF file:", downloadFilename);
    
    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(fullPdfPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error("❌ Error streaming PDF file:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading PDF file" });
      }
    });
    
  } catch (err) {
    console.error("❌ PDF download error:", err);
    res.status(500).json({ error: "Failed to download PDF file" });
  }
});

export default router;
