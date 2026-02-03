const Exercise = require('../models/Exercise');
const WorkoutPlan = require('../models/WorkoutPlan');
const Workout = require('../models/Workout');
const { translateMuscleList } = require('../utils/translations');

const VOLUME_LANDMARKS = {
    chest: { mv: 6, mev: 10, mavMin: 12, mavMax: 18, mrv: 22 },
    back: { mv: 8, mev: 10, mavMin: 14, mavMax: 22, mrv: 26 },
    
    frontDelts: { mv: 3, mev: 5, mavMin: 8, mavMax: 14, mrv: 18 },
    sideDelts: { mv: 3, mev: 5, mavMin: 8, mavMax: 14, mrv: 18 },
    rearDelts: { mv: 3, mev: 5, mavMin: 6, mavMax: 10, mrv: 14 },
    
    biceps: { mv: 3, mev: 5, mavMin: 8, mavMax: 14, mrv: 18 },
    triceps: { mv: 3, mev: 5, mavMin: 8, mavMax: 14, mrv: 18 },
    
    legs: { mv: 6, mev: 8, mavMin: 12, mavMax: 18, mrv: 20 },
    core: { mv: 4, mev: 8, mavMin: 12, mavMax: 20, mrv: 25 }
};

function getMusclePartsFromGroup(muscleGroup) {
    const mapping = {
        'Chest': { upperChest: 80, middleChest: 80, lowerChest: 80 },
        'Back': { backWidth: 80, backMiddle: 80, backLower: 80 },
        'Shoulders': { frontDelts: 80, sideDelts: 80, rearDelts: 80 },
        'Arms': { biceps: 40, triceps: 40, forearms: 20 },
        'Legs': { quads: 80, hamstrings: 80, glutes: 80, calves: 40 },
        'Core': { upperAbs: 80, lowerAbs: 80, obliques: 80 },
        'Full Body': {}
    };
    return mapping[muscleGroup] || {};
}

function getEffectiveEngagement(exerciseDef) {
    const engagement = {};

    const hasDetailedEngagement = exerciseDef.muscleEngagement &&
        Object.values(exerciseDef.muscleEngagement).some(v => v > 0);

    if (hasDetailedEngagement) {
        
        return exerciseDef.muscleEngagement;
    }

    if (exerciseDef.muscleGroup) {
        const primaryMuscles = getMusclePartsFromGroup(exerciseDef.muscleGroup);
        Object.assign(engagement, primaryMuscles);
    }

    if (exerciseDef.secondaryMuscles && Array.isArray(exerciseDef.secondaryMuscles)) {
        for (const secondaryEntry of exerciseDef.secondaryMuscles) {
            
            if (typeof secondaryEntry === 'string') {
                const secondaryMusclesParts = getMusclePartsFromGroup(secondaryEntry);
                for (const [muscle, _] of Object.entries(secondaryMusclesParts)) {
                    engagement[muscle] = 40;
                }
            } else if (secondaryEntry.group && secondaryEntry.subMuscles) {
                for (const subMuscleId of secondaryEntry.subMuscles) {
                    engagement[subMuscleId] = 40;
                }
            }
        }
    }

    return engagement;
}

