import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function testOTPEmail() {
  try {
    console.log('🧪 Testing OTP Email Service');
    console.log('═'.repeat(60));
    
    // Test registration request with OTP
    console.log('\n📧 Attempting to send OTP email...\n');
    
    const response = await axios.post(`${API_URL}/auth/register-request`, {
      name: 'Test User',
      email: 'test.otp@example.com',
      usn: '1CS21CS001',
      college: 'VTU',
      branch: 'CSE',
      semester: 5
    }, {
      timeout: 10000
    });
    
    console.log('✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ OTP EMAIL TEST PASSED');
      console.log('   → OTP has been sent to test.otp@example.com');
      console.log('   → Check email for OTP code');
    } else {
      console.log('\n⚠️  Response indicates an issue:');
      console.log(response.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Server Error:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused - Server not running on port 5001');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
}

testOTPEmail();
