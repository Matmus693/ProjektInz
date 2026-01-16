const express = require('express');
const Progress = require('../models/Progress');
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');
const router = express.Router();

// Get progress data for user
router.get('/', auth, async (req, res) => {
  try {
    let progress = await Progress.findOne({ userId: req.user._id });

    if (!progress) {
      progress = new Progress({ userId: req.user._id });
      await progress.save();
    }

    res.json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add weight entry
router.post('/weight', auth, async (req, res) => {
  try {
    const { date, weight } = req.body;

    if (!date || weight === undefined) {
      return res.status(400).json({ message: 'Date and weight are required' });
    }

    let progress = await Progress.findOne({ userId: req.user._id });

    if (!progress) {
      progress = new Progress({ userId: req.user._id });
    }

    progress.weight.push({ date, weight });
    progress.weight.sort((a, b) => new Date(b.date) - new Date(a.date));

    await progress.save();

    res.json(progress);
  } catch (error) {
    console.error('Add weight error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update measurements
router.put('/measurements', auth, async (req, res) => {
  try {
    const { chest, waist, biceps, thighs } = req.body;

    let progress = await Progress.findOne({ userId: req.user._id });

    if (!progress) {
      progress = new Progress({ userId: req.user._id });
    }

    progress.measurements = {
      chest: chest || progress.measurements?.chest || 0,
      waist: waist || progress.measurements?.waist || 0,
      biceps: biceps || progress.measurements?.biceps || 0,
      thighs: thighs || progress.measurements?.thighs || 0,
      lastUpdate: new Date().toISOString().split('T')[0],
    };

    await progress.save();

    res.json(progress);
  } catch (error) {
    console.error('Update measurements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update target weight
router.put('/target-weight', auth, async (req, res) => {
  try {
    const { targetWeight } = req.body;

    let progress = await Progress.findOne({ userId: req.user._id });

    if (!progress) {
      progress = new Progress({ userId: req.user._id });
    }

    progress.targetWeight = targetWeight;

    await progress.save();

    res.json(progress);
  } catch (error) {
    console.error('Update target weight error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    const workouts = await Workout.find({
      userId: req.user._id,
      date: { $gte: startOfMonthStr },
    });

    let totalWorkouts = workouts.length;
    let totalSets = 0;
    let totalVolume = 0;
    let totalDuration = 0;

    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        totalSets += exercise.numSets || 0;
        exercise.sets.forEach(set => {
          const weight = parseFloat(set.weight || 0);
          const reps = parseFloat(set.reps || 0);
          totalVolume += weight * reps;
        });
      });
      // Parse duration (e.g., "52 min" -> 52)
      const durationMatch = workout.duration?.match(/(\d+)/);
      if (durationMatch) {
        totalDuration += parseInt(durationMatch[1]);
      }
    });

    const avgWorkoutDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

    res.json({
      totalWorkouts,
      totalSets,
      totalVolume,
      avgWorkoutDuration,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