async function analyzeTrainingHistory(userId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];
    const workouts = await Workout.find({
        userId,
        date: { $gte: sevenDaysAgoString }
    }).sort({ date: -1 });

    const muscleStats = {
        upperChest: { sets: 0, frequency: 0, lastTrained: null },
        middleChest: { sets: 0, frequency: 0, lastTrained: null },
        lowerChest: { sets: 0, frequency: 0, lastTrained: null },
        backWidth: { sets: 0, frequency: 0, lastTrained: null },
        backMiddle: { sets: 0, frequency: 0, lastTrained: null },
        backLower: { sets: 0, frequency: 0, lastTrained: null },
        frontDelts: { sets: 0, frequency: 0, lastTrained: null },
        sideDelts: { sets: 0, frequency: 0, lastTrained: null },
        rearDelts: { sets: 0, frequency: 0, lastTrained: null },
        biceps: { sets: 0, frequency: 0, lastTrained: null },
        triceps: { sets: 0, frequency: 0, lastTrained: null },
        forearms: { sets: 0, frequency: 0, lastTrained: null },
        quads: { sets: 0, frequency: 0, lastTrained: null },
        hamstrings: { sets: 0, frequency: 0, lastTrained: null },
        glutes: { sets: 0, frequency: 0, lastTrained: null },
        calves: { sets: 0, frequency: 0, lastTrained: null },
        upperAbs: { sets: 0, frequency: 0, lastTrained: null },
        lowerAbs: { sets: 0, frequency: 0, lastTrained: null },
        obliques: { sets: 0, frequency: 0, lastTrained: null }
    };

    for (const workout of workouts) {
        for (const exercise of workout.exercises) {
            
            const exerciseDef = await Exercise.findOne({ name: exercise.name });
            if (!exerciseDef) continue;

            const engagement = getEffectiveEngagement(exerciseDef);
            if (Object.keys(engagement).length === 0) continue;

            let effectiveSets = 0;
            let hasAnyWork = false;
            for (const set of exercise.sets) {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseFloat(set.reps) || 0;

                if (reps >= 1 && reps <= 50) {
                    hasAnyWork = true;
                    effectiveSets++;
                }
            }

            if (!hasAnyWork || effectiveSets === 0) continue;

            for (const [muscle, engagementPercent] of Object.entries(engagement)) {
                if (engagementPercent > 0 && muscleStats[muscle]) {

                    const setContribution = engagementPercent >= 50
                        ? effectiveSets
                        : engagementPercent >= 30
                            ? effectiveSets * 0.5
                            : effectiveSets * (engagementPercent / 100);

                    muscleStats[muscle].sets += setContribution;

                    if (!muscleStats[muscle].lastTrained || workout.date > muscleStats[muscle].lastTrained) {
                        muscleStats[muscle].lastTrained = workout.date;
                    }
                }
            }
        }
    }

    for (const workout of workouts) {
        const workoutDate = workout.date;
        const musclesTrainedToday = new Set();

        for (const exercise of workout.exercises) {
            const exerciseDef = await Exercise.findOne({ name: exercise.name });
            if (!exerciseDef) continue;

            const engagement = getEffectiveEngagement(exerciseDef);
            if (Object.keys(engagement).length === 0) continue;

            let hasAnyWork = false;
            for (const set of exercise.sets) {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseFloat(set.reps) || 0;

                if (reps > 0) {
                    hasAnyWork = true;
                    break;
                }
            }

            if (!hasAnyWork) continue;

            for (const [muscle, engagementPercent] of Object.entries(engagement)) {
                if (engagementPercent > 0 && muscleStats[muscle]) {
                    musclesTrainedToday.add(muscle);
                }
            }
        }

        for (const muscle of musclesTrainedToday) {
            muscleStats[muscle].frequency++;
        }
    }

    return { muscleStats, workoutCount: workouts.length };
}

