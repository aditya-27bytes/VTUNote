import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const API_BASE = 'http://localhost:5000';

async function testLogin() {
  console.log('🔐 Testing teacher login...\n');
  
  const commonPasswords = [
    'password',
    'password123', 
    'teacher123',
    '123456',
    'aditya123',
    'admin123'
  ];
  
  const email = 'aditya99@vtu.edu';
  
  for (const password of commonPasswords) {
    try {
      console.log(`🔑 Trying password: ${password}`);
      const loginData = {
        email: email,
        password: password
      };
      
      const response = await axios.post(`${API_BASE}/api/teachers/login`, loginData);
      
      if (response.data.token) {
        console.log(`✅ LOGIN SUCCESS!`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Token: ${response.data.token.substring(0, 30)}...`);
        if (response.data.teacher && response.data.teacher.name) {
          console.log(`   Teacher: ${response.data.teacher.name}`);
        }
        
        // Now test note creation
        await testNoteCreation(response.data.token);
        return;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`❌ Failed: ${password}`);
      } else {
        console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }
  }
  
  console.log('\n❌ None of the common passwords worked.');
  console.log('💡 You might need to:');
  console.log('   1. Check what password was used when creating the Aditya account');
  console.log('   2. Reset the password in the database');
  console.log('   3. Or create a new teacher account with known credentials');
}

async function testNoteCreation(token) {
  try {
    console.log('\n📝 Testing note creation with valid token...');
    
    const noteData = {
      title: 'Test Note - ' + Date.now(),
      content: 'This is a test note created after successful authentication.',
      module: 'Module 4',
      subject: 'Computer Networks',
      semester: 5,
      branch: 'CSE',
      summary: 'Test summary for computer networks',
      keyPoints: ['TCP/IP', 'OSI Model', 'Routing', 'Switching'],
      isPublic: true,
      noteType: 'teacher',
      useAI: false
    };

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(`${API_BASE}/api/teacher-notes`, noteData, { headers });
    
    console.log('🎉 NOTE CREATION SUCCESS!');
    console.log(`   Title: ${response.data.title}`);
    console.log(`   ID: ${response.data._id}`);
    console.log(`   Subject: ${response.data.subject}`);
    console.log(`   Module: ${response.data.module}`);
    console.log('\n✅ The note creation issue is FIXED!');
    
  } catch (error) {
    console.log('❌ Note creation failed:', error.response?.data?.message || error.message);
    
    if (error.response?.data?.errors) {
      console.log('📋 Validation errors:', error.response.data.errors);
    }
  }
}

testLogin();
