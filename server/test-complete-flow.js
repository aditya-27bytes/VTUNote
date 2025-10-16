import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import FormData from 'form-data';

const API_BASE = 'http://localhost:5000';

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing complete note creation flow...\n');

    // Step 1: Test teacher login
    console.log('1️⃣ Testing teacher login...');
    const loginData = {
      email: 'aditya99@vtu.edu',
      password: 'yourpassword' // You'll need to provide the correct password
    };

    try {
      const loginResponse = await axios.post(`${API_BASE}/api/teachers/login`, loginData);
      const token = loginResponse.data.token;
      console.log('✅ Teacher login successful');
      console.log(`🔑 Token received: ${token.substring(0, 20)}...`);

      // Step 2: Test note creation with token
      console.log('\n2️⃣ Testing note creation with authentication...');
      const noteData = {
        title: 'Test Module Note',
        content: 'This is a comprehensive test note for module testing.',
        module: 'Module 3',
        subject: 'Data Structures',
        semester: 4,
        branch: 'CSE',
        summary: 'Test summary for data structures',
        keyPoints: ['Arrays', 'Linked Lists', 'Stacks', 'Queues'],
        concepts: [
          { term: 'Array', definition: 'A collection of elements stored at contiguous memory locations' },
          { term: 'Stack', definition: 'A linear data structure that follows LIFO principle' }
        ],
        isPublic: true,
        noteType: 'teacher',
        useAI: false
      };

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const createResponse = await axios.post(`${API_BASE}/api/teacher-notes`, noteData, { headers });
      console.log('✅ Note creation successful!');
      console.log('📝 Created note:', createResponse.data.title);
      console.log(`🆔 Note ID: ${createResponse.data._id}`);

      // Step 3: Verify note was created
      console.log('\n3️⃣ Verifying note was saved...');
      const notesResponse = await axios.get(`${API_BASE}/api/teacher-notes`, { headers });
      console.log(`✅ Total notes by teacher: ${notesResponse.data.length}`);
      
      const createdNote = notesResponse.data.find(note => note._id === createResponse.data._id);
      if (createdNote) {
        console.log('✅ Note found in teacher\'s notes list');
        console.log(`📚 Note details: ${createdNote.title} - ${createdNote.subject}`);
      }

    } catch (loginError) {
      if (loginError.response?.status === 401) {
        console.log('❌ Login failed - incorrect credentials');
        console.log('💡 Try updating the password in the script or use the correct password');
      } else {
        console.log('❌ Login error:', loginError.response?.data?.message || loginError.message);
      }
      
      // Continue with testing without authentication to check other potential issues
      console.log('\n⚠️  Testing note creation without authentication (will fail but shows validation)...');
      await testWithoutAuth();
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testWithoutAuth() {
  try {
    const noteData = {
      title: 'Test Note Without Auth',
      content: 'This should fail',
      module: 'Module 1',
      subject: 'Test',
      semester: 1,
      branch: 'CSE'
    };

    await axios.post(`${API_BASE}/api/teacher-notes`, noteData);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Expected: Authentication required (401)');
      console.log('🔒 Security is working properly - unauthorized requests are blocked');
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

// Test endpoints accessibility
async function testEndpoints() {
  console.log('\n🔗 Testing endpoint accessibility...');
  
  const endpoints = [
    '/api/teacher-notes/public',
    '/api/teachers/login'
  ];
  
  for (const endpoint of endpoints) {
    try {
      await axios.get(`${API_BASE}${endpoint}`);
      console.log(`✅ ${endpoint} - accessible`);
    } catch (error) {
      console.log(`❌ ${endpoint} - error: ${error.response?.status || error.message}`);
    }
  }
}

console.log('🚀 Starting comprehensive flow test...\n');
testEndpoints().then(() => {
  console.log('\n' + '='.repeat(60) + '\n');
  return testCompleteFlow();
}).then(() => {
  console.log('\n✅ All tests completed!');
}).catch(error => {
  console.error('❌ Test suite failed:', error.message);
});
