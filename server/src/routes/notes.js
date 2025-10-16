import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import fs from "fs";
import Note from "../models/Note.js";

const router = express.Router();

// Multer setup (store files in /uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Upload a PDF
router.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    // ✅ Read actual file contents
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);

    const newNote = new Note({
      title: req.body.title || req.file.originalname,
      pdfPath: req.file.path,
      extractedText: pdfData.text, // extracted text from PDF
      owner: req.user?.id || null
    });

    await newNote.save();
    res.json({ msg: "PDF uploaded successfully", note: newNote });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error while uploading PDF" });
  }
});

export default router;