function identifyMuscleStatus(muscleStats) {
    const now = new Date();
    const status = {
        overtrained: [],
        undertrained: [],
        ready: [],
        rested: []
    };

    const aggregated = {
        chest: {
            sets: muscleStats.upperChest.sets + muscleStats.middleChest.sets + muscleStats.lowerChest.sets,
            frequency: Math.max(muscleStats.upperChest.frequency, muscleStats.middleChest.frequency, muscleStats.lowerChest.frequency),
            lastTrained: [muscleStats.upperChest.lastTrained, muscleStats.middleChest.lastTrained, muscleStats.lowerChest.lastTrained]
                .filter(d => d !== null)
                .sort((a, b) => b - a)[0] || null
        },
        back: {
            sets: muscleStats.backWidth.sets + muscleStats.backMiddle.sets + muscleStats.backLower.sets,
            frequency: Math.max(muscleStats.backWidth.frequency, muscleStats.backMiddle.frequency, muscleStats.backLower.frequency),
            lastTrained: [muscleStats.backWidth.lastTrained, muscleStats.backMiddle.lastTrained, muscleStats.backLower.lastTrained]
                .filter(d => d !== null)
                .sort((a, b) => b - a)[0] || null
        },
        
        frontDelts: {
            sets: muscleStats.frontDelts.sets,
            frequency: muscleStats.frontDelts.frequency,
            lastTrained: muscleStats.frontDelts.lastTrained
        },
        sideDelts: {
            sets: muscleStats.sideDelts.sets,
            frequency: muscleStats.sideDelts.frequency,
            lastTrained: muscleStats.sideDelts.lastTrained
        },
        rearDelts: {
            sets: muscleStats.rearDelts.sets,
            frequency: muscleStats.rearDelts.frequency,
            lastTrained: muscleStats.rearDelts.lastTrained
        },
        
        biceps: {
            sets: muscleStats.biceps.sets,
            frequency: muscleStats.biceps.frequency,
            lastTrained: muscleStats.biceps.lastTrained
        },
        triceps: {
            sets: muscleStats.triceps.sets,
            frequency: muscleStats.triceps.frequency,
            lastTrained: muscleStats.triceps.lastTrained
        },
        legs: {
            sets: muscleStats.quads.sets + muscleStats.hamstrings.sets + muscleStats.glutes.sets + muscleStats.calves.sets,
            frequency: Math.max(muscleStats.quads.frequency, muscleStats.hamstrings.frequency, muscleStats.glutes.frequency, muscleStats.calves.frequency),
            lastTrained: [muscleStats.quads.lastTrained, muscleStats.hamstrings.lastTrained, muscleStats.glutes.lastTrained, muscleStats.calves.lastTrained]
                .filter(d => d !== null)
                .sort((a, b) => b - a)[0] || null
        },
        core: {
            sets: muscleStats.upperAbs.sets + muscleStats.lowerAbs.sets + muscleStats.obliques.sets,
            frequency: Math.max(muscleStats.upperAbs.frequency, muscleStats.lowerAbs.frequency, muscleStats.obliques.frequency),
            lastTrained: [muscleStats.upperAbs.lastTrained, muscleStats.lowerAbs.lastTrained, muscleStats.obliques.lastTrained]
                .filter(d => d !== null)
                .sort((a, b) => b - a)[0] || null
        }
    };

    for (const [group, stats] of Object.entries(aggregated)) {
        const daysSinceLastTrained = stats.lastTrained
            ? Math.floor((now - new Date(stats.lastTrained)) / (1000 * 60 * 60 * 24))
            : 999;

        const landmarks = VOLUME_LANDMARKS[group];
        if (!landmarks) {
            
            if (daysSinceLastTrained >= 7 || stats.sets === 0) {
                status.undertrained.push(group);
            } else if (daysSinceLastTrained >= 3) {
                status.rested.push(group);
            } else {
                status.ready.push(group);
            }
            continue;
        }

        if (stats.sets > landmarks.mrv || (stats.frequency >= 3 && daysSinceLastTrained < 1)) {
            status.overtrained.push(group);
        }
        
        else if (stats.sets < landmarks.mev && daysSinceLastTrained >= 7) {
            status.undertrained.push(group);
        }
        
        else if (stats.sets >= landmarks.mev && daysSinceLastTrained >= 3 && daysSinceLastTrained < 7) {
            status.rested.push(group);
        }
        
        else {
            status.ready.push(group);
        }
    }

    return { status, aggregated };
}

