const Exercise = require('../models/Exercise');
const WorkoutPlan = require('../models/WorkoutPlan');
const Workout = require('../models/Workout');

/**
 * Helper: Map muscleGroup to specific muscle parts with default engagement
 * Used as fallback when muscleEngagement is missing/empty
 */
function getMusclePartsFromGroup(muscleGroup) {
    const mapping = {
        'Chest': { upperChest: 80, middleChest: 80, lowerChest: 80 },
        'Back': { backWidth: 80, backMiddle: 80, backLower: 80 },
        'Shoulders': { frontDelts: 80, sideDelts: 80, rearDelts: 80 },
        'Arms': { biceps: 40, triceps: 40, forearms: 20 },
        'Legs': { quads: 80, hamstrings: 80, glutes: 80, calves: 40 },
        'Core': { upperAbs: 80, lowerAbs: 80, obliques: 80 },
        'Full Body': {} // Handled specially
    };
    return mapping[muscleGroup] || {};
}

/**
 * Get muscle engagement from exercise, with fallback to muscleGroup/secondaryMuscles
 */
function getEffectiveEngagement(exerciseDef) {
    const engagement = {};

    // Check if muscleEngagement has any non-zero values
    const hasDetailedEngagement = exerciseDef.muscleEngagement &&
        Object.values(exerciseDef.muscleEngagement).some(v => v > 0);

    if (hasDetailedEngagement) {
        // Use detailed engagement
        return exerciseDef.muscleEngagement;
    }

    // Fallback: use muscleGroup (80%) + secondaryMuscles (40%)
    if (exerciseDef.muscleGroup) {
        const primaryMuscles = getMusclePartsFromGroup(exerciseDef.muscleGroup);
        Object.assign(engagement, primaryMuscles);
    }

    if (exerciseDef.secondaryMuscles && Array.isArray(exerciseDef.secondaryMuscles)) {
        for (const secondaryEntry of exerciseDef.secondaryMuscles) {
            // Handle both old format (string) and new format ({ group, subMuscles })
            if (typeof secondaryEntry === 'string') {
                // Old format: just group name
                const secondaryMusclesParts = getMusclePartsFromGroup(secondaryEntry);
                for (const [muscle, _] of Object.entries(secondaryMusclesParts)) {
                    engagement[muscle] = 40;
                }
            } else if (secondaryEntry.group && secondaryEntry.subMuscles) {
                // New format: { group, subMuscles: [subIds] }
                for (const subMuscleId of secondaryEntry.subMuscles) {
                    engagement[subMuscleId] = 40;
                }
            }
        }
    }

    return engagement;
}

/**
 * Analyze training history from last 7 days
 * Calculate volume, frequency, and rest days for each muscle group
 */
