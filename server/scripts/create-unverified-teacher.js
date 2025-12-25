import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Teacher from '../src/models/Teacher.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const t = new Teacher({
      name: 'Unverified Teacher',
      email: 'unverified-teacher@vtu.edu',
      password: 'password123',
      employeeId: 'EMP002',
      department: 'ECE',
      designation: 'Professor',
      qualification: 'PhD',
      experience: 10,
      phone: '9876543211',
      college: 'VTU',
      subjects: ['Circuits'],
      isVerified: false,
      isActive: true
    });

    await t.save();
    console.log('✅ Created unverified teacher:', t.email);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