async function generateRecommendation(userId, muscleStatus) {
    const { status, aggregated } = muscleStatus;

    const now = new Date();
    const blockedMuscles = [];

    console.log('\n=== MUSCLE STATUS ANALYSIS ===');
    
    for (const [muscle, stats] of Object.entries(aggregated)) {
        if (stats.lastTrained) {
            const daysSince = Math.floor((now - new Date(stats.lastTrained)) / (1000 * 60 * 60 * 24));
            const landmarks = VOLUME_LANDMARKS[muscle];

            console.log(`${muscle}: ${stats.sets} sets, ${daysSince} days ago, MAV min: ${landmarks?.mavMin}`);

            if (landmarks && daysSince <= 1 && stats.sets >= landmarks.mavMin) {
                blockedMuscles.push(muscle);
                console.log(`  ✗ BLOCKED (recent heavy training)`);
            }
        }
    }

    console.log('\nBlocked muscles:', blockedMuscles);
    console.log('Undertrained:', status.undertrained);
    console.log('Rested (3+ days):', status.rested);
    console.log('Ready (1-2 days):', status.ready);
    console.log('Overtrained:', status.overtrained);

    const getMusclesNotTrainedRecently = (muscles) => {
        return muscles.filter(muscle => {
            const stats = aggregated[muscle];
            if (!stats || !stats.lastTrained) return true;

            const daysSince = Math.floor((now - new Date(stats.lastTrained)) / (1000 * 60 * 60 * 24));

            if (daysSince >= 2) return true;

            const landmarks = VOLUME_LANDMARKS[muscle];
            return landmarks && stats.sets < landmarks.mavMin;
        });
    };

    const getSynergisticMuscles = (primaryMuscle, availableMinor) => {
        
        if (primaryMuscle === 'back') {
            return availableMinor.filter(m => m === 'biceps' || m === 'rearDelts');
        }

        if (primaryMuscle === 'rearDelts') {
            return availableMinor.filter(m => m === 'biceps');
        }

        if (primaryMuscle === 'chest') {
            return availableMinor.filter(m => m === 'triceps' || m === 'frontDelts' || m === 'sideDelts');
        }

        if (primaryMuscle === 'frontDelts') {
            return availableMinor.filter(m => m === 'triceps' || m === 'sideDelts');
        }

        if (primaryMuscle === 'sideDelts') {
            return availableMinor.filter(m => m === 'triceps' || m === 'frontDelts');
        }

        if (primaryMuscle === 'legs') {
            return availableMinor.filter(m => m === 'core');
        }

        return [];
    };

    if (status.undertrained.length > 0) {
        console.log('\n=== UNDERTRAINED MUSCLES DETECTED ===');
        console.log('Undertrained:', status.undertrained);

        const majorUndertrainedGroups = ['legs', 'chest', 'back', 'frontDelts', 'sideDelts', 'rearDelts'];
        const minorUndertrainedGroups = ['biceps', 'triceps', 'core'];

        const primaryUndertrained = status.undertrained.find(m => majorUndertrainedGroups.includes(m));
        console.log('Primary undertrained:', primaryUndertrained);

        let targetMuscles = [];
        if (primaryUndertrained) {
            targetMuscles = [primaryUndertrained];

            const minorUndertrained = status.undertrained.filter(m => minorUndertrainedGroups.includes(m));
            console.log('Minor undertrained available:', minorUndertrained);

            const synergistic = getSynergisticMuscles(primaryUndertrained, minorUndertrained);
            console.log('Synergistic muscles for', primaryUndertrained, ':', synergistic);

            if (synergistic.length > 0) {
                targetMuscles.push(synergistic[0]);
            }
        } else {
            
            targetMuscles = status.undertrained.slice(0, 2);
        }

        console.log('Target muscles selected:', targetMuscles);
        const plan = await findMatchingPlan(userId, targetMuscles, muscleStatus, blockedMuscles);
        console.log('Plan found:', plan ? plan.name : 'NO PLAN - will try to generate temporary');

        if (plan) {
            return {
                type: 'existing_plan',
                plan: plan,
                reason: `Następujące partie mięśniowe wymagają treningu: ${translateMuscleList(targetMuscles)}. Sugerujemy plan "${plan.name}".`,
                muscleGroups: targetMuscles
            };
        } else {
            
            const tempPlan = await generateTemporaryPlan(userId, targetMuscles, 'undertrained');
            return {
                type: 'temporary_plan',
                plan: tempPlan,
                reason: `Wygenerowaliśmy plan dopełniający dla: ${translateMuscleList(targetMuscles)}.`,
                muscleGroups: targetMuscles
            };
        }
    }

    const restedNotToday = getMusclesNotTrainedRecently(status.rested);
    if (restedNotToday.length > 0) {
        
        const majorRestedGroups = ['legs', 'chest', 'back', 'frontDelts', 'sideDelts', 'rearDelts'];
        const minorRestedGroups = ['biceps', 'triceps', 'core'];

        const primaryRested = restedNotToday.find(m => majorRestedGroups.includes(m));

        let targetMuscles = [];
        if (primaryRested) {
            targetMuscles = [primaryRested];

            const minorRested = restedNotToday.filter(m => minorRestedGroups.includes(m));
            const synergistic = getSynergisticMuscles(primaryRested, minorRested);

            if (synergistic.length > 0) {
                targetMuscles.push(synergistic[0]);
            }
        } else {
            
            targetMuscles = restedNotToday.slice(0, 2);
        }

        const plan = await findMatchingPlan(userId, targetMuscles, muscleStatus, blockedMuscles);

        if (plan) {
            return {
                type: 'existing_plan',
                plan: plan,
                reason: `Partie mięśniowe gotowe do treningu: ${translateMuscleList(targetMuscles)}. Sugerujemy plan "${plan.name}".`,
                muscleGroups: targetMuscles
            };
        }
    }

    const readyNotToday = getMusclesNotTrainedRecently(status.ready);
    const availableMuscles = [...readyNotToday, ...restedNotToday].filter(m => !status.overtrained.includes(m));

    console.log('DEBUG - Ready muscles:', status.ready);
    console.log('DEBUG - Rested muscles:', status.rested);
    console.log('DEBUG - Available muscles after filter:', availableMuscles);
    console.log('DEBUG - Blocked muscles:', blockedMuscles);

    if (availableMuscles.length > 0) {

        const majorGroups = ['legs', 'chest', 'back', 'shoulders'];
        const getMajorPriority = (muscle) => {
            if (muscle === 'legs') return 0;
            if (muscle === 'chest' || muscle === 'back') return 1;
            if (muscle === 'frontDelts' || muscle === 'sideDelts' || muscle === 'rearDelts') return 2;
            if (muscle === 'biceps' || muscle === 'triceps') return 3;
            return 4;
        };

        const musclesByRecency = availableMuscles.map(muscle => ({
            muscle,
            daysSince: aggregated[muscle]?.lastTrained
                ? Math.floor((now - new Date(aggregated[muscle].lastTrained)) / (1000 * 60 * 60 * 24))
                : 999,
            sets: aggregated[muscle]?.sets || 0,
            priority: getMajorPriority(muscle)
        })).sort((a, b) => {

            if (b.daysSince !== a.daysSince) return b.daysSince - a.daysSince;

            if (a.priority !== b.priority) return a.priority - b.priority;

            return a.sets - b.sets;
        });

        console.log('DEBUG - Muscles by recency:', musclesByRecency);

        const primaryMajorGroups = ['legs', 'chest', 'back', 'frontDelts', 'sideDelts', 'rearDelts'];
        const minorGroups = ['biceps', 'triceps', 'core'];

        const primaryMuscle = musclesByRecency.find(m => primaryMajorGroups.includes(m.muscle));

        let targetMuscles = [];
        if (primaryMuscle) {
            targetMuscles = [primaryMuscle.muscle];

            const minorAvailable = musclesByRecency
                .filter(m => minorGroups.includes(m.muscle))
                .map(m => m.muscle);
            const synergistic = getSynergisticMuscles(primaryMuscle.muscle, minorAvailable);

            if (synergistic.length > 0) {
                targetMuscles.push(synergistic[0]);
            }
        } else {
            
            targetMuscles = musclesByRecency.slice(0, 2).map(m => m.muscle);
        }

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
        
        const workoutGenerator = require('./workoutGenerator');

        const muscleGroupToParts = {
            'legs': ['quads', 'hamstrings', 'glutes', 'calves'],
            'back': ['backWidth', 'backMiddle', 'backLower'],
            'chest': ['upperChest', 'middleChest', 'lowerChest'],
            'shoulders': ['frontDelts', 'sideDelts', 'rearDelts'],
            'arms': ['biceps', 'triceps', 'forearms'],
            'core': ['upperAbs', 'lowerAbs', 'obliques']
        };

        const targetMuscleParts = [];
        for (const group of targetMuscles) {
            if (muscleGroupToParts[group]) {
                targetMuscleParts.push(...muscleGroupToParts[group]);
            }
        }

        console.log('DEBUG - Target muscle parts for generator:', targetMuscleParts);
        const generatedPlan = await workoutGenerator.generateOptimalPlan(targetMuscleParts, 'CUSTOM', 6);

        if (generatedPlan && generatedPlan.exercises && generatedPlan.exercises.length > 0) {
            return {
                type: 'generated_plan',
                plan: {
                    name: `Trening ${translateMuscleList(targetMuscles)}`,
                    exercises: generatedPlan.exercises,
                    temporary: true
                },
                reason: `Wygenerowaliśmy nowy trening dla: ${translateMuscleList(targetMuscles)}.`,
                muscleGroups: targetMuscles
            };
        }
    }

    return {
        type: 'rest',
        reason: 'Większość mięśni jest przetrenowana. Zalecamy dzień odpoczynku lub lekki trening regeneracyjny.',
        muscleGroups: []
    };
}

