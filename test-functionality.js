// Test functionality for teacher registration and student-teacher connections
// This file can be run with node to test the API endpoints

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Test Teacher Registration
async function testTeacherRegistration() {
    console.log('🧪 Testing Teacher Registration...');
    
    const teacherData = {
        name: 'Dr. John Smith',
        email: 'john.smith.test@example.com',
        password: 'testpassword123',
        employeeId: 'EMP12345',
        department: 'Computer Science',
        designation: 'Professor',
        qualification: 'PhD',
        experience: 10,
        phone: '1234567890',
        college: 'Test University',
        subjects: ['Data Structures', 'Algorithms'],
        bio: 'Experienced professor in Computer Science'
    };
    
    try {
        const response = await axios.post(`${API_BASE_URL}/teachers/register`, teacherData);
        console.log('✅ Teacher Registration Success:', response.data.name, response.data.email);
        return response.data;
    } catch (error) {
        console.error('❌ Teacher Registration Failed:', error.response?.data?.message || error.message);
        return null;
    }
}

// Test Student Registration (for connection testing)
async function testStudentRegistration() {
    console.log('🧪 Testing Student Registration...');
    
    const studentData = {
        name: 'Alice Johnson',
        email: 'alice.test@example.com',
        password: 'testpassword123',
        usn: 'USN123456',
        college: 'Test University',
        branch: 'Computer Science',
        semester: 5
    };
    
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, studentData);
        console.log('✅ Student Registration Success:', response.data.name, response.data.email);
        return response.data;
    } catch (error) {
        console.error('❌ Student Registration Failed:', error.response?.data?.message || error.message);
        return null;
    }
}

// Test Student-Teacher Connection
async function testStudentTeacherConnection(studentToken, teacherId) {
    console.log('🧪 Testing Student-Teacher Connection...');
    
    try {
        const response = await axios.post(
            `${API_BASE_URL}/connections/connect`,
            { teacherId, message: 'Test connection request' },
            { headers: { Authorization: `Bearer ${studentToken}` } }
        );
        console.log('✅ Connection Request Success:', response.data.message);
        return response.data;
    } catch (error) {
        console.error('❌ Connection Request Failed:', error.response?.data?.message || error.message);
        return null;
    }
}

// Test Get Available Teachers
async function testGetAvailableTeachers(studentToken) {
    console.log('🧪 Testing Get Available Teachers...');
    
    try {
        const response = await axios.get(
            `${API_BASE_URL}/connections/teachers`,
            { headers: { Authorization: `Bearer ${studentToken}` } }
        );
        console.log('✅ Available Teachers Success:', response.data.teachers?.length || response.data.length, 'teachers found');
        return response.data;
    } catch (error) {
        console.error('❌ Get Available Teachers Failed:', error.response?.data?.message || error.message);
        return null;
    }
}

// Main test function
async function runTests() {
    console.log('🚀 Starting Functionality Tests...\n');
    
    // Test teacher registration
    const teacher = await testTeacherRegistration();
    if (!teacher) {
        console.log('❌ Teacher registration failed, stopping tests');
        return;
    }
    
    console.log('');
    
    // Test student registration  
    const student = await testStudentRegistration();
    if (!student) {
        console.log('❌ Student registration failed, stopping tests');
        return;
    }
    
    console.log('');
    
    // Test get available teachers
    await testGetAvailableTeachers(student.token);
    
    console.log('');
    
    // Test student-teacher connection
    await testStudentTeacherConnection(student.token, teacher._id);
    
    console.log('\n🎉 All tests completed!');
}

// Handle cleanup on exit
process.on('exit', () => {
    console.log('\n🧹 Test cleanup complete');
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { testTeacherRegistration, testStudentRegistration, testStudentTeacherConnection, testGetAvailableTeachers };
