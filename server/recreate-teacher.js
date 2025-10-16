import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import Teacher from './src/models/Teacher.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-notes";

const recreateDefaultTeacher = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing teacher if exists
    const existingTeacher = await Teacher.findOne({ email: 'teacher@vtu.edu' });
    if (existingTeacher) {
      await Teacher.findByIdAndDelete(existingTeacher._id);
      console.log('🗑️ Deleted existing teacher account');
    }

    // Hash password manually
    const hashedPassword = await bcrypt.hash('teacher123', 10);

    // Create new teacher with correct password hash
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

    console.log('✅ Teacher recreated successfully:');
    console.log(`   Name: ${teacher.name}`);
    console.log(`   Email: ${teacher.email}`);
    console.log(`   Password: teacher123`);
    console.log(`   Employee ID: ${teacher.employeeId}`);
    console.log(`   Department: ${teacher.department}`);
    console.log(`   Verified: ${teacher.isVerified}`);
    console.log(`   Active: ${teacher.isActive}`);

  } catch (error) {
    console.error('❌ Error recreating teacher:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

recreateDefaultTeacher();
