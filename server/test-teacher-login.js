import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Teacher from './src/models/Teacher.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-notes";

const testTeacherLogin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    console.log('🔍 Using MONGO_URI:', MONGO_URI);

    // Find the teacher
    const teacher = await Teacher.findOne({ email: 'teacher@vtu.edu' });
    
    if (!teacher) {
      console.log('❌ Teacher not found');
      return;
    }

    console.log('👨‍🏫 Teacher found:');
    console.log(`   Name: ${teacher.name}`);
    console.log(`   Email: ${teacher.email}`);
    console.log(`   Password hash: ${teacher.password.substring(0, 20)}...`);
    console.log(`   Verified: ${teacher.isVerified}`);
    console.log(`   Active: ${teacher.isActive}`);

    // Test password comparison
    const testPassword = 'teacher123';
    const isPasswordValid = await teacher.comparePassword(testPassword);
    
    console.log(`🔐 Password test for '${testPassword}': ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}`);

    // Test with wrong password
    const wrongPassword = 'wrongpassword';
    const isWrongPasswordValid = await teacher.comparePassword(wrongPassword);
    
    console.log(`🔐 Password test for '${wrongPassword}': ${isWrongPasswordValid ? '✅ Valid' : '❌ Invalid'}`);

  } catch (error) {
    console.error('❌ Error testing teacher login:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

testTeacherLogin();
