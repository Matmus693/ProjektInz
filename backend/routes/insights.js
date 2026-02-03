const router = require('express').Router();
const Workout = require('../models/Workout');
const WorkoutPlan = require('../models/WorkoutPlan');
const Exercise = require('../models/Exercise');
const smartInsights = require('../services/smartInsights');
const auth = require('../middleware/auth');

router.get('/suggest', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        const { muscleStats, workoutCount } = await smartInsights.analyzeTrainingHistory(userId);

        const muscleStatus = smartInsights.identifyMuscleStatus(muscleStats);

        const recommendation = await smartInsights.generateRecommendation(userId, muscleStatus);

        if (recommendation.type === 'existing_plan') {
            return res.json({
                type: recommendation.plan.name,
                reason: recommendation.reason,
                suggestedPlan: recommendation.plan,
                muscleGroups: recommendation.muscleGroups,
                analysis: {
                    workoutCount,
                    muscleStatus: muscleStatus.status
                }
            });
        } else if (recommendation.type === 'temporary_plan') {
            return res.json({
                type: 'Trening Dopełniający',
                reason: recommendation.reason,
                suggestedPlan: recommendation.plan,
                muscleGroups: recommendation.muscleGroups,
                temporary: true,
                analysis: {
                    workoutCount,
                    muscleStatus: muscleStatus.status
                }
            });
        } else if (recommendation.type === 'rest') {
            return res.json({
                type: 'Odpoczynek',
                reason: recommendation.reason,
                suggestedPlan: null,
                muscleGroups: [],
                analysis: {
                    workoutCount,
                    muscleStatus: muscleStatus.status
                }
            });
        } else if (recommendation.type === 'generated_plan') {
            return res.json({
                type: 'Wygenerowany Plan',
                reason: recommendation.reason,
                suggestedPlan: recommendation.plan,
                muscleGroups: recommendation.muscleGroups,
                temporary: true,
                analysis: {
                    workoutCount,
                    muscleStatus: muscleStatus.status
                }
            });
        }

    } catch (err) {
        console.error('Smart insights error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
