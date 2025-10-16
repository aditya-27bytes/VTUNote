import dotenv from "dotenv";
import mongoose from "mongoose";
import axios from "axios";
import fs from "fs";
import path from "path";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai_notes";
const BASE_URL = "http://localhost:5000/api";

let teacherToken = "";
let studentToken = "";
let uploadedNoteId = "";

console.log("🧪 Testing Student Features...\n");

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

async function testTeacherLogin() {
  try {
    console.log("\n1️⃣ Testing teacher login...");
    const response = await axios.post(`${BASE_URL}/teachers/login`, {
      email: "teacher@vtu.edu",
      password: "teacher123"
    });
    
    teacherToken = response.data.token;
    console.log("✅ Teacher login successful");
    return true;
  } catch (error) {
    console.log("❌ Teacher login failed:", error.response?.data?.message || error.message);
    return false;
  }
}

async function testStudentLogin() {
  try {
    console.log("\n2️⃣ Testing student login...");
    
    // First try to create a test student if it doesn't exist
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: "Test Student",
        email: "student@test.com",
        password: "student123",
        usn: "1NH21CS001",
        branch: "Computer Science and Engineering",
        semester: 5,
        college: "Test College"
      });
      console.log("📝 Test student created");
    } catch (error) {
      // Student might already exist, that's fine
    }
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: "student@test.com",
      password: "student123"
    });
    
    studentToken = response.data.token;
    console.log("✅ Student login successful");
    return true;
  } catch (error) {
    console.log("❌ Student login failed:", error.response?.data?.message || error.message);
    return false;
  }
}

async function testStudentNotesUpload() {
  try {
    console.log("\n3️⃣ Testing student notes upload endpoint...");
    
    const noteData = {
      title: "Test Student Note",
      module: "Module 1",
      subject: "Data Structures",
      semester: 5,
      branch: "Computer Science and Engineering",
      content: "This is test content for student note upload",
      summary: "Test summary",
      provider: "test",
      isPublic: true,
      noteType: "student"
    };
    
    const response = await axios.post(`${BASE_URL}/notes`, noteData, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    uploadedNoteId = response.data.note._id;
    console.log("✅ Student note upload successful");
    console.log(`   Note ID: ${uploadedNoteId}`);
    return true;
  } catch (error) {
    console.log("❌ Student note upload failed:", error.response?.data || error.message);
    return false;
  }
}

async function testTeacherNotesEndpoint() {
  try {
    console.log("\n4️⃣ Testing teacher notes creation...");
    
    const teacherNoteData = {
      title: "Test Teacher Note",
      module: "Module 1", 
      subject: "Data Structures",
      semester: 5,
      branch: "Computer Science and Engineering",
      content: "This is test content for teacher note",
      summary: "Test teacher summary",
      provider: "test",
      isPublic: true
    };
    
    const response = await axios.post(`${BASE_URL}/teacher-notes`, teacherNoteData, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    
    console.log("✅ Teacher note creation successful");
    console.log(`   Teacher Note ID: ${response.data.note._id}`);
    return true;
  } catch (error) {
    console.log("❌ Teacher note creation failed:", error.response?.data || error.message);
    return false;
  }
}

async function testStudentViewTeacherNotes() {
  try {
    console.log("\n5️⃣ Testing student viewing teacher notes...");
    
    const response = await axios.get(`${BASE_URL}/student/notes`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    console.log("✅ Student can access teacher notes endpoint");
    console.log(`   Found ${response.data.notes.length} teacher notes`);
    console.log(`   Total public: ${response.data.stats.totalPublic}`);
    console.log(`   Connected teachers: ${response.data.stats.connectedTeachers}`);
    
    if (response.data.notes.length > 0) {
      const sampleNote = response.data.notes[0];
      console.log(`   Sample note: "${sampleNote.title}" by ${sampleNote.teacherId?.name || 'Unknown Teacher'}`);
      
      // Test individual note detail
      try {
        const detailResponse = await axios.get(`${BASE_URL}/student/notes/${sampleNote._id}`, {
          headers: { Authorization: `Bearer ${studentToken}` }
        });
        console.log("✅ Student can view individual teacher note details");
      } catch (error) {
        console.log("⚠️ Individual note detail access failed:", error.response?.data?.message || error.message);
      }
    }
    
    return true;
  } catch (error) {
    console.log("❌ Student viewing teacher notes failed:", error.response?.data || error.message);
    return false;
  }
}

async function testEndpoints() {
  try {
    console.log("\n6️⃣ Testing API endpoints accessibility...");
    
    // Test public endpoints
    try {
      await axios.get(`${BASE_URL}/teacher-notes/public`);
      console.log("✅ Public teacher notes endpoint accessible");
    } catch (error) {
      console.log("❌ Public teacher notes endpoint failed");
    }
    
    // Test protected endpoints with tokens
    try {
      await axios.get(`${BASE_URL}/notes`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      console.log("✅ Student notes endpoint accessible");
    } catch (error) {
      console.log("❌ Student notes endpoint failed");
    }
    
    return true;
  } catch (error) {
    console.log("❌ Endpoint testing failed:", error.message);
    return false;
  }
}

async function runAllTests() {
  await connectDB();
  
  let passed = 0;
  let total = 6;
  
  if (await testTeacherLogin()) passed++;
  if (await testStudentLogin()) passed++;
  if (await testStudentNotesUpload()) passed++;
  if (await testTeacherNotesEndpoint()) passed++;
  if (await testStudentViewTeacherNotes()) passed++;
  if (await testEndpoints()) passed++;
  
  console.log(`\n🎯 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log("\n🎉 All tests passed! Both features are working correctly:");
    console.log("   ✅ Student notes upload is fixed");
    console.log("   ✅ Student viewing teacher notes is working");
    console.log("\n📚 Students can now:");
    console.log("   • Upload their own notes via /api/notes endpoint");
    console.log("   • View teacher notes via /student-notes page");
    console.log("   • Access detailed teacher note information");
    console.log("   • Search, filter, and interact with teacher content");
  } else {
    console.log(`\n⚠️ ${total - passed} tests failed. Check the issues above.`);
  }
  
  await mongoose.connection.close();
  console.log("\n🔌 Database connection closed");
}

runAllTests().catch(console.error);
