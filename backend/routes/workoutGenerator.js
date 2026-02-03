const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const workoutGenerator = require('../services/workoutGenerator');

router.post('/generate', auth, async (req, res) => {
    try {
        const { targetMuscles, trainingType, maxExercises } = req.body;

        if (!targetMuscles || !Array.isArray(targetMuscles) || targetMuscles.length === 0) {
            return res.status(400).json({
                message: 'Target muscles array is required'
            });
        }

        const result = await workoutGenerator.generateOptimalPlan(
            targetMuscles,
            trainingType || 'CUSTOM',
            maxExercises || 6
        );

        if (!result.success) {
            return res.status(500).json({
                message: 'Failed to generate workout plan',
                error: result.error
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Generate workout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/validate', auth, async (req, res) => {
    try {
        const { exercises } = req.body;

        if (!exercises || !Array.isArray(exercises)) {
            return res.status(400).json({
                message: 'Exercises array is required'
            });
        }

        const engagement = workoutGenerator.calculateMuscleEngagement(exercises);
        const safetyCheck = workoutGenerator.validateSafetyLimits(engagement);
        const balanceCheck = workoutGenerator.checkAntagonistBalance(engagement);

        res.json({
            engagement: safetyCheck.engagement,
            safety: safetyCheck,
            balance: balanceCheck
        });
    } catch (error) {
        console.error('Validate workout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/muscle-groups', auth, (req, res) => {
    const muscleGroups = {
        chest: ['upperChest', 'middleChest', 'lowerChest'],
        back: ['backWidth', 'backMiddle', 'backLower'],
        shoulders: ['frontDelts', 'sideDelts', 'rearDelts'],
        arms: ['biceps', 'triceps', 'forearms'],
        legs: ['quads', 'hamstrings', 'glutes', 'calves'],
        core: ['upperAbs', 'lowerAbs', 'obliques']
    };

    res.json(muscleGroups);
});

router.get('/training-types', auth, (req, res) => {
    res.json(workoutGenerator.TRAINING_TYPES);
});

module.exports = router;
