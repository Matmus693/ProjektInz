const router = require('express').Router();
const Workout = require('../models/Workout');
const WorkoutPlan = require('../models/WorkoutPlan');
const Exercise = require('../models/Exercise');

// Get workout suggestion
router.get('/suggest', async (req, res) => {
    try {
        // 1. Get user's last workout
        // For now assuming we pass userId in query or auth token (simplifying without auth middleware for this step, but ideal to use req.user.id)
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const lastWorkout = await Workout.findOne({ userId }).sort({ date: -1, createdAt: -1 });

        let suggestion = {
            type: 'FBW',
            reason: 'No previous workout found. Start with a Full Body Workout.',
            suggestedPlan: null
        };

        if (lastWorkout) {
            const lastType = lastWorkout.name.toLowerCase(); // Assuming name correlates roughly to type for now, or use 'type' field if added to Workout model explicitly

            // Simple rotation logic: Push -> Pull -> Legs -> Push...
            if (lastType.includes('push')) {
                suggestion.type = 'Pull';
                suggestion.reason = 'Your last workout was Push. Balance it with a Pull workout.';
            } else if (lastType.includes('pull')) {
                suggestion.type = 'Legs';
                suggestion.reason = 'Your last workout was Pull. Time to train Legs.';
            } else if (lastType.includes('legs')) {
                suggestion.type = 'Push';
                suggestion.reason = 'Your last workout was Legs. Cycle back to Push.';
            } else if (lastType.includes('fbw') || lastType.includes('full')) {
                suggestion.type = 'FBW';
                suggestion.reason = 'Continuing Full Body routine.';
            } else {
                suggestion.type = 'FBW';
                suggestion.reason = 'Unclear pattern. Recommend Full Body to reset.';
            }
        }

        // 2. Find a plan that matches the suggestion
        // Case insensitive regex for name matching
        const suggestedPlan = await WorkoutPlan.findOne({
            name: { $regex: suggestion.type, $options: 'i' },
            userId: userId // OR find a global template if we have them
        });

        if (suggestedPlan) {
            suggestion.suggestedPlan = suggestedPlan;
        } else {
            // Fallback: If no plan exists, fetch exercises for this type to help user build one
            // Map types to mechanics/muscle groups
            let mechanisticFilter = {};
            if (suggestion.type === 'Push') mechanisticFilter = { mechanics: 'Push' };
            if (suggestion.type === 'Pull') mechanisticFilter = { mechanics: 'Pull' };
            if (suggestion.type === 'Legs') mechanisticFilter = { muscleGroup: 'Legs' };

            const suggestedExercises = await Exercise.find(mechanisticFilter).limit(5);
            suggestion.suggestedExercises = suggestedExercises;
        }

        res.json(suggestion);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
