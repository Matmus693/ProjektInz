const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const WorkoutPlan = require('../models/WorkoutPlan');
const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Default workout plans template
const createDefaultPlans = async (userId) => {
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
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }

    // Create user
    const user = new User({ username, email, password });
    await user.save();

    // Create default workout plans for the new user
    try {
      await createDefaultPlans(user._id);
    } catch (planError) {
      console.error('Error creating default plans:', planError);
      // Don't fail registration if plan creation fails
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Register error:', error);

    // Handle specific error types
    if (error.name === 'MongoServerError' && error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    // Generic error (log full error for debugging, send generic message to client)
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
