import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const API_BASE = 'http://localhost:5000';

// Test function to create a note
async function testNoteCreation() {
  try {
    console.log('🧪 Testing teacher note creation...');
    
    // First, let's test if we can reach the server
    console.log('📡 Testing server connectivity...');
    const healthCheck = await axios.get(`${API_BASE}/api/teacher-notes/public`);
    console.log('✅ Server is reachable');
    
    // Test data
    const noteData = {
      title: 'Test Note',
      content: 'This is a test note content.',
      module: 'Module 1',
      subject: 'Test Subject',
      semester: 1,
      branch: 'CSE',
      summary: 'Test summary',
      keyPoints: ['Point 1', 'Point 2'],
      concepts: [{ term: 'Test', definition: 'Test definition' }],
      isPublic: false,
      noteType: 'teacher',
      useAI: false
    };
    
    console.log('📝 Note data prepared:', JSON.stringify(noteData, null, 2));
    
    // We need a valid teacher token for this to work
    // For now, let's just test the endpoint accessibility
    console.log('⚠️  Cannot test note creation without valid teacher authentication');
    console.log('🔍 Check the following:');
    console.log('1. Is the teacher authenticated properly?');
    console.log('2. Is the teacher verified (isVerified: true)?');
    console.log('3. Is the teacher active (isActive: true)?');
    console.log('4. Are all required fields provided?');
    console.log('   - title, module, subject, semester, branch are required');
    console.log('   - Either content or PDF file must be provided');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Test MongoDB connection
async function testMongoConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    const mongoose = await import('mongoose');
    
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai_notes";
    console.log('📍 Connecting to:', MONGO_URI);
    
    await mongoose.default.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');
    
    // Test if we can find any teachers
    const Teacher = (await import('./src/models/Teacher.js')).default;
    const teacherCount = await Teacher.countDocuments();
    console.log(`👨‍🏫 Teachers in database: ${teacherCount}`);
    
    // Test if we can find any notes
    const Note = (await import('./src/models/Note.js')).default;
    const noteCount = await Note.countDocuments();
    console.log(`📚 Notes in database: ${noteCount}`);
    
    await mongoose.default.connection.close();
    console.log('🔌 MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting diagnostic tests...\n');
  
  await testMongoConnection();
  console.log('\n' + '='.repeat(50) + '\n');
  await testNoteCreation();
  
  console.log('\n✅ Diagnostic tests completed');
}

runTests();
