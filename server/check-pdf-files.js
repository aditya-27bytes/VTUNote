import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Note from './src/models/Note.js';
import fs from 'fs';
import path from 'path';

async function checkPDFFiles() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai_notes";
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📚 Checking notes with PDF files...');
    const notesWithPDF = await Note.find({ pdfPath: { $exists: true, $ne: null } });
    
    console.log(`\n📋 Found ${notesWithPDF.length} notes with PDF files:`);
    
    if (notesWithPDF.length === 0) {
      console.log('❌ No notes with PDF files found');
      console.log('💡 This might be why PDF loading is failing - no PDF files exist');
    } else {
      notesWithPDF.forEach((note, index) => {
        console.log(`\n📄 Note ${index + 1}:`);
        console.log(`   ID: ${note._id}`);
        console.log(`   Title: ${note.title}`);
        console.log(`   PDF Path: ${note.pdfPath || 'N/A'}`);
        console.log(`   Teacher ID: ${note.teacherId}`);
        console.log(`   Note Type: ${note.noteType}`);
        
        // Check if file exists
        if (note.pdfPath) {
          const fileExists = fs.existsSync(note.pdfPath);
          console.log(`   File Exists: ${fileExists ? '✅ YES' : '❌ NO'}`);
          
          if (fileExists) {
            const stats = fs.statSync(note.pdfPath);
            console.log(`   File Size: ${stats.size} bytes`);
            console.log(`   File Modified: ${stats.mtime}`);
          }
        }
      });
    }
    
    // Check uploads directory structure
    console.log('\n📁 Checking uploads directory structure...');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const teacherNotesDir = path.join(uploadsDir, 'teacher-notes');
    
    console.log(`   Uploads directory: ${uploadsDir}`);
    console.log(`   Exists: ${fs.existsSync(uploadsDir) ? '✅ YES' : '❌ NO'}`);
    
    console.log(`   Teacher notes directory: ${teacherNotesDir}`);
    console.log(`   Exists: ${fs.existsSync(teacherNotesDir) ? '✅ YES' : '❌ NO'}`);
    
    if (fs.existsSync(teacherNotesDir)) {
      const files = fs.readdirSync(teacherNotesDir);
      console.log(`   Files in teacher-notes: ${files.length}`);
      files.forEach(file => console.log(`     - ${file}`));
    }

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPDFFiles();
