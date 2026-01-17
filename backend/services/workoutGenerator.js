const Exercise = require('../models/Exercise');

// Muscle group mappings for training types
const TRAINING_TYPES = {
    FBW: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'],
    PPL_PUSH: ['chest', 'shoulders_front', 'shoulders_side', 'triceps'],
    PPL_PULL: ['back', 'biceps', 'rear_delts'],
    PPL_LEGS: ['quads', 'hamstrings', 'glutes', 'calves']
};

// Safety constraints
const LIMITS = {
    MAX_ENGAGEMENT: 250,
    MIN_ENGAGEMENT: 150,
    REST_PERIOD_HOURS: 48
};

// Antagonist muscle balance ratios
const ANTAGONIST_RATIOS = {
    chest_to_back: { min: 0.8, max: 1.2 },
    front_delts_to_rear_delts: { min: 0.7, max: 1.4 },
    quads_to_hamstrings: { min: 0.6, max: 1.7 }
};

/**
 * Calculate total engagement for each muscle part from a list of exercises
 * @param {Array} exercises - Array of exercise objects
 * @returns {Object} - Engagement totals for each muscle
 */
function calculateMuscleEngagement(exercises) {
    const engagement = {
        upperChest: 0,
        middleChest: 0,
        lowerChest: 0,
        backWidth: 0,
        backMiddle: 0,
        backLower: 0,
        frontDelts: 0,
        sideDelts: 0,
        rearDelts: 0,
        biceps: 0,
        triceps: 0,
        forearms: 0,
        quads: 0,
        hamstrings: 0,
        glutes: 0,
        calves: 0,
        upperAbs: 0,
        lowerAbs: 0,
        obliques: 0
    };

    exercises.forEach(exercise => {
        if (exercise.muscleEngagement) {
            Object.keys(engagement).forEach(muscle => {
                engagement[muscle] += (exercise.muscleEngagement[muscle] || 0);
            });
        }
    });

    return engagement;
}

/**
 * Calculate aggregate engagement for major muscle groups
 */
function getAggregateEngagement(engagement) {
    return {
        chest: engagement.upperChest + engagement.middleChest + engagement.lowerChest,
        back: engagement.backWidth + engagement.backMiddle + engagement.backLower,
        shoulders: engagement.frontDelts + engagement.sideDelts + engagement.rearDelts,
        arms: engagement.biceps + engagement.triceps + engagement.forearms,
        legs: engagement.quads + engagement.hamstrings + engagement.glutes + engagement.calves,
        core: engagement.upperAbs + engagement.lowerAbs + engagement.obliques
    };
}

/**
 * Validate that muscle engagement is within safe limits
 * @param {Object} engagement - Muscle engagement object
 * @returns {Object} - { valid: boolean, warnings: [] }
 */
function validateSafetyLimits(engagement) {
    const warnings = [];
    const aggregate = getAggregateEngagement(engagement);

    Object.entries(aggregate).forEach(([muscle, total]) => {
        if (total > LIMITS.MAX_ENGAGEMENT) {
            warnings.push(`${muscle} is overworked: ${total.toFixed(0)}% (max ${LIMITS.MAX_ENGAGEMENT}%)`);
        } else if (total > 0 && total < LIMITS.MIN_ENGAGEMENT) {
            warnings.push(`${muscle} is undertrained: ${total.toFixed(0)}% (min ${LIMITS.MIN_ENGAGEMENT}%)`);
        }
    });

    return {
        valid: warnings.length === 0,
        warnings,
        engagement: aggregate
    };
}

/**
 * Check balance between antagonist muscle groups
 */