async function analyzeTrainingHistory(userId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Format as YYYY-MM-DD to match string dates in database
    const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];

    // Fetch workouts from last 7 days
    // Note: date field is stored as string (YYYY-MM-DD), so we compare strings
    const workouts = await Workout.find({
        userId,
        date: { $gte: sevenDaysAgoString }
    }).sort({ date: -1 });

    // Initialize muscle stats
    const muscleStats = {
        upperChest: { volume: 0, frequency: 0, lastTrained: null },
        middleChest: { volume: 0, frequency: 0, lastTrained: null },
        lowerChest: { volume: 0, frequency: 0, lastTrained: null },
        backWidth: { volume: 0, frequency: 0, lastTrained: null },
        backMiddle: { volume: 0, frequency: 0, lastTrained: null },
        backLower: { volume: 0, frequency: 0, lastTrained: null },
        frontDelts: { volume: 0, frequency: 0, lastTrained: null },
        sideDelts: { volume: 0, frequency: 0, lastTrained: null },
        rearDelts: { volume: 0, frequency: 0, lastTrained: null },
        biceps: { volume: 0, frequency: 0, lastTrained: null },
        triceps: { volume: 0, frequency: 0, lastTrained: null },
        forearms: { volume: 0, frequency: 0, lastTrained: null },
        quads: { volume: 0, frequency: 0, lastTrained: null },
        hamstrings: { volume: 0, frequency: 0, lastTrained: null },
        glutes: { volume: 0, frequency: 0, lastTrained: null },
        calves: { volume: 0, frequency: 0, lastTrained: null },
        upperAbs: { volume: 0, frequency: 0, lastTrained: null },
        lowerAbs: { volume: 0, frequency: 0, lastTrained: null },
        obliques: { volume: 0, frequency: 0, lastTrained: null }
    };

    // Process each workout
    for (const workout of workouts) {
        for (const exercise of workout.exercises) {
            // Get exercise definition
            const exerciseDef = await Exercise.findOne({ name: exercise.name });
            if (!exerciseDef) continue;

            // Get effective engagement (detailed or fallback)
            const engagement = getEffectiveEngagement(exerciseDef);
            if (Object.keys(engagement).length === 0) continue;

            // Calculate total volume for this exercise (weight × reps × sets)
            let exerciseVolume = 0;
            let hasAnyWork = false;
            for (const set of exercise.sets) {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseFloat(set.reps) || 0;

                if (reps > 0) {
                    hasAnyWork = true;
                    // For bodyweight exercises (weight=0), use reps as volume
                    // For weighted exercises, use weight × reps
                    exerciseVolume += weight > 0 ? (weight * reps) : reps;
                }
            }

            // Skip exercises with no work done (both weight and reps are 0)
            if (!hasAnyWork) continue;

            // Distribute volume across engaged muscles
            for (const [muscle, engagementPercent] of Object.entries(engagement)) {
                if (engagementPercent > 0 && muscleStats[muscle]) {
                    // Volume is weighted by engagement percentage
                    muscleStats[muscle].volume += (exerciseVolume * engagementPercent) / 100;

                    // Update last trained date
                    if (!muscleStats[muscle].lastTrained || workout.date > muscleStats[muscle].lastTrained) {
                        muscleStats[muscle].lastTrained = workout.date;
                    }
                }
            }
        }
    }

    // Calculate frequency (how many different days each muscle was trained)
    for (const workout of workouts) {
        const workoutDate = workout.date; // Already a string (YYYY-MM-DD)
        const musclesTrainedToday = new Set();

        for (const exercise of workout.exercises) {
            const exerciseDef = await Exercise.findOne({ name: exercise.name });
            if (!exerciseDef) continue;

            // Get effective engagement
            const engagement = getEffectiveEngagement(exerciseDef);
            if (Object.keys(engagement).length === 0) continue;

            // Calculate volume for this exercise
            let hasAnyWork = false;
            for (const set of exercise.sets) {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseFloat(set.reps) || 0;

                if (reps > 0) {
                    hasAnyWork = true;
                    break;
                }
            }

            // Only count if exercise had any work done
            if (!hasAnyWork) continue;

            for (const [muscle, engagementPercent] of Object.entries(engagement)) {
                if (engagementPercent > 0 && muscleStats[muscle]) {
                    musclesTrainedToday.add(muscle);
                }
            }
        }

        // Increment frequency for each muscle trained today
        for (const muscle of musclesTrainedToday) {
            muscleStats[muscle].frequency++;
        }
    }

    return { muscleStats, workoutCount: workouts.length };
}

/**
 * Classify muscles into categories based on training status
 */
