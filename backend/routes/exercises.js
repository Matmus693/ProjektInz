const router = require('express').Router();
const Exercise = require('../models/Exercise');

// Pobierz wszystkie ćwiczenia
router.get('/', async (req, res) => {
    try {
        const exercises = await Exercise.find().sort({ name: 1 });
        res.json(exercises);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Endpoint 'seed' do wstępnego wypełnienia bazy (uruchom raz)
router.post('/seed', async (req, res) => {
    try {
        // Sprawdź czy baza jest już pełna
        const count = await Exercise.countDocuments();
        if (count > 0) {
            return res.status(400).json({ message: 'Database already seeded' });
        }

        const seedData = [
            // PUSH
            {
                name: 'Bench Press',
                muscleGroup: 'Chest',
                secondaryMuscles: ['Triceps', 'Shoulders'],
                type: 'Compound',
                mechanics: 'Push',
                equipment: 'Barbell',
                difficulty: 3
            },
            {
                name: 'Incline DB Press',
                muscleGroup: 'Chest',
                secondaryMuscles: ['Triceps', 'Shoulders'],
                type: 'Compound',
                mechanics: 'Push',
                equipment: 'Dumbbell',
                difficulty: 3
            },
            {
                name: 'Overhead Press',
                muscleGroup: 'Shoulders',
                secondaryMuscles: ['Triceps'],
                type: 'Compound',
                mechanics: 'Push',
                equipment: 'Barbell',
                difficulty: 4
            },
            {
                name: 'Lateral Raises',
                muscleGroup: 'Shoulders',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Push',
                equipment: 'Dumbbell',
                difficulty: 2
            },
            {
                name: 'Tricep Pushdown',
                muscleGroup: 'Arms',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Push',
                equipment: 'Cable',
                difficulty: 2
            },
            {
                name: 'Cable Flyes',
                muscleGroup: 'Chest',
                secondaryMuscles: ['Shoulders'],
                type: 'Isolation',
                mechanics: 'Push',
                equipment: 'Cable',
                difficulty: 3
            },

            // PULL
            {
                name: 'Deadlift',
                muscleGroup: 'Back',
                secondaryMuscles: ['Legs', 'Core'],
                type: 'Compound',
                mechanics: 'Pull',
                equipment: 'Barbell',
                difficulty: 5
            },
            {
                name: 'Pull-ups',
                muscleGroup: 'Back',
                secondaryMuscles: ['Biceps'],
                type: 'Compound',
                mechanics: 'Pull',
                equipment: 'Bodyweight',
                difficulty: 4
            },
            {
                name: 'Barbell Row',
                muscleGroup: 'Back',
                secondaryMuscles: ['Biceps', 'Posterior Chain'],
                type: 'Compound',
                mechanics: 'Pull',
                equipment: 'Barbell',
                difficulty: 4
            },
            {
                name: 'Face Pulls',
                muscleGroup: 'Shoulders',
                secondaryMuscles: ['Upper Back'],
                type: 'Isolation',
                mechanics: 'Pull',
                equipment: 'Cable',
                difficulty: 2
            },
            {
                name: 'Barbell Curl',
                muscleGroup: 'Arms',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Pull',
                equipment: 'Barbell',
                difficulty: 2
            },
            {
                name: 'Hammer Curl',
                muscleGroup: 'Arms',
                secondaryMuscles: ['Forearms'],
                type: 'Isolation',
                mechanics: 'Pull',
                equipment: 'Dumbbell',
                difficulty: 2
            },

            // LEGS
            {
                name: 'Squat',
                muscleGroup: 'Legs',
                secondaryMuscles: ['Core', 'Glutes'],
                type: 'Compound',
                mechanics: 'Push',
                equipment: 'Barbell',
                difficulty: 4
            },
            {
                name: 'Romanian Deadlift',
                muscleGroup: 'Legs',
                secondaryMuscles: ['Glutes', 'Back'],
                type: 'Compound',
                mechanics: 'Pull',
                equipment: 'Barbell',
                difficulty: 4
            },
            {
                name: 'Leg Press',
                muscleGroup: 'Legs',
                secondaryMuscles: ['Glutes'],
                type: 'Compound',
                mechanics: 'Push',
                equipment: 'Machine',
                difficulty: 3
            },
            {
                name: 'Leg Curl',
                muscleGroup: 'Legs',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Pull',
                equipment: 'Machine',
                difficulty: 2
            },
            {
                name: 'Leg Extension',
                muscleGroup: 'Legs',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Push',
                equipment: 'Machine',
                difficulty: 2
            },
            {
                name: 'Calf Raises',
                muscleGroup: 'Legs',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Push',
                equipment: 'Machine',
                difficulty: 1
            },

            // OTHER
            {
                name: 'Plank',
                muscleGroup: 'Core',
                secondaryMuscles: [],
                type: 'Isolation',
                equipment: 'Bodyweight',
                difficulty: 2
            }
        ];

        // Zaznacz, że to ćwiczenia systemowe (nie użytkownika)
        const finalSeedData = seedData.map(ex => ({ ...ex, isCustom: false }));

        await Exercise.insertMany(finalSeedData);
        res.status(201).json({ message: 'Database seeded successfully', count: seedData.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Napraw/Przywróć ćwiczenia systemowe
router.post('/repair', async (req, res) => {
    try {
        const seedData = [
            // PUSH
            {
                name: 'Bench Press',
                muscleGroup: 'Chest',
                secondaryMuscles: ['Triceps', 'Shoulders'],
                type: 'Compound',
                mechanics: 'Push',
                equipment: 'Barbell',
                difficulty: 3
            },
            {
                name: 'Incline DB Press',
                muscleGroup: 'Chest',
                secondaryMuscles: ['Triceps', 'Shoulders'],
                type: 'Compound',
                mechanics: 'Push',
                equipment: 'Dumbbell',
                difficulty: 3
            },
            {
                name: 'Overhead Press',
                muscleGroup: 'Shoulders',
                secondaryMuscles: ['Triceps'],
                type: 'Compound',
                mechanics: 'Push',
                equipment: 'Barbell',
                difficulty: 4
            },
            {
                name: 'Lateral Raises',
                muscleGroup: 'Shoulders',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Push',
                equipment: 'Dumbbell',
                difficulty: 2
            },
            {
                name: 'Tricep Pushdown',
                muscleGroup: 'Arms',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Push',
                equipment: 'Cable',
                difficulty: 2
            },
            {
                name: 'Cable Flyes',
                muscleGroup: 'Chest',
                secondaryMuscles: ['Shoulders'],
                type: 'Isolation',
                mechanics: 'Push',
                equipment: 'Cable',
                difficulty: 3
            },
            // PULL
            {
                name: 'Deadlift',
                muscleGroup: 'Back',
                secondaryMuscles: ['Legs', 'Core'],
                type: 'Compound',
                mechanics: 'Pull',
                equipment: 'Barbell',
                difficulty: 5
            },
            {
                name: 'Pull-ups',
                muscleGroup: 'Back',
                secondaryMuscles: ['Biceps'],
                type: 'Compound',
                mechanics: 'Pull',
                equipment: 'Bodyweight',
                difficulty: 4
            },
            {
                name: 'Barbell Row',
                muscleGroup: 'Back',
                secondaryMuscles: ['Biceps', 'Posterior Chain'],
                type: 'Compound',
                mechanics: 'Pull',
                equipment: 'Barbell',
                difficulty: 4
            },
            {
                name: 'Face Pulls',
                muscleGroup: 'Shoulders',
                secondaryMuscles: ['Upper Back'],
                type: 'Isolation',
                mechanics: 'Pull',
                equipment: 'Cable',
                difficulty: 2
            },
            {
                name: 'Barbell Curl',
                muscleGroup: 'Arms',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Pull',
                equipment: 'Barbell',
                difficulty: 2
            },
            {
                name: 'Hammer Curl',
                muscleGroup: 'Arms',
                secondaryMuscles: ['Forearms'],
                type: 'Isolation',
                mechanics: 'Pull',
                equipment: 'Dumbbell',
                difficulty: 2
            },
            // LEGS
            {
                name: 'Squat',
                muscleGroup: 'Legs',
                secondaryMuscles: ['Core', 'Glutes'],
                type: 'Compound',
                mechanics: 'Push',
                equipment: 'Barbell',
                difficulty: 4
            },
            {
                name: 'Romanian Deadlift',
                muscleGroup: 'Legs',
                secondaryMuscles: ['Glutes', 'Back'],
                type: 'Compound',
                mechanics: 'Pull',
                equipment: 'Barbell',
                difficulty: 4
            },
            {
                name: 'Leg Press',
                muscleGroup: 'Legs',
                secondaryMuscles: ['Glutes'],
                type: 'Compound',
                mechanics: 'Push',
                equipment: 'Machine',
                difficulty: 3
            },
            {
                name: 'Leg Curl',
                muscleGroup: 'Legs',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Pull',
                equipment: 'Machine',
                difficulty: 2
            },
            {
                name: 'Leg Extension',
                muscleGroup: 'Legs',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Push',
                equipment: 'Machine',
                difficulty: 2
            },
            {
                name: 'Calf Raises',
                muscleGroup: 'Legs',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Push',
                equipment: 'Machine',
                difficulty: 1
            },
            // OTHER
            {
                name: 'Plank',
                muscleGroup: 'Core',
                secondaryMuscles: [],
                type: 'Isolation',
                mechanics: 'Static',
                equipment: 'Bodyweight',
                difficulty: 2
            }
        ];

        let count = 0;
        for (const ex of seedData) {
            await Exercise.findOneAndUpdate(
                { name: ex.name },
                { ...ex, isCustom: false },
                { upsert: true, new: true }
            );
            count++;
        }

        res.json({ message: 'System exercises repaired', count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Dodaj nowe ćwiczenie
router.post('/', async (req, res) => {
    const exerciseData = { ...req.body, isCustom: true };
    const exercise = new Exercise(exerciseData);
    try {
        const newExercise = await exercise.save();
        res.status(201).json(newExercise);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Usuń ćwiczenie
router.delete('/:id', async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }



        await Exercise.findByIdAndDelete(req.params.id);
        res.json({ message: 'Exercise deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