function checkAntagonistBalance(engagement) {
    const warnings = [];
    const agg = getAggregateEngagement(engagement);

    // Chest to Back ratio
    if (agg.chest > 0 && agg.back > 0) {
        const ratio = agg.chest / agg.back;
        if (ratio < ANTAGONIST_RATIOS.chest_to_back.min) {
            warnings.push(`Chest/Back imbalance: too much back (${ratio.toFixed(2)}:1)`);
        } else if (ratio > ANTAGONIST_RATIOS.chest_to_back.max) {
            warnings.push(`Chest/Back imbalance: too much chest (${ratio.toFixed(2)}:1)`);
        }
    }

    // Front to Rear Delts
    if (engagement.frontDelts > 0 && engagement.rearDelts > 0) {
        const ratio = engagement.frontDelts / engagement.rearDelts;
        if (ratio < ANTAGONIST_RATIOS.front_delts_to_rear_delts.min) {
            warnings.push(`Front/Rear delt imbalance: too much rear (${ratio.toFixed(2)}:1)`);
        } else if (ratio > ANTAGONIST_RATIOS.front_delts_to_rear_delts.max) {
            warnings.push(`Front/Rear delt imbalance: too much front (${ratio.toFixed(2)}:1)`);
        }
    }

    // Quads to Hamstrings
    if (engagement.quads > 0 && engagement.hamstrings > 0) {
        const ratio = engagement.quads / engagement.hamstrings;
        if (ratio < ANTAGONIST_RATIOS.quads_to_hamstrings.min) {
            warnings.push(`Quad/Hamstring imbalance: too much hamstrings (${ratio.toFixed(2)}:1)`);
        } else if (ratio > ANTAGONIST_RATIOS.quads_to_hamstrings.max) {
            warnings.push(`Quad/Hamstring imbalance: too much quads (${ratio.toFixed(2)}:1)`);
        }
    }

    return {
        balanced: warnings.length === 0,
        warnings
    };
}

/**
 * Score an exercise based on how well it matches target muscles
 * Prioritizes compound exercises and effectiveness
 */
function scoreExercise(exercise, targetMuscles) {
    let score = 0;

    // Higher score for compound exercises
    if (exercise.type === 'Compound') {
        score += 50;
    }

    // Add engagement percentage for target muscles
    targetMuscles.forEach(muscle => {
        if (exercise.muscleEngagement && exercise.muscleEngagement[muscle]) {
            score += exercise.muscleEngagement[muscle];
        }
    });

    // Bonus for appropriate difficulty (not too easy, not too hard)
    if (exercise.difficulty >= 2 && exercise.difficulty <= 4) {
        score += 10;
    }

    return score;
}

/**
 * Generate optimal workout plan based on target muscles and training type
 * @param {Array} targetMuscles - Array of muscle parts to target
 * @param {String} trainingType - 'FBW', 'PPL_PUSH', 'PPL_PULL', 'PPL_LEGS', or 'CUSTOM'
 * @param {Number} maxExercises - Maximum number of exercises to include
 * @returns {Object} - Generated plan with exercises and analysis
 */
async function generateOptimalPlan(targetMuscles, trainingType = 'CUSTOM', maxExercises = 6) {
    try {
        // Get all exercises from database
        const allExercises = await Exercise.find({});

        // Filter exercises that have any engagement in target muscles
        let candidates = allExercises.filter(exercise => {
            if (!exercise.muscleEngagement) return false;

            return targetMuscles.some(muscle => {
                return (exercise.muscleEngagement[muscle] || 0) > 0;
            });
        });

        // Score and sort exercises
        candidates = candidates.map(ex => ({
            exercise: ex,
            score: scoreExercise(ex, targetMuscles)
        }))
            .sort((a, b) => b.score - a.score);

        // Select top exercises, ensuring variety
        const selectedExercises = [];
        const usedExercises = new Set();

        // First pass: select highest scoring compound exercises
        for (const { exercise } of candidates) {
            if (selectedExercises.length >= maxExercises) break;
            if (usedExercises.has(exercise.name)) continue;

            if (exercise.type === 'Compound') {
                selectedExercises.push(exercise);
                usedExercises.add(exercise.name);
            }
        }

        // Second pass: add isolation exercises if needed
        for (const { exercise } of candidates) {
            if (selectedExercises.length >= maxExercises) break;
            if (usedExercises.has(exercise.name)) continue;

            if (exercise.type === 'Isolation') {
                selectedExercises.push(exercise);
                usedExercises.add(exercise.name);
            }
        }

        // Calculate engagement and validate
        const engagement = calculateMuscleEngagement(selectedExercises);
        const safetyCheck = validateSafetyLimits(engagement);
        const balanceCheck = checkAntagonistBalance(engagement);

        return {
            success: true,
            exercises: selectedExercises,
            analysis: {
                totalExercises: selectedExercises.length,
                compoundCount: selectedExercises.filter(ex => ex.type === 'Compound').length,
                isolationCount: selectedExercises.filter(ex => ex.type === 'Isolation').length,
                engagement: safetyCheck.engagement,
                safety: safetyCheck,
                balance: balanceCheck
            }
        };
    } catch (error) {
        console.error('Error generating workout plan:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    calculateMuscleEngagement,
    validateSafetyLimits,
    checkAntagonistBalance,
    scoreExercise,
    generateOptimalPlan,
    TRAINING_TYPES,
    LIMITS
};
