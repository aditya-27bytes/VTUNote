// Test script for authentication endpoints
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testAuthentication() {
  console.log('🧪 Testing Authentication Endpoints...\n');
  
  try {
    // Test registration
    console.log('1️⃣ Testing Registration...');
    const registerData = {
      name: 'Test User',
      email: 'test@vtu.edu',
      password: 'password123',
      usn: '1BG21CS001',
      college: 'BNM Institute of Technology',
      branch: 'Computer Science and Engineering',
      semester: 5
    };
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
      console.log('✅ Registration successful:', registerResponse.data);
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        console.log('ℹ️ User already exists, continuing with login test...');
      } else {
        console.log('❌ Registration failed:', error.response?.data);
      }
    }
    
    // Test login
    console.log('\n2️⃣ Testing Login...');
    const loginData = {
      email: 'test@vtu.edu',
      password: 'password123'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ Login successful:', loginResponse.data);
    
    // Test token validation
    console.log('\n3️⃣ Testing Token Validation...');
    const token = loginResponse.data.token;
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Token validation successful:', meResponse.data);
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAuthentication();
}

export default testAuthentication;