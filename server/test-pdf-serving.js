import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import mongoose from 'mongoose';
import Note from './src/models/Note.js';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000';

async function testPDFServing() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai_notes";
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get teacher token first
    console.log('\n🔑 Getting teacher authentication token...');
    const loginData = {
      email: 'aditya99@vtu.edu',
      password: '123456'
    };

    const loginResponse = await axios.post(`${API_BASE}/api/teachers/login`, loginData);
    const token = loginResponse.data.token;
    console.log('✅ Got authentication token');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Get notes with PDFs
    console.log('\n📚 Fetching notes with PDF files...');
    const notesWithPDF = await Note.find({ 
      pdfPath: { $exists: true, $ne: null },
      teacherId: mongoose.Types.ObjectId.createFromHexString('68bd39be5e4a41982f04f973') // Aditya's teacher ID
    });

    console.log(`Found ${notesWithPDF.length} notes with PDF files for this teacher`);

    for (let i = 0; i < notesWithPDF.length; i++) {
      const note = notesWithPDF[i];
      console.log(`\n📄 Testing PDF ${i + 1}:`);
      console.log(`   Note ID: ${note._id}`);
      console.log(`   Title: ${note.title}`);
      console.log(`   PDF Path: ${note.pdfPath}`);

      // Check if file exists on filesystem
      const fileExists = fs.existsSync(note.pdfPath);
      console.log(`   File exists on filesystem: ${fileExists ? '✅ YES' : '❌ NO'}`);

      if (!fileExists) {
        console.log(`   ❌ File not found at: ${note.pdfPath}`);
        
        // Try different path variations
        const relativePath = note.pdfPath.replace(/^.*[\\\/]uploads[\\\/]/, 'uploads/');
        const absolutePath = path.join(process.cwd(), relativePath);
        
        console.log(`   🔍 Trying relative path: ${relativePath}`);
        console.log(`   🔍 Trying absolute path: ${absolutePath}`);
        console.log(`   🔍 Relative exists: ${fs.existsSync(relativePath) ? '✅ YES' : '❌ NO'}`);
        console.log(`   🔍 Absolute exists: ${fs.existsSync(absolutePath) ? '✅ YES' : '❌ NO'}`);
      }

      // Test the PDF serving endpoint
      try {
        console.log(`   🌐 Testing PDF serving endpoint: /api/teacher-notes/pdf/${note._id}`);
        
        // Make request to PDF endpoint
        const response = await axios.get(`${API_BASE}/api/teacher-notes/pdf/${note._id}`, {
          headers,
          responseType: 'stream' // Important for PDF files
        });

        console.log(`   ✅ PDF endpoint responded with status: ${response.status}`);
        console.log(`   📄 Content-Type: ${response.headers['content-type']}`);
        console.log(`   📏 Content-Length: ${response.headers['content-length']}`);

      } catch (error) {
        console.log(`   ❌ PDF serving failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        
        if (error.response?.status === 404) {
          console.log('   💡 This indicates either the note wasn\'t found or the PDF file is missing');
        }
      }
    }

    // Test a direct file path issue simulation
    console.log('\n🔧 Testing file serving with different path formats...');
    const testNote = notesWithPDF[0];
    if (testNote) {
      const originalPath = testNote.pdfPath;
      
      console.log(`\n🔍 Original path: ${originalPath}`);
      
      // Test with res.sendFile using different root options
      console.log('📂 Current working directory:', process.cwd());
      
      const pathVariations = [
        originalPath,
        originalPath.replace(/\\/g, '/'),  // Convert backslashes to forward slashes
        path.resolve(originalPath),        // Get absolute path
        path.relative(process.cwd(), originalPath), // Get relative path
      ];
      
      pathVariations.forEach((pathVar, index) => {
        const exists = fs.existsSync(pathVar);
        console.log(`   Path ${index + 1}: ${pathVar} - ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPDFServing();
