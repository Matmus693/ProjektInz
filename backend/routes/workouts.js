const express = require('express');
const Workout = require('../models/Workout');
const WorkoutPlan = require('../models/WorkoutPlan');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.user._id })
      .sort({ date: -1, createdAt: -1 });
    res.json(workouts);
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/history/last', auth, async (req, res) => {
  try {
    const { exerciseName } = req.query;
    if (!exerciseName) {
      return res.status(400).json({ message: 'Missing exerciseName' });
    }

    const workout = await Workout.findOne({
      userId: req.user._id,
      'exercises.name': exerciseName
    }).sort({ date: -1, createdAt: -1 });

    if (!workout) {
      
      return res.json(null);
    }

    const exerciseData = workout.exercises.find(e => e.name === exerciseName);

    if (!exerciseData) {
      return res.json(null);
    }

    const Exercise = require('../models/Exercise');
    const Progress = require('../models/Progress');

    const exerciseDef = await Exercise.findOne({ name: exerciseName });

    if (exerciseDef && exerciseDef.equipment === 'Bodyweight') {
      
      const progress = await Progress.findOne({ userId: req.user._id });
      const userWeight = (progress && progress.weight && progress.weight.length > 0)
        ? progress.weight[0].weight
        : 75;

      exerciseData.sets = exerciseData.sets.map(set => ({
        ...set,
        weight: Math.max(0, parseFloat(set.weight || 0) - userWeight).toString()
      }));
    }

    res.json(exerciseData || null);
  } catch (error) {
    console.error('History lookup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.json(workout);
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const workoutData = {
      ...req.body,
      userId: req.user._id,
    };

    const Exercise = require('../models/Exercise');
    const Progress = require('../models/Progress');

    const progress = await Progress.findOne({ userId: req.user._id });
    const userWeight = (progress && progress.weight && progress.weight.length > 0)
      ? progress.weight[0].weight
      : 75;

    if (workoutData.exercises && Array.isArray(workoutData.exercises)) {
      for (let exercise of workoutData.exercises) {
        
        const exerciseDef = await Exercise.findOne({ name: exercise.name });

        if (exerciseDef && exerciseDef.equipment === 'Bodyweight') {

          if (exercise.sets && Array.isArray(exercise.sets)) {
            exercise.sets = exercise.sets.map(set => {
              const additionalWeight = parseFloat(set.weight) || 0;
              
              const totalWeight = userWeight + additionalWeight;
              return {
                ...set,
                weight: totalWeight.toString()
              };
            });
          }
        }
      }
    }

    const workout = new Workout(workoutData);
    await workout.save();

    await WorkoutPlan.deleteMany({
      userId: req.user._id,
      temporary: true
    });

    res.status(201).json(workout);
  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.json(workout);
  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