function identifyMuscleStatus(muscleStats) {
    const now = new Date();
    const status = {
        overtrained: [],
        undertrained: [],
        ready: [],
        rested: []
    };

    // Aggregate into major muscle groups for easier analysis
    const aggregated = {
        chest: {
            volume: muscleStats.upperChest.volume + muscleStats.middleChest.volume + muscleStats.lowerChest.volume,
            frequency: Math.max(muscleStats.upperChest.frequency, muscleStats.middleChest.frequency, muscleStats.lowerChest.frequency),
            lastTrained: [muscleStats.upperChest.lastTrained, muscleStats.middleChest.lastTrained, muscleStats.lowerChest.lastTrained]
                .filter(d => d !== null)
                .sort((a, b) => b - a)[0] || null
        },
        back: {
            volume: muscleStats.backWidth.volume + muscleStats.backMiddle.volume + muscleStats.backLower.volume,
            frequency: Math.max(muscleStats.backWidth.frequency, muscleStats.backMiddle.frequency, muscleStats.backLower.frequency),
            lastTrained: [muscleStats.backWidth.lastTrained, muscleStats.backMiddle.lastTrained, muscleStats.backLower.lastTrained]
                .filter(d => d !== null)
                .sort((a, b) => b - a)[0] || null
        },
        shoulders: {
            volume: muscleStats.frontDelts.volume + muscleStats.sideDelts.volume + muscleStats.rearDelts.volume,
            frequency: Math.max(muscleStats.frontDelts.frequency, muscleStats.sideDelts.frequency, muscleStats.rearDelts.frequency),
            lastTrained: [muscleStats.frontDelts.lastTrained, muscleStats.sideDelts.lastTrained, muscleStats.rearDelts.lastTrained]
                .filter(d => d !== null)
                .sort((a, b) => b - a)[0] || null
        },
        arms: {
            volume: muscleStats.biceps.volume + muscleStats.triceps.volume,
            frequency: Math.max(muscleStats.biceps.frequency, muscleStats.triceps.frequency),
            lastTrained: [muscleStats.biceps.lastTrained, muscleStats.triceps.lastTrained]
                .filter(d => d !== null)
                .sort((a, b) => b - a)[0] || null
        },
        legs: {
            volume: muscleStats.quads.volume + muscleStats.hamstrings.volume + muscleStats.glutes.volume + muscleStats.calves.volume,
            frequency: Math.max(muscleStats.quads.frequency, muscleStats.hamstrings.frequency, muscleStats.glutes.frequency, muscleStats.calves.frequency),
            lastTrained: [muscleStats.quads.lastTrained, muscleStats.hamstrings.lastTrained, muscleStats.glutes.lastTrained, muscleStats.calves.lastTrained]
                .filter(d => d !== null)
                .sort((a, b) => b - a)[0] || null
        },
        core: {
            volume: muscleStats.upperAbs.volume + muscleStats.lowerAbs.volume + muscleStats.obliques.volume,
            frequency: Math.max(muscleStats.upperAbs.frequency, muscleStats.lowerAbs.frequency, muscleStats.obliques.frequency),
            lastTrained: [muscleStats.upperAbs.lastTrained, muscleStats.lowerAbs.lastTrained, muscleStats.obliques.lastTrained]
                .filter(d => d !== null)
                .sort((a, b) => b - a)[0] || null
        }
    };

    // Classify each major muscle group
    for (const [group, stats] of Object.entries(aggregated)) {
        const daysSinceLastTrained = stats.lastTrained
            ? Math.floor((now - new Date(stats.lastTrained)) / (1000 * 60 * 60 * 24))
            : 999;

        // Overtrained: very high frequency (5+ times/week) OR high frequency with recent training
        if (stats.frequency >= 5 || (stats.frequency >= 3 && daysSinceLastTrained < 1)) {
            status.overtrained.push(group);
        }
        // Undertrained: not trained at all in 7 days
        else if (stats.volume === 0 || daysSinceLastTrained >= 7) {
            status.undertrained.push(group);
        }
        // Rested: 3-6 days since last training (ready for heavy work)
        else if (daysSinceLastTrained >= 3 && daysSinceLastTrained < 7) {
            status.rested.push(group);
        }
        // Ready: 1-2 days rest (can train but not priority)
        else {
            status.ready.push(group);
        }
    }

    return { status, aggregated };
}

/**
 * Generate workout recommendation based on muscle status
 */
