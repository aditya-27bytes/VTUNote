import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: 'unverified@example.com' });
    if (existing) {
      console.log('User already exists:', existing.email);
      process.exit(0);
    }

    const user = new User({
      name: 'Unverified User',
      email: 'unverified@example.com',
      password: 'password123',
      usn: '1CS21CS999',
      college: 'VTU',
      branch: 'CSE',
      semester: 1,
      isVerified: false
    });

    await user.save();
    console.log('Created unverified user:', user.email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
