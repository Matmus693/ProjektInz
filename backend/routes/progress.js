const express = require('express');
const Progress = require('../models/Progress');
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');
const router = express.Router();

// Pobierz postęp użytkownika
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

// Dodaj wpis wagi ciała
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

    progress.weight.push({ date, weight, timestamp: new Date() });
    progress.weight.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    await progress.save();

    res.json(progress);
  } catch (error) {
    console.error('Add weight error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Aktualizuj wymiary ciała
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

    // Dodaj do historii pomiarów
    if (!progress.measurementsHistory) {
      progress.measurementsHistory = [];
    }
    progress.measurementsHistory.push({
      date: new Date(),
      chest: progress.measurements.chest,
      waist: progress.measurements.waist,
      biceps: progress.measurements.biceps,
      thighs: progress.measurements.thighs
    });
    // Sortuj malejąco po dacie
    progress.measurementsHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    await progress.save();

    res.json(progress);
  } catch (error) {
    console.error('Update measurements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Ustaw cel wagowy
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

// Pobierz ostatnią wagę użytkownika
router.get('/latest-weight', auth, async (req, res) => {
  try {
    let progress = await Progress.findOne({ userId: req.user._id });

    if (!progress || !progress.weight || progress.weight.length === 0) {
      return res.json({ weight: 75 }); // Waga domyślna
    }

    // Weź najnowszy wpis
    const latestWeight = progress.weight[0];
    res.json({ weight: latestWeight.weight });
  } catch (error) {
    console.error('Get latest weight error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Usuń wpis wagi
router.delete('/weight/:weightId', auth, async (req, res) => {
  try {
    const { weightId } = req.params;

    let progress = await Progress.findOne({ userId: req.user._id });

    if (!progress) {
      return res.status(404).json({ message: 'Progress data not found' });
    }

    progress.weight = progress.weight.filter(w => w._id.toString() !== weightId);
    await progress.save();

    res.json(progress);
  } catch (error) {
    console.error('Delete weight error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pobierz statystyki
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
      // Parsuj czas trwania (np. "52 min" -> 52)
      const durationMatch = workout.duration?.match(/(\d+)/);
      if (durationMatch) {
        totalDuration += parseInt(durationMatch[1]);
      }
    });

    const avgWorkoutDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;



    // Statystyki poprzedniego miesiąca
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfPrevMonthStr = startOfPrevMonth.toISOString().split('T')[0];
    const endOfPrevMonthStr = endOfPrevMonth.toISOString().split('T')[0];

    const prevWorkouts = await Workout.find({
      userId: req.user._id,
      date: { $gte: startOfPrevMonthStr, $lte: endOfPrevMonthStr },
    });

    let prevTotalWorkouts = prevWorkouts.length;
    let prevTotalSets = 0;
    let prevTotalVolume = 0;
    let prevTotalDuration = 0;

    prevWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        prevTotalSets += exercise.numSets || 0;
        exercise.sets.forEach(set => {
          const weight = parseFloat(set.weight || 0);
          const reps = parseFloat(set.reps || 0);
          prevTotalVolume += weight * reps;
        });
      });
      const durationMatch = workout.duration?.match(/(\d+)/);
      if (durationMatch) {
        prevTotalDuration += parseInt(durationMatch[1]);
      }
    });
    const prevAvgWorkoutDuration = prevTotalWorkouts > 0 ? Math.round(prevTotalDuration / prevTotalWorkouts) : 0;

    res.json({
      current: {
        totalWorkouts,
        totalSets,
        totalVolume,
        avgWorkoutDuration,
      },
      previous: {
        totalWorkouts: prevTotalWorkouts,
        totalSets: prevTotalSets,
        totalVolume: prevTotalVolume,
        avgWorkoutDuration: prevAvgWorkoutDuration
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pobierz postęp dla konkretnego ćwiczenia
router.get('/exercise/:name', auth, async (req, res) => {
  try {
    const exerciseName = req.params.name;

    // Znajdź wszystkie treningi użytkownika zawierające to ćwiczenie
    const workouts = await Workout.find({
      userId: req.user._id,
      'exercises.name': exerciseName,
    }).sort({ date: 1 }); // Sortuj rosnąco po dacie

    const history = [];

    workouts.forEach((w) => {
      const ex = w.exercises.find((e) => e.name === exerciseName);
      if (ex) {
        let maxWeight = 0;
        let volume = 0;
        let oneRepMax = 0; // Szacowane 1RM

        ex.sets.forEach((s) => {
          const weight = parseFloat(s.weight || 0);
          const reps = parseFloat(s.reps || 0);

          if (weight > maxWeight) maxWeight = weight;
          volume += weight * reps;

          // Wylicz 1RM używając wzoru Epleya: waga * (1 + powtórzenia/30)
          // Tylko gdy są poprawne dane
          if (reps > 0 && weight > 0) {
            const estimated1RM = weight * (1 + reps / 30);
            if (estimated1RM > oneRepMax) oneRepMax = estimated1RM;
          }
        });

        history.push({
          date: w.date,
          maxWeight,
          volume,
          oneRepMax: Math.round(oneRepMax * 10) / 10, // Zaokrąglij do 1 miejsca po przecinku
        });
      }
    });

    const currentMax = history.length > 0 ? history[history.length - 1].maxWeight : 0;
    const previousMax = history.length > 1 ? history[history.length - 2].maxWeight : 0;
    const current1RM = history.length > 0 ? history[history.length - 1].oneRepMax : 0;
    const previous1RM = history.length > 1 ? history[history.length - 2].oneRepMax : 0;

    // Max Volume (największa objętość w jednej sesji)
    const maxVolume = history.length > 0 ? Math.max(...history.map(h => h.volume)) : 0;

    // All-Time Max Weight (Rekord życiowy)
    const allTimeMax = history.length > 0 ? Math.max(...history.map(h => h.maxWeight)) : 0;

    // All-Time 1RM (Rekord 1RM)
    const allTime1RM = history.length > 0 ? Math.max(...history.map(h => h.oneRepMax)) : 0;

    const sessions = history.length;

    res.json({
      currentMax,
      previousMax,
      current1RM,
      previous1RM,
      maxVolume,
      allTimeMax,
      allTime1RM,
      sessions,
      history: history.reverse()
    });

  } catch (error) {
    console.error('Get exercise progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