async function generateRecommendation(userId, muscleStatus) {
    const { status, aggregated } = muscleStatus;

    // Calculate which muscles were trained today OR yesterday (48h rest rule)
    const VOLUME_THRESHOLD = 3000;
    const now = new Date();
    const blockedMuscles = [];

    for (const [muscle, stats] of Object.entries(aggregated)) {
        if (stats.lastTrained) {
            const daysSince = Math.floor((now - new Date(stats.lastTrained)) / (1000 * 60 * 60 * 24));
            // Block if trained today (daysSince === 0) OR yesterday (daysSince === 1)
            // This ensures minimum 48h rest between same muscle groups
            if (daysSince <= 1 && stats.volume >= VOLUME_THRESHOLD) {
                blockedMuscles.push(muscle);
            }
        }
    }

    // Helper: Filter out muscles trained heavily in last 48h
    // Secondary muscles (low volume) don't block recommendations
    const VOLUME_THRESHOLD_FILTER = 3000; // Volume below this = secondary/incidental work

    const getMusclesNotTrainedRecently = (muscles) => {
        return muscles.filter(muscle => {
            const stats = aggregated[muscle];
            if (!stats || !stats.lastTrained) return true;

            const daysSince = Math.floor((now - new Date(stats.lastTrained)) / (1000 * 60 * 60 * 24));

            // If 2+ days ago, it's available (48h rest)
            if (daysSince >= 2) return true;

            // If trained recently (today or yesterday) but low volume (secondary work), still available
            return stats.volume < VOLUME_THRESHOLD_FILTER;
        });
    };

    // Priority 1: If major muscle groups are undertrained, suggest them
    if (status.undertrained.length > 0) {
        // Try to find existing plan for undertrained muscles
        const targetMuscles = status.undertrained;
        const plan = await findMatchingPlan(userId, targetMuscles, muscleStatus, blockedMuscles);

        if (plan) {
            return {
                type: 'existing_plan',
                plan: plan,
                reason: `Następujące partie mięśniowe wymagają treningu: ${targetMuscles.join(', ')}. Sugerujemy plan "${plan.name}".`,
                muscleGroups: targetMuscles
            };
        } else {
            // Generate temporary plan
            const tempPlan = await generateTemporaryPlan(userId, targetMuscles, 'undertrained');
            return {
                type: 'temporary_plan',
                plan: tempPlan,
                reason: `Wygenerowaliśmy plan dopełniający dla: ${targetMuscles.join(', ')}.`,
                muscleGroups: targetMuscles
            };
        }
    }

    // Priority 2: Train rested muscles (3+ days)
    const restedNotToday = getMusclesNotTrainedRecently(status.rested);
    if (restedNotToday.length > 0) {
        const targetMuscles = restedNotToday;
        const plan = await findMatchingPlan(userId, targetMuscles, muscleStatus, blockedMuscles);

        if (plan) {
            return {
                type: 'existing_plan',
                plan: plan,
                reason: `Partie mięśniowe gotowe do treningu: ${targetMuscles.join(', ')}. Sugerujemy plan "${plan.name}".`,
                muscleGroups: targetMuscles
            };
        }
    }

    // Priority 3: Ready muscles (1-2 days rest) but NOT trained heavily today
    const readyNotToday = getMusclesNotTrainedRecently(status.ready);
    const availableMuscles = [...readyNotToday, ...restedNotToday].filter(m => !status.overtrained.includes(m));

    console.log('DEBUG - Ready muscles:', status.ready);
    console.log('DEBUG - Rested muscles:', status.rested);
    console.log('DEBUG - Available muscles after filter:', availableMuscles);
    console.log('DEBUG - Blocked muscles:', blockedMuscles);

    if (availableMuscles.length > 0) {
        // ROTATION LOGIC: Prefer muscle groups trained longest ago
        // Prevents: Push Mon -> Rest Tue -> Push Wed (without Pull/Legs)

        // Define major muscle group priority (for PPL split)
        const majorGroups = ['legs', 'chest', 'back', 'shoulders'];
        const getMajorPriority = (muscle) => {
            if (muscle === 'legs') return 0; // Highest priority
            if (muscle === 'chest' || muscle === 'back') return 1;
            if (muscle === 'shoulders') return 2;
            if (muscle === 'arms') return 3;
            return 4; // core, etc - lowest priority
        };

        const musclesByRecency = availableMuscles.map(muscle => ({
            muscle,
            daysSince: aggregated[muscle]?.lastTrained
                ? Math.floor((now - new Date(aggregated[muscle].lastTrained)) / (1000 * 60 * 60 * 24))
                : 999,
            volume: aggregated[muscle]?.volume || 0,
            priority: getMajorPriority(muscle)
        })).sort((a, b) => {
            // Primary sort: Major muscle groups first (legs, chest, back, shoulders before arms/core)
            if (a.priority !== b.priority) return a.priority - b.priority;
            // Secondary: Oldest first (most days since training)
            if (b.daysSince !== a.daysSince) return b.daysSince - a.daysSince;
            // Tie-breaker: Lowest volume first (least trained = priority)
            return a.volume - b.volume;
        });

        console.log('DEBUG - Muscles by recency:', musclesByRecency);
        const targetMuscles = musclesByRecency.slice(0, 2).map(m => m.muscle); // Top 2 oldest/least trained
        console.log('DEBUG - Target muscles for plan:', targetMuscles);
        const plan = await findMatchingPlan(userId, targetMuscles, muscleStatus, blockedMuscles);
        console.log('DEBUG - Plan found:', plan ? plan.name : 'NO PLAN FOUND');
        if (plan) {
            return {
                type: 'existing_plan',
                plan: plan,
                reason: `Sugerujemy plan "${plan.name}" dla odpoczętych partii mięśniowych.`,
                muscleGroups: availableMuscles
            };
        }
        // FALLBACK: Generate plan if no existing one matches
        const workoutGenerator = require('./workoutGenerator');
        const generatedPlan = await workoutGenerator.generateOptimalPlan(targetMuscles, 'CUSTOM', 6);

        if (generatedPlan && generatedPlan.exercises.length > 0) {
            return {
                type: 'generated_plan',
                plan: {
                    name: `Trening ${targetMuscles.join(', ')}`,
                    exercises: generatedPlan.exercises,
                    temporary: true
                },
                reason: `Wygenerowaliśmy nowy trening dla: ${targetMuscles.join(', ')}.`,
                muscleGroups: targetMuscles
            };
        }
    }

    // Fallback: suggest rest or light workout
    return {
        type: 'rest',
        reason: 'Większość mięśni jest przetrenowana. Zalecamy dzień odpoczynku lub lekki trening regeneracyjny.',
        muscleGroups: []
    };
}

