import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const emailToCheck = process.argv[2] || process.env.CHECK_EMAIL || 'aditya27@gmail.com';

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not set in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: emailToCheck }).lean();
    if (!user) {
      console.log('No student user found with email:', emailToCheck);
    } else {
      console.log('Student user:');
      console.log(JSON.stringify({ email: user.email, role: user.role, isVerified: user.isVerified, verifiedAt: user.verifiedAt, createdAt: user.createdAt }, null, 2));
    }

    try {
      const Teacher = (await import('../src/models/Teacher.js')).default;
      const teacher = await Teacher.findOne({ email: emailToCheck }).lean();
      if (!teacher) {
        console.log('No teacher found with email:', emailToCheck);
      } else {
        console.log('Teacher user:');
        console.log(JSON.stringify({ email: teacher.email, isVerified: teacher.isVerified, isActive: teacher.isActive, createdAt: teacher.createdAt }, null, 2));
      }
    } catch (e) {
      console.log('Teacher model not available or error loading it:', e.message);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

run();
