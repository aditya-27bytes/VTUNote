import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../src/models/User.js';
import StudyPlan from '../src/models/StudyPlan.js';
import emailService from '../src/services/emailService.js';

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not set');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = process.argv[2] || 'testplanner@example.com';
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: 'Planner Test',
        email,
        password: 'password123',
        isVerified: true,
        role: 'user',
        usn: 'TESTUSN1',
        college: 'VTU',
        branch: 'CSE',
        semester: 1
      });
      console.log('Created test user:', email);
    } else {
      console.log('Found user:', email);
    }

    const plan = await StudyPlan.create({ user: user._id, title: 'Immediate Test Plan', description: 'Test description', scheduledAt: new Date() });
    console.log('Created plan:', plan._id);

    // send notification immediately
    const res = await emailService.sendStudyPlanNotification(user.email, user.name || user.email, plan.title, plan.description, plan.scheduledAt);
    console.log('Email send result:', res);

    if (res && res.success) {
      plan.notified = true;
      await plan.save();
      console.log('Marked plan as notified');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error in test-study-planner:', err);
    process.exit(1);
  }
};

run();
