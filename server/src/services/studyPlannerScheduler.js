import StudyPlan from '../models/StudyPlan.js';
import User from '../models/User.js';
import emailService from './emailService.js';
import mongoose from 'mongoose';

// Polling interval (ms) to check for due study plans
const CHECK_INTERVAL_MS = 60 * 1000; // 1 minute

let intervalHandle = null;
let nextAttemptAt = 0; // timestamp (ms) when next attempt should be made (backoff)

export const startStudyPlannerScheduler = () => {
  if (intervalHandle) return; // already running

  console.log('⏱️ Starting Study Planner scheduler (checks every 60s)');

  intervalHandle = setInterval(async () => {
    try {
      const nowTs = Date.now();
      if (nowTs < nextAttemptAt) return; // still backing off

      // Ensure mongoose is connected before querying to avoid DNS/connect errors
      if (mongoose.connection.readyState !== 1) {
        console.warn('Study Planner scheduler: MongoDB not connected (readyState=' + mongoose.connection.readyState + '). Will retry in 60s.');
        nextAttemptAt = nowTs + CHECK_INTERVAL_MS; // retry after one interval
        return;
      }

      const now = new Date();
      // Find plans that are due and not yet notified
      const duePlans = await StudyPlan.find({ notified: false, scheduledAt: { $lte: now } }).populate('user');
      if (!duePlans.length) return;

      for (const plan of duePlans) {
        try {
          const user = plan.user;
          if (!user || !user.email) continue;

          // Send notification email
          await emailService.sendStudyPlanNotification(user.email, user.name || user.email, plan.title, plan.description, plan.scheduledAt);

          // Mark as notified
          plan.notified = true;
          await plan.save();
          console.log(`📬 Sent study plan notification to ${user.email} for plan '${plan.title}'`);
        } catch (err) {
          console.error('Error notifying for plan', plan._id, err.message);
        }
      }
    } catch (err) {
      // Handle transient DNS/network errors by backing off briefly
      const msg = err?.message || String(err);
      console.error('Study Planner scheduler error:', msg);
      if (msg.includes('ENOTFOUND') || msg.includes('EAI_AGAIN')) {
        // DNS lookup failed — back off 60s
        nextAttemptAt = Date.now() + CHECK_INTERVAL_MS;
        console.warn('Study Planner scheduler: DNS/network issue detected. Backing off for 60s.');
      } else {
        // For other errors, retry on next interval
        nextAttemptAt = Date.now() + 5000;
      }
    }
  }, CHECK_INTERVAL_MS);
};

export const stopStudyPlannerScheduler = () => {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
  nextAttemptAt = 0;
};

export default { startStudyPlannerScheduler, stopStudyPlannerScheduler };
