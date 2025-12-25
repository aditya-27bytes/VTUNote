import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Teacher from '../src/models/Teacher.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existingTeacher = await Teacher.findOne({ email: 'teacher@vtu.edu' });
    if (existingTeacher) {
      console.log('Teacher already exists:', existingTeacher.email);
      console.log('Teacher data:', {
        name: existingTeacher.name,
        email: existingTeacher.email,
        isVerified: existingTeacher.isVerified,
        isActive: existingTeacher.isActive,
        employeeId: existingTeacher.employeeId
      });
      await mongoose.connection.close();
      process.exit(0);
    }

    const teacher = new Teacher({
      name: 'Test Teacher',
      email: 'teacher@vtu.edu',
      password: 'password123',
      employeeId: 'EMP001',
      department: 'Computer Science',
      designation: 'Assistant Professor',
      qualification: 'M.Tech',
      experience: 5,
      phone: '9876543210',
      college: 'VTU College',
      subjects: ['Data Structures', 'Algorithms'],
      isVerified: true,
      isActive: true
    });

    await teacher.save();
    console.log('✅ Created test teacher:', teacher.email);
    console.log('Teacher data saved:', {
      name: teacher.name,
      email: teacher.email,
      isVerified: teacher.isVerified,
      isActive: teacher.isActive,
      employeeId: teacher.employeeId
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
