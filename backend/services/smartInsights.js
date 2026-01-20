const Exercise = require('../models/Exercise');
const WorkoutPlan = require('../models/WorkoutPlan');
const Workout = require('../models/Workout');
const { translateMuscleList } = require('../utils/translations');

/**
 * Helper: Mapuje grupę mięśniową na konkretne partie z domyślnym zaangażowaniem.
 * Używane jako fallback, gdy brakuje szczegółowych danych o muscleEngagement.
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
 * Pobiera zaangażowanie mięśni z ćwiczenia, z fallbackiem do muscleGroup/secondaryMuscles.
 */
function getEffectiveEngagement(exerciseDef) {
    const engagement = {};

    // Sprawdź, czy muscleEngagement ma jakiekolwiek wartości niezerowe
    const hasDetailedEngagement = exerciseDef.muscleEngagement &&
        Object.values(exerciseDef.muscleEngagement).some(v => v > 0);

    if (hasDetailedEngagement) {
        // Użyj szczegółowego zaangażowania
        return exerciseDef.muscleEngagement;
    }

    // Fallback: użyj muscleGroup (80%) + secondaryMuscles (40%)
    if (exerciseDef.muscleGroup) {
        const primaryMuscles = getMusclePartsFromGroup(exerciseDef.muscleGroup);
        Object.assign(engagement, primaryMuscles);
    }

    if (exerciseDef.secondaryMuscles && Array.isArray(exerciseDef.secondaryMuscles)) {
        for (const secondaryEntry of exerciseDef.secondaryMuscles) {
            // Handle both old format (string) and new format ({ group, subMuscles })
            if (typeof secondaryEntry === 'string') {
                // Stary format: tylko nazwa grupy
                const secondaryMusclesParts = getMusclePartsFromGroup(secondaryEntry);
                for (const [muscle, _] of Object.entries(secondaryMusclesParts)) {
                    engagement[muscle] = 40;
                }
            } else if (secondaryEntry.group && secondaryEntry.subMuscles) {
                // Nowy format: { group, subMuscles: [subIds] }
                for (const subMuscleId of secondaryEntry.subMuscles) {
                    engagement[subMuscleId] = 40;
                }
            }
        }
    }

    return engagement;
}

/**
 * Analizuje historię treningową z ostatnich 7 dni.
 * Oblicza objętość (volume), częstotliwość i dni przerwy dla każdej partii mięśniowej.
 */
async function analyzeTrainingHistory(userId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Format YYYY-MM-DD, aby pasował do dat zapisanych w bazie jako stringi
    const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];

    // Pobierz treningi z ostatnich 7 dni
    // Uwaga: pole date jest stringiem (YYYY-MM-DD), więc porównujemy stringi
    const workouts = await Workout.find({
        userId,
        date: { $gte: sevenDaysAgoString }
    }).sort({ date: -1 });

    // Inicjalizacja statystyk mięśniowych
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

    // Przetwórz każdy trening
    for (const workout of workouts) {
        for (const exercise of workout.exercises) {
            // Pobierz definicję ćwiczenia
            const exerciseDef = await Exercise.findOne({ name: exercise.name });
            if (!exerciseDef) continue;

            // Pobierz skuteczne zaangażowanie (szczegółowe lub fallback)
            const engagement = getEffectiveEngagement(exerciseDef);
            if (Object.keys(engagement).length === 0) continue;

            // Oblicz całkowitą objętość dla tego ćwiczenia (ciężar × powtórzenia × serie)
            let exerciseVolume = 0;
            let hasAnyWork = false;
            for (const set of exercise.sets) {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseFloat(set.reps) || 0;

                if (reps > 0) {
                    hasAnyWork = true;
                    // Dla ćwiczeń z masą własną (ciężar=0) używamy powtórzeń jako objętości
                    // Dla ćwiczeń z ciężarem: ciężar × powtórzenia
                    exerciseVolume += weight > 0 ? (weight * reps) : reps;
                }
            }

            // Pomiń ćwiczenia, gdzie nie wykonano pracy (ciężar i powtórzenia = 0)
            if (!hasAnyWork) continue;

            // Rozdziel objętość na zaangażowane mięśnie
            for (const [muscle, engagementPercent] of Object.entries(engagement)) {
                if (engagementPercent > 0 && muscleStats[muscle]) {
                    // Objętość ważona procentem zaangażowania
                    muscleStats[muscle].volume += (exerciseVolume * engagementPercent) / 100;

                    // Zaktualizuj datę ostatniego treningu
                    if (!muscleStats[muscle].lastTrained || workout.date > muscleStats[muscle].lastTrained) {
                        muscleStats[muscle].lastTrained = workout.date;
                    }
                }
            }
        }
    }

    // Oblicz częstotliwość (ile różnych dni trenowano dany mięsień)
    for (const workout of workouts) {
        const workoutDate = workout.date; // Już jest stringiem (YYYY-MM-DD)
        const musclesTrainedToday = new Set();

        for (const exercise of workout.exercises) {
            const exerciseDef = await Exercise.findOne({ name: exercise.name });
            if (!exerciseDef) continue;

            // Pobierz skuteczne zaangażowanie
            const engagement = getEffectiveEngagement(exerciseDef);
            if (Object.keys(engagement).length === 0) continue;

            // Oblicz objętość dla tego ćwiczenia
            let hasAnyWork = false;
            for (const set of exercise.sets) {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseFloat(set.reps) || 0;

                if (reps > 0) {
                    hasAnyWork = true;
                    break;
                }
            }

            // Licz tylko jeśli wykonano jakąkolwiek pracę
            if (!hasAnyWork) continue;

            for (const [muscle, engagementPercent] of Object.entries(engagement)) {
                if (engagementPercent > 0 && muscleStats[muscle]) {
                    musclesTrainedToday.add(muscle);
                }
            }
        }

        // Zwiększ licznik częstotliwości dla każdego trenowanego dzisiaj mięśnia
        for (const muscle of musclesTrainedToday) {
            muscleStats[muscle].frequency++;
        }
    }

    return { muscleStats, workoutCount: workouts.length };
}

