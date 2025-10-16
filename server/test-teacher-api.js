import fetch from 'node-fetch';

const testTeacherLogin = async () => {
  try {
    console.log('🧪 Testing teacher login API endpoint...');
    
    const response = await fetch('http://localhost:5000/api/teachers/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teacher@vtu.edu',
        password: 'teacher123'
      })
    });

    const data = await response.json();
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('🔑 Token:', data.token ? '✅ Present' : '❌ Missing');
    } else {
      console.log('❌ Login failed:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
};

testTeacherLogin();