async function findMatchingPlan(userId, targetMuscles, muscleStatus, blockedMuscles = []) {
    const plans = await WorkoutPlan.find({
        userId,
        temporary: { $ne: true }
    });

    if (plans.length === 0) return null;

    const { overtrained = [], undertrained = [], rested = [] } = muscleStatus?.status || {};

    const muscleMap = {
        'chest': ['push', 'chest', 'klatka'],
        'back': ['pull', 'back', 'plecy'],
        'frontDelts': ['push', 'front', 'przod', 'shoulders'],
        'sideDelts': ['push', 'side', 'bok', 'shoulders'],
        'rearDelts': ['pull', 'rear', 'tylne'],
        'biceps': ['pull', 'biceps'],
        'triceps': ['push', 'triceps'],
        'legs': ['legs', 'nogi'],
        'core': ['core', 'abs', 'brzuch']
    };

    const scoredPlans = plans.map(plan => {
        const planNameLower = plan.name.toLowerCase();
        let score = 0;

        const planTargets = [];
        for (const [muscle, keywords] of Object.entries(muscleMap)) {
            if (keywords.some(kw => planNameLower.includes(kw))) {
                planTargets.push(muscle);
            }
        }

        const blockedCount = planTargets.filter(m => blockedMuscles.includes(m)).length;
        score -= blockedCount * 500;

        const overtrainedCount = planTargets.filter(m => overtrained.includes(m)).length;
        score -= overtrainedCount * 100;

        const undertrainedCount = planTargets.filter(m => undertrained.includes(m)).length;
        score += undertrainedCount * 50;

        const restedCount = planTargets.filter(m => rested.includes(m)).length;
        score += restedCount * 30;

        const targetCount = planTargets.filter(m => targetMuscles.includes(m)).length;
        score += targetCount * 20;

        return { plan, score, targets: planTargets };
    });

    scoredPlans.sort((a, b) => b.score - a.score);

    if (scoredPlans[0] && scoredPlans[0].score > 0) {
        return scoredPlans[0].plan;
    }

    return null;
}

