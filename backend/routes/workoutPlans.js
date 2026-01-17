const express = require('express');
const WorkoutPlan = require('../models/WorkoutPlan');
const auth = require('../middleware/auth');
const router = express.Router();

// Seed default plans for a user
router.post('/seed', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const defaultPlans = [
      {
        name: 'Push A',
        type: 'Szablon',
        description: 'Klatka, ramiona, triceps',
        isActive: false,
        exercises: [
          { name: 'Bench Press', numSets: 4, sets: [] },
          { name: 'Incline DB Press', numSets: 3, sets: [] },
          { name: 'Cable Flyes', numSets: 3, sets: [] },
          { name: 'Overhead Press', numSets: 4, sets: [] },
        ]
      },
      {
        name: 'Pull A',
        type: 'Szablon',
        description: 'Plecy, biceps, martwy ciąg',
        isActive: false,
        exercises: [
          { name: 'Deadlift', numSets: 4, sets: [] },
          { name: 'Pull-ups', numSets: 4, sets: [] },
          { name: 'Barbell Row', numSets: 4, sets: [] },
        ]
      },
      {
        name: 'Legs A',
        type: 'Szablon',
        description: 'Nogi, pośladki, łydki',
        isActive: false,
        exercises: [
          { name: 'Squat', numSets: 4, sets: [] },
          { name: 'Romanian Deadlift', numSets: 4, sets: [] },
          { name: 'Leg Press', numSets: 3, sets: [] },
        ]
      },
      {
        name: 'FBW',
        type: 'Szablon',
        description: 'Full Body Workout',
        isActive: false,
        exercises: [
          { name: 'Squat', numSets: 4, sets: [] },
          { name: 'Bench Press', numSets: 4, sets: [] },
          { name: 'Barbell Row', numSets: 4, sets: [] },
        ]
      }
    ];

    const plansToInsert = defaultPlans.map(plan => ({ ...plan, userId }));
    await WorkoutPlan.insertMany(plansToInsert);

    res.status(201).json({ message: 'Default plans seeded successfully', count: plansToInsert.length });
  } catch (error) {
    console.error('Seed workout plans error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get template plans for user
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = await WorkoutPlan.find({
      userId: req.user._id,
      type: 'Szablon'
    }).sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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
