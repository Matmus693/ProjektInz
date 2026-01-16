const express = require('express');
const WorkoutPlan = require('../models/WorkoutPlan');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all workout plans for user
router.get('/', auth, async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({ userId: req.user._id })
      .sort({ isActive: -1, createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error('Get workout plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single workout plan
router.get('/:id', auth, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ message: 'Workout plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Get workout plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create workout plan
router.post('/', auth, async (req, res) => {
  try {
    const planData = {
      ...req.body,
      userId: req.user._id,
    };

    // If setting as active, deactivate other plans
    if (planData.isActive) {
      await WorkoutPlan.updateMany(
        { userId: req.user._id },
        { $set: { isActive: false } }
      );
    }

    const plan = new WorkoutPlan(planData);
    await plan.save();

    res.status(201).json(plan);
  } catch (error) {
    console.error('Create workout plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update workout plan
router.put('/:id', auth, async (req, res) => {
  try {
    // If setting as active, deactivate other plans
    if (req.body.isActive) {
      await WorkoutPlan.updateMany(
        { userId: req.user._id, _id: { $ne: req.params.id } },
        { $set: { isActive: false } }
      );
    }

    const plan = await WorkoutPlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ message: 'Workout plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Update workout plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete workout plan
router.delete('/:id', auth, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ message: 'Workout plan not found' });
    }

    res.json({ message: 'Workout plan deleted successfully' });
  } catch (error) {
    console.error('Delete workout plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
