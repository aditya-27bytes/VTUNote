import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Teacher from './src/models/Teacher.js';

async function verifyTeacher() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai_notes";
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find and verify Aditya's account
    console.log('\n🔍 Looking for Aditya teacher account...');
    const teacher = await Teacher.findOne({ email: 'aditya99@vtu.edu' });
    
    if (!teacher) {
      console.log('❌ Teacher with email aditya99@vtu.edu not found');
      return;
    }
    
    console.log(`📋 Found teacher: ${teacher.name}`);
    console.log(`   Current verification status: ${teacher.isVerified ? '✅ Verified' : '❌ Not Verified'}`);
    
    if (!teacher.isVerified) {
      console.log('\n🛠️  Verifying teacher account...');
      teacher.isVerified = true;
      await teacher.save();
      console.log('✅ Teacher account has been verified!');
    } else {
      console.log('✅ Teacher is already verified');
    }
    
    // Double-check the status
    const updatedTeacher = await Teacher.findOne({ email: 'aditya99@vtu.edu' });
    console.log(`\n📊 Final status:`);
    console.log(`   Name: ${updatedTeacher.name}`);
    console.log(`   Email: ${updatedTeacher.email}`);
    console.log(`   Verified: ${updatedTeacher.isVerified ? '✅ YES' : '❌ NO'}`);
    console.log(`   Active: ${updatedTeacher.isActive ? '✅ YES' : '❌ NO'}`);
    
    if (updatedTeacher.isVerified && updatedTeacher.isActive) {
      console.log('\n🎉 SUCCESS! Teacher can now create notes.');
    }

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyTeacher();
