import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Teacher from './src/models/Teacher.js';

async function checkTeachers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai_notes";
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n👨‍🏫 Checking teacher accounts...');
    const teachers = await Teacher.find({});
    
    if (teachers.length === 0) {
      console.log('❌ No teachers found in database');
    } else {
      teachers.forEach((teacher, index) => {
        console.log(`\n📋 Teacher ${index + 1}:`);
        console.log(`   Name: ${teacher.name}`);
        console.log(`   Email: ${teacher.email}`);
        console.log(`   Employee ID: ${teacher.employeeId}`);
        console.log(`   Department: ${teacher.department}`);
        console.log(`   ✅ Verified: ${teacher.isVerified ? '✅ YES' : '❌ NO'}`);
        console.log(`   🟢 Active: ${teacher.isActive ? '✅ YES' : '❌ NO'}`);
        console.log(`   Created: ${teacher.createdAt}`);
      });
      
      // Check if any teacher is both verified and active
      const activeVerifiedTeachers = teachers.filter(t => t.isVerified && t.isActive);
      console.log(`\n🎯 Teachers ready to create notes: ${activeVerifiedTeachers.length}`);
      
      if (activeVerifiedTeachers.length === 0) {
        console.log('\n⚠️  ISSUE FOUND: No teachers are both verified AND active!');
        console.log('🛠️  SOLUTION: Admin needs to verify teachers or you need to log in as a verified teacher.');
      }
    }

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTeachers();
