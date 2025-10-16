const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testStudentLogin() {
  try {
    console.log('Testing student login...');
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Student login successful:', response.data.user.name);
    return response.data.token;
  } catch (error) {
    console.log('❌ Student login failed:', error.response?.data?.error || error.message);
    return null;
  }
}

async function testTeacherLogin() {
  try {
    console.log('Testing teacher login...');
    const response = await axios.post(`${API_BASE}/teachers/login`, {
      email: 'teacher@vtu.edu',
      password: 'teacher123'
    });
    console.log('✅ Teacher login successful:', response.data.name);
    return response.data.token;
  } catch (error) {
    console.log('❌ Teacher login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testTeacherProfile(token) {
  if (!token) return;
  
  try {
    console.log('Testing teacher profile...');
    const response = await axios.get(`${API_BASE}/teachers/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Teacher profile retrieved:', response.data.name);
  } catch (error) {
    console.log('❌ Teacher profile failed:', error.response?.data?.message || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting login tests...\n');
  
  const studentToken = await testStudentLogin();
  console.log('');
  
  const teacherToken = await testTeacherLogin();
  console.log('');
  
  await testTeacherProfile(teacherToken);
  console.log('\n✨ Tests completed!');
}

runTests().catch(console.error);
