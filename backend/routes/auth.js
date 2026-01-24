const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const WorkoutPlan = require('../models/WorkoutPlan');
const router = express.Router();

// Generuj Token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Szablon domyślnych planów treningowych
const createDefaultPlans = async (userId) => {
  const defaultPlans = [
    {
      name: 'Push A',
      type: 'Szablon',
      description: 'Klatka, triceps, przednie i boczne barki',
      isActive: false,
      exercises: [
        { name: 'Bench Press', numSets: 4, sets: [] },
        { name: 'Incline DB Press', numSets: 3, sets: [] },
        { name: 'Cable Flyes', numSets: 3, sets: [] },
        { name: 'Overhead Press', numSets: 4, sets: [] },
        { name: 'Lateral Raises', numSets: 3, sets: [] },
        { name: 'Tricep Dips', numSets: 3, sets: [] },
        { name: 'Overhead Tricep Extension', numSets: 3, sets: [] },
      ]
    },
    {
      name: 'Pull A',
      type: 'Szablon',
      description: 'Plecy, biceps, tylne barki',
      isActive: false,
      exercises: [
        { name: 'Deadlift', numSets: 4, sets: [] },
        { name: 'Pull-ups', numSets: 4, sets: [] },
        { name: 'Barbell Row', numSets: 4, sets: [] },
        { name: 'Face Pulls', numSets: 3, sets: [] },
        { name: 'Barbell Curl', numSets: 3, sets: [] },
        { name: 'Hammer Curl', numSets: 3, sets: [] },
      ]
    },
    {
      name: 'Legs A',
      type: 'Szablon',
      description: 'Nogi, pośladki, łydki, core',
      isActive: false,
      exercises: [
        { name: 'Squat', numSets: 4, sets: [] },
        { name: 'Romanian Deadlift', numSets: 4, sets: [] },
        { name: 'Leg Press', numSets: 3, sets: [] },
        { name: 'Leg Curl', numSets: 3, sets: [] },
        { name: 'Calf Raises', numSets: 4, sets: [] },
        { name: 'Plank', numSets: 3, sets: [] },
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
        { name: 'Overhead Press', numSets: 3, sets: [] },
      ]
    }
  ];

  const plansToInsert = defaultPlans.map(plan => ({ ...plan, userId }));
  await WorkoutPlan.insertMany(plansToInsert);
};

// Rejestracja
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Walidacja danych
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Sprawdź czy użytkownik już istnieje
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }

    // Utwórz użytkownika
    const user = new User({ username, email, password });
    await user.save();

    // Utwórz domyślne plany treningowe dla nowego użytkownika
    try {
      await createDefaultPlans(user._id);
    } catch (planError) {
      console.error('Error creating default plans:', planError);
      // Nie przerywaj rejestracji jeśli tworzenie planów się nie uda
    }

    // Wygeneruj token
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

    // Obsługa konkretnych błędów
    if (error.name === 'MongoServerError' && error.code === 11000) {
      // Błąd duplikatu klucza (email/username)
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    // Błąd ogólny
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Logowanie
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Walidacja
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Znajdź użytkownika
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Sprawdź hasło
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Wygeneruj token
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