/**
 * Klasyfikuje mięśnie do kategorii na podstawie statusu treningowego.
 */
function identifyMuscleStatus(muscleStats) {
    const now = new Date();
    const status = {
        overtrained: [],
        undertrained: [],
        ready: [],
        rested: []
    };

    // Agreguj do głównych grup mięśniowych dla łatwiejszej analizy
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

    // Sklasyfikuj każdą główną grupę mięśniową
    for (const [group, stats] of Object.entries(aggregated)) {
        const daysSinceLastTrained = stats.lastTrained
            ? Math.floor((now - new Date(stats.lastTrained)) / (1000 * 60 * 60 * 24))
            : 999;

        // Przetrenowane: bardzo wysoka częstotliwość (5+ razy/tydzień) LUB wysoka częstotliwość z niedawnym treningiem
        if (stats.frequency >= 5 || (stats.frequency >= 3 && daysSinceLastTrained < 1)) {
            status.overtrained.push(group);
        }
        // Niedotrenowane: nie trenowane wcale w ciągu ostatnich 7 dni
        else if (stats.volume === 0 || daysSinceLastTrained >= 7) {
            status.undertrained.push(group);
        }
        // Wypoczęte: 3-6 dni od ostatniego treningu (gotowe na ciężką pracę)
        else if (daysSinceLastTrained >= 3 && daysSinceLastTrained < 7) {
            status.rested.push(group);
        }
        // Gotowe: 1-2 dni odpoczynku (można trenować, ale nie priorytet)
        else {
            status.ready.push(group);
        }
    }

    return { status, aggregated };
}

/**
 * Generuje rekomendację treningową na podstawie statusu mięśni.
 */
