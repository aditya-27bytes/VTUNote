import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const emailToPromote = process.argv[2] || process.env.PROMOTE_EMAIL || 'aditya27@gmail.com';
const makeTeacher = process.argv.includes('--teacher');

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not set in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Try promote student user
    const user = await User.findOne({ email: emailToPromote });
    if (!user) {
      console.log('No student user found with email:', emailToPromote);
    } else {
      user.role = 'admin';
      user.isVerified = true;
      user.verifiedAt = new Date();
      await user.save();
      console.log(`Promoted student ${emailToPromote} to admin and marked verified.`);
    }

    if (makeTeacher) {
      const Teacher = (await import('../src/models/Teacher.js')).default;
      const teacher = await Teacher.findOne({ email: emailToPromote });
      if (!teacher) {
        console.log('No teacher found with email:', emailToPromote);
      } else {
        teacher.isVerified = true;
        teacher.isActive = true;
        await teacher.save();
        console.log(`Marked teacher ${emailToPromote} as verified/active.`);
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

run();
