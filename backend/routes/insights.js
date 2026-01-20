const router = require('express').Router();
const Workout = require('../models/Workout');
const WorkoutPlan = require('../models/WorkoutPlan');
const Exercise = require('../models/Exercise');
const smartInsights = require('../services/smartInsights');
const auth = require('../middleware/auth');

// Get smart workout suggestion based on training history
router.get('/suggest', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        // Analyze training history (last 7 days)
        const { muscleStats, workoutCount } = await smartInsights.analyzeTrainingHistory(userId);

        // Identify muscle status (overtrained, undertrained, ready)
        const muscleStatus = smartInsights.identifyMuscleStatus(muscleStats);

        // Generate recommendation
        const recommendation = await smartInsights.generateRecommendation(userId, muscleStatus);

        // Format response based on recommendation type
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
        }

    } catch (err) {
        console.error('Smart insights error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