/**
 * Find workout plan matching target muscles and avoiding overtrained ones
 * @param {string} userId - User ID
 * @param {Array} targetMuscles - Muscles we want to train
 * @param {Object} muscleStatus - Status with overtrained/undertrained/rested/ready
 * @param {Array} blockedMuscles - Muscles trained heavily today (should NOT be trained)
 */
async function findMatchingPlan(userId, targetMuscles, muscleStatus, blockedMuscles = []) {
    const plans = await WorkoutPlan.find({
        userId,
        temporary: { $ne: true } // Only permanent plans
    });

    if (plans.length === 0) return null;

    const { overtrained = [], undertrained = [], rested = [] } = muscleStatus?.status || {};

    // Map muscle groups to keywords in plan names
    const muscleMap = {
        'chest': ['push', 'chest', 'klatka'],
        'back': ['pull', 'back', 'plecy'],
        'shoulders': ['push', 'shoulders', 'barki'],
        'arms': ['push', 'pull', 'arms', 'ramiona'],
        'legs': ['legs', 'nogi'],
        'core': ['core', 'abs', 'brzuch']
    };

    // Score each plan based on how well it matches the recommendation
    const scoredPlans = plans.map(plan => {
        const planNameLower = plan.name.toLowerCase();
        let score = 0;

        // Check which muscle groups this plan targets
        const planTargets = [];
        for (const [muscle, keywords] of Object.entries(muscleMap)) {
            if (keywords.some(kw => planNameLower.includes(kw))) {
                planTargets.push(muscle);
            }
        }

        // HEAVY PENALTY: Plan targets blocked muscles (trained heavily today)
        const blockedCount = planTargets.filter(m => blockedMuscles.includes(m)).length;
        score -= blockedCount * 500; // Very high penalty to exclude these

        // PENALTY: Plan targets overtrained muscles (we want to avoid these)
        const overtrainedCount = planTargets.filter(m => overtrained.includes(m)).length;
        score -= overtrainedCount * 100;

        // BONUS: Plan targets undertrained muscles (we want these)
        const undertrainedCount = planTargets.filter(m => undertrained.includes(m)).length;
        score += undertrainedCount * 50;

        // BONUS: Plan targets rested muscles (good to train)
        const restedCount = planTargets.filter(m => rested.includes(m)).length;
        score += restedCount * 30;

        // BONUS: Plan targets requested muscles
        const targetCount = planTargets.filter(m => targetMuscles.includes(m)).length;
        score += targetCount * 20;

        return { plan, score, targets: planTargets };
    });

    // Sort by score (highest first)
    scoredPlans.sort((a, b) => b.score - a.score);

    // Return best plan if it has a positive score
    if (scoredPlans[0] && scoredPlans[0].score > 0) {
        return scoredPlans[0].plan;
    }

    return null;
}

