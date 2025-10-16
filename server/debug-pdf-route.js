import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import mongoose from 'mongoose';
import Note from './src/models/Note.js';

const API_BASE = 'http://localhost:5000';

async function debugPDFRoute() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai_notes";
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get teacher token
    const loginData = {
      email: 'aditya99@vtu.edu',
      password: '123456'
    };

    const loginResponse = await axios.post(`${API_BASE}/api/teachers/login`, loginData);
    const token = loginResponse.data.token;
    console.log('✅ Got authentication token');

    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // Test 1: Get the teacher's notes first
    console.log('\n📚 Getting teacher notes...');
    try {
      const notesResponse = await axios.get(`${API_BASE}/api/teacher-notes`, { headers });
      console.log(`✅ Got ${notesResponse.data.length} notes from API`);
      
      const notesWithPDF = notesResponse.data.filter(note => note.pdfPath);
      console.log(`📄 Notes with PDF: ${notesWithPDF.length}`);
      
      if (notesWithPDF.length > 0) {
        const testNote = notesWithPDF[0];
        console.log('\n🎯 Testing with note:');
        console.log(`   ID: ${testNote._id}`);
        console.log(`   Title: ${testNote.title}`);
        console.log(`   Has pdfPath in API response: ${testNote.pdfPath ? '✅ YES' : '❌ NO'}`);
        
        // Test the PDF route directly
        console.log(`\n🌐 Testing PDF route: /api/teacher-notes/pdf/${testNote._id}`);
        
        try {
          const pdfResponse = await axios.get(`${API_BASE}/api/teacher-notes/pdf/${testNote._id}`, {
            headers,
            timeout: 10000 // 10 second timeout
          });
          
          console.log(`✅ PDF route success! Status: ${pdfResponse.status}`);
          console.log(`📄 Content-Type: ${pdfResponse.headers['content-type']}`);
          console.log(`📏 Content-Length: ${pdfResponse.headers['content-length']}`);
          
        } catch (pdfError) {
          console.log(`❌ PDF route failed with status: ${pdfError.response?.status}`);
          
          if (pdfError.response?.status === 404) {
            console.log('🔍 404 Error - checking why...');
            
            // Check if the note exists in database with correct teacher ID
            const dbNote = await Note.findOne({
              _id: testNote._id,
              teacherId: mongoose.Types.ObjectId.createFromHexString('68bd39be5e4a41982f04f973'),
              noteType: 'teacher'
            });
            
            if (!dbNote) {
              console.log('❌ Note not found in database with the expected criteria');
            } else {
              console.log('✅ Note found in database');
              console.log(`   PDF Path in DB: ${dbNote.pdfPath}`);
            }
          }
          
          if (pdfError.response?.data) {
            console.log('Error response:', pdfError.response.data);
          }
        }
      } else {
        console.log('❌ No notes with PDF files found in API response');
      }
      
    } catch (notesError) {
      console.log('❌ Failed to get teacher notes:', notesError.response?.data || notesError.message);
    }

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugPDFRoute();