async function generateRecommendation(userId, muscleStatus) {
    const { status, aggregated } = muscleStatus;

    // Oblicz, które mięśnie były trenowane dzisiaj LUB wczoraj (zasada 48h regeneracji)
    // ULEPSZONE: Użyj progów specyficznych dla mięśni
    // Duże grupy (nogi, plecy) potrzebują znacznie większej objętości, aby zostać "zablokowane"
    // Małe grupy (ramiona, barki) potrzebują mniej
    const getVolumeThreshold = (muscle) => {
        const thresholds = {
            'legs': 8000,      // Nogi potrzebują dużej objętości, aby być naprawdę przetrenowane
            'back': 8000,      // Plecy również potrzebują dużej objętości
            'chest': 5000,     // Klatka średnio-dużo
            'shoulders': 4000, // Barki średnio
            'arms': 3000,      // Ramiona mniej
            'core': 3000       // Brzuch/Core mniej
        };
        return thresholds[muscle] || 5000; // Domyślnie dla nieznanych
    };

    const now = new Date();
    const blockedMuscles = [];

    for (const [muscle, stats] of Object.entries(aggregated)) {
        if (stats.lastTrained) {
            const daysSince = Math.floor((now - new Date(stats.lastTrained)) / (1000 * 60 * 60 * 24));
            const threshold = getVolumeThreshold(muscle);

            // Zablokuj, jeśli trenowane dzisiaj (dni=0) LUB wczoraj (dni=1)
            // To zapewnia minimum 48h przerwy między tymi samymi partiami
            if (daysSince <= 1 && stats.volume >= threshold) {
                blockedMuscles.push(muscle);
            }
        }
    }

    // Helper: Odfiltruj mięśnie trenowane ciężko w ciągu ostatnich 48h
    // Mięśnie pomocnicze (mała objętość) nie blokują rekomendacji
    const getMusclesNotTrainedRecently = (muscles) => {
        return muscles.filter(muscle => {
            const stats = aggregated[muscle];
            if (!stats || !stats.lastTrained) return true;

            const daysSince = Math.floor((now - new Date(stats.lastTrained)) / (1000 * 60 * 60 * 24));

            // Jeśli 2+ dni temu, są dostępne (48h odpoczynku)
            if (daysSince >= 2) return true;

            // Jeśli trenowane niedawno (dziś/wczoraj), ale mała objętość (praca pomocnicza), nadal dostępne
            const threshold = getVolumeThreshold(muscle);
            return stats.volume < threshold;
        });
    };



    // Priorytet 1: Jeśli główne grupy mięśniowe są niedotrenowane, sugeruj je
    if (status.undertrained.length > 0) {
        // ULEPSZONE: Wybierz JEDNĄ główną niedotrenowaną partię, a nie wszystkie
        // Zapobiega to łączeniu "nogi + plecy", nawet jeśli obie są niedotrenowane
        const majorUndertrainedGroups = ['legs', 'chest', 'back', 'shoulders'];
        const minorUndertrainedGroups = ['arms', 'core'];

        // Znajdź niedotrenowaną partię o najwyższym priorytecie
        const primaryUndertrained = status.undertrained.find(m => majorUndertrainedGroups.includes(m));

        let targetMuscles = [];
        if (primaryUndertrained) {
            targetMuscles = [primaryUndertrained];

            // Opcjonalnie dodaj kompatybilną mniejszą partię
            const compatibleMinor = status.undertrained.find(m =>
                minorUndertrainedGroups.includes(m) && !targetMuscles.includes(m)
            );
            if (compatibleMinor) {
                targetMuscles.push(compatibleMinor);
            }
        } else {
            // Tylko mniejsze partie są niedotrenowane
            targetMuscles = status.undertrained.slice(0, 2);
        }

        const plan = await findMatchingPlan(userId, targetMuscles, muscleStatus, blockedMuscles);

        if (plan) {
            return {
                type: 'existing_plan',
                plan: plan,
                reason: `Następujące partie mięśniowe wymagają treningu: ${translateMuscleList(targetMuscles)}. Sugerujemy plan "${plan.name}".`,
                muscleGroups: targetMuscles
            };
        } else {
            // Wygeneruj plan tymczasowy
            const tempPlan = await generateTemporaryPlan(userId, targetMuscles, 'undertrained');
            return {
                type: 'temporary_plan',
                plan: tempPlan,
                reason: `Wygenerowaliśmy plan dopełniający dla: ${translateMuscleList(targetMuscles)}.`,
                muscleGroups: targetMuscles
            };
        }
    }


    // Priorytet 2: Trenuj wypoczęte mięśnie (3+ dni)
    const restedNotToday = getMusclesNotTrainedRecently(status.rested);
    if (restedNotToday.length > 0) {
        // ULEPSZONE: Wybierz JEDNĄ główną wypoczętą partię
        const majorRestedGroups = ['legs', 'chest', 'back', 'shoulders'];
        const minorRestedGroups = ['arms', 'core'];

        // Znajdź wypoczętą partię o najwyższym priorytecie
        const primaryRested = restedNotToday.find(m => majorRestedGroups.includes(m));

        let targetMuscles = [];
        if (primaryRested) {
            targetMuscles = [primaryRested];

            // Optionally add a compatible minor muscle
            const compatibleMinor = restedNotToday.find(m =>
                minorRestedGroups.includes(m) && !targetMuscles.includes(m)
            );
            if (compatibleMinor) {
                targetMuscles.push(compatibleMinor);
            }
        } else {
            // Only minor muscles are rested
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

    // Priority 3: Ready muscles (1-2 days rest) but NOT trained heavily today
    const readyNotToday = getMusclesNotTrainedRecently(status.ready);
    const availableMuscles = [...readyNotToday, ...restedNotToday].filter(m => !status.overtrained.includes(m));

    console.log('DEBUG - Ready muscles:', status.ready);
    console.log('DEBUG - Rested muscles:', status.rested);
    console.log('DEBUG - Available muscles after filter:', availableMuscles);
    console.log('DEBUG - Blocked muscles:', blockedMuscles);

    if (availableMuscles.length > 0) {
        // LOGIKA ROTACJI: Preferuj grupy mięśniowe trenowane najdawniej
        // Zapobiega: Push Pon -> Odpoczynek Wt -> Push Śr (bez Pull/Legs)

        // Zdefiniuj priorytety głównych grup mięśniowych (dla splitu PPL)
        const majorGroups = ['legs', 'chest', 'back', 'shoulders'];
        const getMajorPriority = (muscle) => {
            if (muscle === 'legs') return 0; // Highest priority
            if (muscle === 'chest' || muscle === 'back') return 1;
            if (muscle === 'shoulders') return 2;
            if (muscle === 'arms') return 3;
            return 4; // core itp - najniższy priorytet
        };

        const musclesByRecency = availableMuscles.map(muscle => ({
            muscle,
            daysSince: aggregated[muscle]?.lastTrained
                ? Math.floor((now - new Date(aggregated[muscle].lastTrained)) / (1000 * 60 * 60 * 24))
                : 999,
            volume: aggregated[muscle]?.volume || 0,
            priority: getMajorPriority(muscle)
        })).sort((a, b) => {
            // Sortowanie główne: Główne grupy mięśniowe najpierw (nogi, klatka, plecy, barki przed ramionami/corem)
            if (a.priority !== b.priority) return a.priority - b.priority;
            // Sortowanie drugorzędne: Najstarsze najpierw (najwięcej dni od treningu)
            if (b.daysSince !== a.daysSince) return b.daysSince - a.daysSince;
            // Rozstrzyganie remisów: Najniższa objętość najpierw (najmniej trenowane = priorytet)
            return a.volume - b.volume;
        });

        console.log('DEBUG - Muscles by recency:', musclesByRecency);

        // ULEPSZONA LOGIKA: Wybierz JEDNĄ główną grupę mięśniową (nogi, klatka, plecy, barki)
        // i opcjonalnie połącz z mniejszymi grupami (ramiona, core)
        // To zapobiega łączeniu nogi + plecy w jeden trening
        const primaryMajorGroups = ['legs', 'chest', 'back', 'shoulders'];
        const minorGroups = ['arms', 'core'];

        // Znajdź główną grupę o najwyższym priorytecie
        const primaryMuscle = musclesByRecency.find(m => primaryMajorGroups.includes(m.muscle));

        let targetMuscles = [];
        if (primaryMuscle) {
            targetMuscles = [primaryMuscle.muscle];

            // Opcjonalnie dodaj kompatybilną mniejszą grupę
            const compatibleMinor = musclesByRecency.find(m =>
                minorGroups.includes(m.muscle) && !targetMuscles.includes(m.muscle)
            );
            if (compatibleMinor) {
                targetMuscles.push(compatibleMinor.muscle);
            }
        } else {
            // Jeśli brak głównych grup, weź 2 czołowe mniejsze domyślnie
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
        // FALLBACK: Wygeneruj plan, jeśli żaden istniejący nie pasuje
        const workoutGenerator = require('./workoutGenerator');

        // Mapuj grupy mięśniowe na konkretne partie dla generatora
        const muscleGroupToParts = {
            'legs': ['quads', 'hamstrings', 'glutes', 'calves'],
            'back': ['backWidth', 'backMiddle', 'backLower'],
            'chest': ['upperChest', 'middleChest', 'lowerChest'],
            'shoulders': ['frontDelts', 'sideDelts', 'rearDelts'],
            'arms': ['biceps', 'triceps', 'forearms'],
            'core': ['upperAbs', 'lowerAbs', 'obliques']
        };

        // Konwertuj nazwy grup na partie mięśniowe
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

    // Fallback: zasugeruj odpoczynek lub lekki trening
    return {
        type: 'rest',
        reason: 'Większość mięśni jest przetrenowana. Zalecamy dzień odpoczynku lub lekki trening regeneracyjny.',
        muscleGroups: []
    };
}

/**
 * Znajduje plan treningowy pasujący do docelowych mięśni i unikający tych przetrenowanych.
 * @param {string} userId - ID użytkownika
 * @param {Array} targetMuscles - Mięśnie, które chcemy trenować
 * @param {Object} muscleStatus - Status z przetrenowanymi/niedotrenowanymi/wypoczętymi/gotowymi
 * @param {Array} blockedMuscles - Mięśnie trenowane ciężko dzisiaj (te należy POMIJAĆ)
 */
async function findMatchingPlan(userId, targetMuscles, muscleStatus, blockedMuscles = []) {
    const plans = await WorkoutPlan.find({
        userId,
        temporary: { $ne: true } // Tylko stałe plany
    });

    if (plans.length === 0) return null;

    const { overtrained = [], undertrained = [], rested = [] } = muscleStatus?.status || {};

    // Mapuj grupy mięśniowe na słowa kluczowe w nazwach planów
    const muscleMap = {
        'chest': ['push', 'chest', 'klatka'],
        'back': ['pull', 'back', 'plecy'],
        'shoulders': ['push', 'shoulders', 'barki'],
        'arms': ['push', 'pull', 'arms', 'ramiona'],
        'legs': ['legs', 'nogi'],
        'core': ['core', 'abs', 'brzuch']
    };

    // Oceń każdy plan na podstawie tego, jak dobrze pasuje do rekomendacji
    const scoredPlans = plans.map(plan => {
        const planNameLower = plan.name.toLowerCase();
        let score = 0;

        // Sprawdź, które grupy mięśniowe ten plan obejmuje
        const planTargets = [];
        for (const [muscle, keywords] of Object.entries(muscleMap)) {
            if (keywords.some(kw => planNameLower.includes(kw))) {
                planTargets.push(muscle);
            }
        }

        // CIĘŻKA KARA: Plan celuje w zablokowane mięśnie (trenowane ciężko dzisiaj)
        const blockedCount = planTargets.filter(m => blockedMuscles.includes(m)).length;
        score -= blockedCount * 500; // Bardzo wysoka kara, aby je wykluczyć

        // KARA: Plan celuje w przetrenowane mięśnie (chcemy ich unikać)
        const overtrainedCount = planTargets.filter(m => overtrained.includes(m)).length;
        score -= overtrainedCount * 100;

        // BONUS: Plan celuje w niedotrenowane mięśnie (chcemy ich)
        const undertrainedCount = planTargets.filter(m => undertrained.includes(m)).length;
        score += undertrainedCount * 50;

        // BONUS: Plan celuje w wypoczęte mięśnie (dobre do treningu)
        const restedCount = planTargets.filter(m => rested.includes(m)).length;
        score += restedCount * 30;

        // BONUS: Plan celuje w żądane mięśnie
        const targetCount = planTargets.filter(m => targetMuscles.includes(m)).length;
        score += targetCount * 20;

        return { plan, score, targets: planTargets };
    });

    // Sortuj po wyniku (najwyższy pierwszy)
    scoredPlans.sort((a, b) => b.score - a.score);

    // Zwróć najlepszy plan, jeśli ma wynik dodatni
    if (scoredPlans[0] && scoredPlans[0].score > 0) {
        return scoredPlans[0].plan;
    }

    return null;
}

/**
 * Generuje tymczasowy plan treningowy dla określonych grup mięśniowych.
 */
async function generateTemporaryPlan(userId, targetMuscles, reason) {
    // Sprawdź, czy tymczasowy plan już istnieje dla tego użytkownika
    const existingTempPlan = await WorkoutPlan.findOne({
        userId,
        temporary: true
    });

    // Jeśli istnieje, zwróć go zamiast tworzyć nowy
    if (existingTempPlan) {
        return existingTempPlan;
    }

    // Mapuj grupy mięśniowe na konkretne partie do wyboru ćwiczeń
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

    // Znajdź ćwiczenia, które celują w te mięśnie
    const allExercises = await Exercise.find({});
    const matchingExercises = allExercises.filter(ex => {
        if (!ex.muscleEngagement) return false;
        return targetMuscleParts.some(musclePart =>
            (ex.muscleEngagement[musclePart] || 0) > 30
        );
    });

    // Wybierz top 5-6 ćwiczeń (priorytet dla złożonych)
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

    // Utwórz plan tymczasowy
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
