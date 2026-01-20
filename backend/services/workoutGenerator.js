const Exercise = require('../models/Exercise');
const { getPolishMuscleName } = require('../utils/translations');

// Mapowanie grup mięśniowych na typy treningu
const TRAINING_TYPES = {
    FBW: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'],
    PPL_PUSH: ['chest', 'shoulders_front', 'shoulders_side', 'triceps'],
    PPL_PULL: ['back', 'biceps', 'rear_delts'],
    PPL_LEGS: ['quads', 'hamstrings', 'glutes', 'calves']
};

// Ograniczenia bezpieczeństwa (objętość)
const LIMITS = {
    MAX_ENGAGEMENT: 600,
    MIN_ENGAGEMENT: 50,
    REST_PERIOD_HOURS: 48
};

// Współczynniki balansu mięśni antagonistycznych
const ANTAGONIST_RATIOS = {
    chest_to_back: { min: 0.5, max: 2.0 },
    front_delts_to_rear_delts: { min: 0.4, max: 2.5 },
    quads_to_hamstrings: { min: 0.4, max: 2.5 }
};

/**
 * Oblicz łączne zaangażowanie dla każdej części mięśnia
 * @param {Array} exercises - Lista ćwiczeń
 * @returns {Object} - Sumy zaangażowania
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
 * Oblicz zaangażowanie dla głównych grup mięśniowych (agregacja)
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
 * Sprawdź czy zaangażowanie mieści się w bezpiecznych granicach
 * @param {Object} engagement - Obiekt zaangażowania
 * @returns {Object} - { valid: boolean, warnings: [] }
 */
function validateSafetyLimits(engagement) {
    const warnings = [];
    const aggregate = getAggregateEngagement(engagement);

    Object.entries(aggregate).forEach(([muscle, total]) => {
        if (total > LIMITS.MAX_ENGAGEMENT) {
            warnings.push(`${getPolishMuscleName(muscle)}: partia przepracowana: ${total.toFixed(0)}% (max ${LIMITS.MAX_ENGAGEMENT}%)`);
        } else if (total > 0 && total < LIMITS.MIN_ENGAGEMENT) {
            warnings.push(`${getPolishMuscleName(muscle)}: partia niedotrenowana: ${total.toFixed(0)}% (min ${LIMITS.MIN_ENGAGEMENT}%)`);
        }
    });

    return {
        valid: warnings.length === 0,
        warnings,
        engagement: aggregate
    };
}

/**
 * Sprawdź balans między antagonistami
 */
function checkAntagonistBalance(engagement) {
    const warnings = [];
    const agg = getAggregateEngagement(engagement);

    // Stosunek Klatka / Plecy
    if (agg.chest > 0 && agg.back > 0) {
        const ratio = agg.chest / agg.back;
        if (ratio < ANTAGONIST_RATIOS.chest_to_back.min) {
            warnings.push(`Balans Klatka/Plecy: zbyt dużo pleców (${ratio.toFixed(2)}:1)`);
        } else if (ratio > ANTAGONIST_RATIOS.chest_to_back.max) {
            warnings.push(`Balans Klatka/Plecy: zbyt dużo klatki (${ratio.toFixed(2)}:1)`);
        }
    }

    // Przód / Tył barków
    if (engagement.frontDelts > 0 && engagement.rearDelts > 0) {
        const ratio = engagement.frontDelts / engagement.rearDelts;
        if (ratio < ANTAGONIST_RATIOS.front_delts_to_rear_delts.min) {
            warnings.push(`Balans Przód/Tył barków: zbyt dużo tyłu (${ratio.toFixed(2)}:1)`);
        } else if (ratio > ANTAGONIST_RATIOS.front_delts_to_rear_delts.max) {
            warnings.push(`Balans Przód/Tył barków: zbyt dużo przodu (${ratio.toFixed(2)}:1)`);
        }
    }

    // Czworogłowe / Dwugłowe
    if (engagement.quads > 0 && engagement.hamstrings > 0) {
        const ratio = engagement.quads / engagement.hamstrings;
        if (ratio < ANTAGONIST_RATIOS.quads_to_hamstrings.min) {
            warnings.push(`Balans Czworogłowe/Dwugłowe: zbyt dużo dwugłowych (${ratio.toFixed(2)}:1)`);
        } else if (ratio > ANTAGONIST_RATIOS.quads_to_hamstrings.max) {
            warnings.push(`Balans Czworogłowe/Dwugłowe: zbyt dużo czworogłowych (${ratio.toFixed(2)}:1)`);
        }
    }

    return {
        balanced: warnings.length === 0,
        warnings
    };
}

/**
 * Oceń ćwiczenie na podstawie dopasowania do celów
 * Promuje ćwiczenia wielostawowe (Compound) i wysoką efektywność
 */
function scoreExercise(exercise, targetMuscles) {
    let score = 0;

    // Bonus za wielostawy
    if (exercise.type === 'Compound') {
        score += 50;
    }

    // Dodaj % zaangażowania docelowych mięśni
    targetMuscles.forEach(muscle => {
        if (exercise.muscleEngagement && exercise.muscleEngagement[muscle]) {
            score += exercise.muscleEngagement[muscle];
        }
    });

    return score;
}

/**
 * Wygeneruj optymalny plan treningowy
 * @param {Array} targetMuscles - Celowane partie mięśniowe
 * @param {String} trainingType - Typ treningu (FBW, PPL...)
 * @param {Number} maxExercises - Maksymalna liczba ćwiczeń
 * @returns {Object} - Generated plan with exercises and analysis
 */
async function generateOptimalPlan(targetMuscles, trainingType = 'CUSTOM', maxExercises = 6) {
    try {
        // Pobierz wszystkie ćwiczenia
        const allExercises = await Exercise.find({});

        // Filtruj ćwiczenia, które angażują celowane mięśnie w znacznym stopniu (50%+)
        const PRIMARY_THRESHOLD = 50;
        let candidates = allExercises.filter(exercise => {
            if (!exercise.muscleEngagement) return false;

            // Sprawdź czy któryś z celowanych mięśni jest mocno angażowany
            return targetMuscles.some(muscle => {
                return (exercise.muscleEngagement[muscle] || 0) >= PRIMARY_THRESHOLD;
            });
        });

        // Oceń i posortuj kandydatów
        candidates = candidates.map(ex => ({
            exercise: ex,
            score: scoreExercise(ex, targetMuscles)
        }))
            .sort((a, b) => b.score - a.score);

        // Wybierz topowe ćwiczenia, dbając o różnorodność
        const selectedExercises = [];
        const usedExercises = new Set();

        // Przebieg 1: Najpierw najlepsze wielostawy
        for (const { exercise } of candidates) {
            if (selectedExercises.length >= maxExercises) break;
            if (usedExercises.has(exercise.name)) continue;

            if (exercise.type === 'Compound') {
                selectedExercises.push(exercise);
                usedExercises.add(exercise.name);
            }
        }

        // Przebieg 2: Dobierz izolacje jeśli trzeba
        for (const { exercise } of candidates) {
            if (selectedExercises.length >= maxExercises) break;
            if (usedExercises.has(exercise.name)) continue;

            if (exercise.type === 'Isolation') {
                selectedExercises.push(exercise);
                usedExercises.add(exercise.name);
            }
        }

        // Oblicz statystyki i waliduj plan
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