/**
 * Generate temporary workout plan for specific muscle groups
 */
async function generateTemporaryPlan(userId, targetMuscles, reason) {
    // Check if temporary plan already exists for this user
    const existingTempPlan = await WorkoutPlan.findOne({
        userId,
        temporary: true
    });

    // If exists, return it instead of creating a new one
    if (existingTempPlan) {
        return existingTempPlan;
    }

    // Map muscle groups to specific muscle parts for exercise selection
    const musclePartsMap = {
        'chest': ['upperChest', 'middleChest', 'lowerChest'],
        'back': ['backWidth', 'backMiddle', 'backLower'],
        'shoulders': ['frontDelts', 'sideDelts', 'rearDelts'],
        'arms': ['biceps', 'triceps'],
        'legs': ['quads', 'hamstrings', 'glutes', 'calves'],
        'core': ['upperAbs', 'lowerAbs', 'obliques']
    };

    const targetMuscleParts = [];
    for (const group of targetMuscles) {
        if (musclePartsMap[group]) {
            targetMuscleParts.push(...musclePartsMap[group]);
        }
    }

    // Find exercises that target these muscles
    const allExercises = await Exercise.find({});
    const matchingExercises = allExercises.filter(ex => {
        if (!ex.muscleEngagement) return false;
        return targetMuscleParts.some(musclePart =>
            (ex.muscleEngagement[musclePart] || 0) > 30
        );
    });

    // Select top 5-6 exercises (prioritize compound)
    const selectedExercises = matchingExercises
        .sort((a, b) => {
            if (a.type === 'Compound' && b.type !== 'Compound') return -1;
            if (a.type !== 'Compound' && b.type === 'Compound') return 1;
            return 0;
        })
        .slice(0, 6)
        .map(ex => ({
            name: ex.name,
            numSets: 3,
            sets: []
        }));

    // Create temporary plan
    const tempPlan = new WorkoutPlan({
        userId,
        name: `Trening Dopełniający - ${targetMuscles.join(', ')}`,
        description: `Automatycznie wygenerowany plan na podstawie analizy (${reason})`,
        type: 'Szablon',
        temporary: true,
        isGenerated: true,
        exercises: selectedExercises
    });

    await tempPlan.save();
    return tempPlan;
}

module.exports = {
    analyzeTrainingHistory,
    identifyMuscleStatus,
    generateRecommendation
};
