import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import Teacher from './src/models/Teacher.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-notes";

const createDefaultTeacher = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ email: 'teacher@vtu.edu' });
    
    if (existingTeacher) {
      console.log('👨‍🏫 Teacher already exists:');
      console.log(`   Name: ${existingTeacher.name}`);
      console.log(`   Email: ${existingTeacher.email}`);
      console.log(`   Employee ID: ${existingTeacher.employeeId}`);
      console.log(`   Department: ${existingTeacher.department}`);
      console.log(`   Verified: ${existingTeacher.isVerified}`);
      console.log(`   Active: ${existingTeacher.isActive}`);
      return;
    }

    // Hash password manually to avoid double-hashing
    const hashedPassword = await bcrypt.hash('teacher123', 10);

    // Create default teacher with hashed password
    const teacher = await Teacher.create({
      name: 'Dr. John Smith',
      email: 'teacher@vtu.edu',
      password: hashedPassword,
      employeeId: 'T001',
      department: 'Computer Science',
      designation: 'Assistant Professor',
      qualification: 'PhD',
      experience: 8,
      phone: '+91-9876543210',
      college: 'VTU University',
      subjects: ['Data Structures', 'Database Management', 'Web Development'],
      isVerified: true,
      isActive: true,
      bio: 'Experienced computer science professor with expertise in data structures and database systems.'
    });

    console.log('✅ Default teacher created successfully:');
    console.log(`   Name: ${teacher.name}`);
    console.log(`   Email: ${teacher.email}`);
    console.log(`   Password: teacher123`);
    console.log(`   Employee ID: ${teacher.employeeId}`);
    console.log(`   Department: ${teacher.department}`);
    console.log(`   Verified: ${teacher.isVerified}`);
    console.log(`   Active: ${teacher.isActive}`);

  } catch (error) {
    console.error('❌ Error creating teacher:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

createDefaultTeacher();
