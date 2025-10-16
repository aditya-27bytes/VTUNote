// Debug script for teacher notes visibility issues
import axios from 'axios';
import readline from 'readline';

const API_BASE_URL = 'http://localhost:5000/api';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  try {
    console.log('🔍 Teacher Notes Debug Script\n');
    
    // Step 1: Register a teacher
    console.log('1️⃣ Registering a test teacher...');
    const teacherData = {
      name: 'Dr. Test Teacher',
      email: `testteacher${Date.now()}@example.com`,
      password: 'testpass123',
      employeeId: `EMP${Date.now()}`,
      department: 'Computer Science',
      designation: 'Professor',
      qualification: 'PhD',
      experience: 5,
      phone: '1234567890',
      college: 'Test University',
      subjects: ['Data Structures', 'Algorithms'],
      bio: 'Test teacher for debugging'
    };
    
    const registerResponse = await axios.post(`${API_BASE_URL}/teachers/register`, teacherData);
    console.log('✅ Teacher registered successfully');
    console.log('Teacher ID:', registerResponse.data._id);
    console.log('Teacher Token:', registerResponse.data.token ? '✅ Present' : '❌ Missing');
    console.log('Teacher isActive:', registerResponse.data.isActive);
    console.log('Teacher isVerified:', registerResponse.data.isVerified);
    
    const token = registerResponse.data.token;
    
    // Step 2: Test getting teacher notes
    console.log('\n2️⃣ Testing teacher notes API...');
    try {
      const notesResponse = await axios.get(`${API_BASE_URL}/teacher-notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Teacher notes API accessible');
      console.log('Notes count:', notesResponse.data.length);
    } catch (error) {
      console.log('❌ Teacher notes API failed');
      console.log('Error status:', error.response?.status);
      console.log('Error message:', error.response?.data?.message);
    }
    
    // Step 3: Test getting teacher stats
    console.log('\n3️⃣ Testing teacher stats API...');
    try {
      const statsResponse = await axios.get(`${API_BASE_URL}/teacher-notes/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Teacher stats API accessible');
      console.log('Stats:', statsResponse.data);
    } catch (error) {
      console.log('❌ Teacher stats API failed');
      console.log('Error status:', error.response?.status);
      console.log('Error message:', error.response?.data?.message);
    }
    
    // Step 4: Test creating a note
    console.log('\n4️⃣ Testing note creation...');
    try {
      const noteData = {
        title: 'Test Note',
        content: 'This is a test note for debugging',
        subject: 'Testing',
        module: 'Debug Module',
        semester: 5,
        branch: 'Computer Science',
        isPublic: false,
        noteType: 'teacher',
        useAI: false
      };
      
      const createResponse = await axios.post(`${API_BASE_URL}/teacher-notes`, noteData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Note created successfully');
      console.log('Note ID:', createResponse.data._id);
      
      // Step 5: Test getting notes again after creation
      console.log('\n5️⃣ Re-testing teacher notes API after creation...');
      const notesResponse2 = await axios.get(`${API_BASE_URL}/teacher-notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Teacher notes API accessible');
      console.log('Notes count after creation:', notesResponse2.data.length);
      
    } catch (error) {
      console.log('❌ Note creation failed');
      console.log('Error status:', error.response?.status);
      console.log('Error message:', error.response?.data?.message);
      console.log('Error details:', error.response?.data);
    }
    
  } catch (error) {
    console.error('Debug script error:', error.response?.data || error.message);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