async function generateTemporaryPlan(userId, targetMuscles, reason) {
    
    const existingTempPlan = await WorkoutPlan.findOne({
        userId,
        temporary: true
    });

    if (existingTempPlan) {
        return existingTempPlan;
    }

    const musclePartsMap = {
        'chest': ['upperChest', 'middleChest', 'lowerChest'],
        'back': ['backWidth', 'backMiddle', 'backLower'],
        'frontDelts': ['frontDelts'],
        'sideDelts': ['sideDelts'],
        'rearDelts': ['rearDelts'],
        'biceps': ['biceps'],
        'triceps': ['triceps'],
        'legs': ['quads', 'hamstrings', 'glutes', 'calves'],
        'core': ['upperAbs', 'lowerAbs', 'obliques']
    };

    const targetMuscleParts = [];
    for (const group of targetMuscles) {
        if (musclePartsMap[group]) {
            targetMuscleParts.push(...musclePartsMap[group]);
        }
    }

    const allExercises = await Exercise.find({});
    const matchingExercises = allExercises.filter(ex => {
        if (!ex.muscleEngagement) return false;
        return targetMuscleParts.some(musclePart =>
            (ex.muscleEngagement[musclePart] || 0) > 30
        );
    });

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

    const tempPlan = new WorkoutPlan({
        userId,
        name: `Trening Dopełniający - ${translateMuscleList(targetMuscles)}`,
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
