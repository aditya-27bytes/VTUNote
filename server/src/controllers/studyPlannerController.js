import StudyPlan from '../models/StudyPlan.js';
import User from '../models/User.js';

// Create a study plan
export const createPlan = async (req, res) => {
  try {
    const { title, description, scheduledAt } = req.body;
    if (!title || !scheduledAt) {
      return res.status(400).json({ error: 'Title and scheduledAt are required' });
    }

    const plan = await StudyPlan.create({
      user: req.user._id,
      title,
      description,
      scheduledAt: new Date(scheduledAt)
    });

    return res.json({ success: true, plan });
  } catch (err) {
    console.error('createPlan error:', err);
    return res.status(500).json({ error: 'Failed to create study plan' });
  }
};

// Get plans for current user
export const getPlans = async (req, res) => {
  try {
    const plans = await StudyPlan.find({ user: req.user._id }).sort({ scheduledAt: 1 }).lean();
    return res.json({ success: true, plans });
  } catch (err) {
    console.error('getPlans error:', err);
    return res.status(500).json({ error: 'Failed to fetch study plans' });
  }
};

// Delete a plan
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await StudyPlan.findOneAndDelete({ _id: id, user: req.user._id });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error('deletePlan error:', err);
    return res.status(500).json({ error: 'Failed to delete study plan' });
  }
};

export default { createPlan, getPlans, deletePlan };
