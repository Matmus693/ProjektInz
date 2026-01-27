const express = require('express');
const Workout = require('../models/Workout');
const WorkoutPlan = require('../models/WorkoutPlan');
const auth = require('../middleware/auth');
const router = express.Router();

// Pobierz wszystkie treningi użytkownika
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

    // Znajdź ostatni trening zawierający to ćwiczenie
    const workout = await Workout.findOne({
      userId: req.user._id,
      'exercises.name': exerciseName
    }).sort({ date: -1, createdAt: -1 });

    if (!workout) {
      // Brak historii to prawidłowy stan, nie błąd
      return res.json(null);
    }

    // Extract the specific exercise data
    const exerciseData = workout.exercises.find(e => e.name === exerciseName);

    if (!exerciseData) {
      return res.json(null);
    }

    // POPRAWKA: Dla ćwiczeń z masą ciała: odejmij wagę użytkownika,
    // aby pokazać tylko dodatkowe obciążenie (zapobiega podwójnemu liczeniu)
    const Exercise = require('../models/Exercise');
    const Progress = require('../models/Progress');

    const exerciseDef = await Exercise.findOne({ name: exerciseName });

    if (exerciseDef && exerciseDef.equipment === 'Bodyweight') {
      // Pobierz aktualną wagę użytkownika
      const progress = await Progress.findOne({ userId: req.user._id });
      const userWeight = (progress && progress.weight && progress.weight.length > 0)
        ? progress.weight[0].weight
        : 75; // Default

      // Odejmij wagę ciała, aby pokazać tylko 'doczepiony' ciężar
      exerciseData.sets = exerciseData.sets.map(set => ({
        ...set,
        weight: Math.max(0, parseFloat(set.weight || 0) - userWeight).toString()
      }));
    }

    // Zwróć tylko istotne dane (serie, notatki)
    res.json(exerciseData || null);
  } catch (error) {
    console.error('History lookup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pobierz pojedynczy trening
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

// Utwórz nowy trening
router.post('/', auth, async (req, res) => {
  try {
    const workoutData = {
      ...req.body,
      userId: req.user._id,
    };

    // AUTO-UZUPEŁNIANIE WAGI CIAŁA: Dodaj wagę usera do ćwiczeń 'Bodyweight'
    const Exercise = require('../models/Exercise');
    const Progress = require('../models/Progress');

    // Pobierz ostatnią znaną wagę użytkownika
    const progress = await Progress.findOne({ userId: req.user._id });
    const userWeight = (progress && progress.weight && progress.weight.length > 0)
      ? progress.weight[0].weight
      : 75; // Default

    // Przetwórz każde ćwiczenie w treningu
    if (workoutData.exercises && Array.isArray(workoutData.exercises)) {
      for (let exercise of workoutData.exercises) {
        // Sprawdź czy definicja ćwiczenia mówi, że to 'Bodyweight'
        const exerciseDef = await Exercise.findOne({ name: exercise.name });

        if (exerciseDef && exerciseDef.equipment === 'Bodyweight') {
          // Dla kalisteniki wpisana waga to DODATKOWY ciężar.
          // Finalna waga w bazie = waga ciała + ciężar dodatkowy
          if (exercise.sets && Array.isArray(exercise.sets)) {
            exercise.sets = exercise.sets.map(set => {
              const additionalWeight = parseFloat(set.weight) || 0;
              // Zawsze sumujemy te dwie wartości
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

    // Posprzątaj plany tymczasowe (jednorazowe sugestie AI)
    // UWAGA: Wygenerowane plany (isGenerated: true) mają temporary: false,
    // więc nie będą usuwane - pozostają w "Wszystkie plany"
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

// Zaktualizuj istniejący trening
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

// Usuń trening
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
