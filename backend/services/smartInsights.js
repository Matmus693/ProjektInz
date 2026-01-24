const Exercise = require('../models/Exercise');
const WorkoutPlan = require('../models/WorkoutPlan');
const Workout = require('../models/Workout');
const { translateMuscleList } = require('../utils/translations');

/**
 * Volume landmarks based on Mike Israetel's research.
 * MV = Maintenance Volume, MEV = Minimum Effective Volume,
 * MAV = Maximum Adaptive Volume, MRV = Maximum Recoverable Volume
 * All values are in SETS PER WEEK.
 */
const VOLUME_LANDMARKS = {
    chest: { mv: 6, mev: 10, mavMin: 12, mavMax: 18, mrv: 22 },
    back: { mv: 8, mev: 10, mavMin: 14, mavMax: 22, mrv: 26 },
    // Barki: 3 osobne grupy
    frontDelts: { mv: 3, mev: 5, mavMin: 8, mavMax: 14, mrv: 18 },  // Przód = Push
    sideDelts: { mv: 3, mev: 5, mavMin: 8, mavMax: 14, mrv: 18 },   // Bok = Push
    rearDelts: { mv: 3, mev: 5, mavMin: 6, mavMax: 10, mrv: 14 },   // Tył = Pull (wrażliwe)
    // Ramiona osobno
    biceps: { mv: 3, mev: 5, mavMin: 8, mavMax: 14, mrv: 18 },
    triceps: { mv: 3, mev: 5, mavMin: 8, mavMax: 14, mrv: 18 },
    // Inne
    legs: { mv: 6, mev: 8, mavMin: 12, mavMax: 18, mrv: 20 },
    core: { mv: 4, mev: 8, mavMin: 12, mavMax: 20, mrv: 25 }
};

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

/**
 * Analizuje historię treningową z ostatnich 7 dni.
 * Oblicza objętość (volume), częstotliwość i dni przerwy dla każdej partii mięśniowej.
 */
async function analyzeTrainingHistory(userId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];
    const workouts = await Workout.find({
        userId,
        date: { $gte: sevenDaysAgoString }
    }).sort({ date: -1 });

    // Inicjalizacja statystyk mięśniowych (teraz liczymy serie zamiast objętości)
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

    // Przetwórz każdy trening
    for (const workout of workouts) {
        for (const exercise of workout.exercises) {
            // Pobierz definicję ćwiczenia
            const exerciseDef = await Exercise.findOne({ name: exercise.name });
            if (!exerciseDef) continue;

            // Pobierz skuteczne zaangażowanie (szczegółowe lub fallback)
            const engagement = getEffectiveEngagement(exerciseDef);
            if (Object.keys(engagement).length === 0) continue;

            // Policz efektywne serie (zamiast obliczać volume = weight × reps)
            let effectiveSets = 0;
            let hasAnyWork = false;
            for (const set of exercise.sets) {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseFloat(set.reps) || 0;

                // Seria liczy się jako efektywna, jeśli ma przynajmniej 1 powtórzenie
                // Obejmuje: trening siłowy (1-5), hipertrofia (6-12), wytrzymałość (15+)
                if (reps >= 1 && reps <= 50) {
                    hasAnyWork = true;
                    effectiveSets++;
                }
            }

            // Pomiń ćwiczenia, gdzie nie wykonano pracy
            if (!hasAnyWork || effectiveSets === 0) continue;

            // Przypisz serie do mięśni z wagami na podstawie zaangażowania
            for (const [muscle, engagementPercent] of Object.entries(engagement)) {
                if (engagementPercent > 0 && muscleStats[muscle]) {
                    // Ważone liczenie serii:
                    // - Wysokie zaangażowanie (≥50%): pełna seria
                    // - Średnie zaangażowanie (30-49%): połowa serii
                    // - Niskie zaangażowanie (<30%): proporcjonalnie
                    const setContribution = engagementPercent >= 50
                        ? effectiveSets
                        : engagementPercent >= 30
                            ? effectiveSets * 0.5
                            : effectiveSets * (engagementPercent / 100);

                    muscleStats[muscle].sets += setContribution;

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
    // WAŻNE: Biceps i Triceps osobno (nie łączone w "arms") dla prawidłowej synergii Pull/Push
    // WAŻNE: Barki - 3 osobne grupy (front, side, rear)
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
        // BARKI: 3 OSOBNE GRUPY
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
        // BICEPS i TRICEPS OSOBNO
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

    // Sklasyfikuj każdą główną grupę mięśniową na podstawie liczby serii i MEV/MAV/MRV
    for (const [group, stats] of Object.entries(aggregated)) {
        const daysSinceLastTrained = stats.lastTrained
            ? Math.floor((now - new Date(stats.lastTrained)) / (1000 * 60 * 60 * 24))
            : 999;

        const landmarks = VOLUME_LANDMARKS[group];
        if (!landmarks) {
            // Fallback dla grup bez zdefiniowanych landmarków
            if (daysSinceLastTrained >= 7 || stats.sets === 0) {
                status.undertrained.push(group);
            } else if (daysSinceLastTrained >= 3) {
                status.rested.push(group);
            } else {
                status.ready.push(group);
            }
            continue;
        }

        // Przetrenowane: Powyżej MRV LUB wysoka częstotliwość z niedawnym treningiem
        if (stats.sets > landmarks.mrv || (stats.frequency >= 3 && daysSinceLastTrained < 1)) {
            status.overtrained.push(group);
        }
        // Niedotrenowane: Poniżej MEV i długi czas od ostatniego treningu
        else if (stats.sets < landmarks.mev && daysSinceLastTrained >= 7) {
            status.undertrained.push(group);
        }
        // Wypoczęte: Osiągnięto przynajmniej MEV i 3+ dni odpoczynku
        else if (stats.sets >= landmarks.mev && daysSinceLastTrained >= 3 && daysSinceLastTrained < 7) {
            status.rested.push(group);
        }
        // Gotowe: 1-2 dni odpoczynku, ale nie przetrenowane
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


    const now = new Date();
    const blockedMuscles = [];

    console.log('\n=== MUSCLE STATUS ANALYSIS ===');
    // Zablokuj mięśnie trenowane w ostatnich 48h z wystarczającą objętością (≥ MAV minimum)
    for (const [muscle, stats] of Object.entries(aggregated)) {
        if (stats.lastTrained) {
            const daysSince = Math.floor((now - new Date(stats.lastTrained)) / (1000 * 60 * 60 * 24));
            const landmarks = VOLUME_LANDMARKS[muscle];

            console.log(`${muscle}: ${stats.sets} sets, ${daysSince} days ago, MAV min: ${landmarks?.mavMin}`);

            // Blokuj jeśli trenowane niedawno (≤1 dzień) i osiągnięto przynajmniej MAV minimum
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

            // Jeśli 2+ dni temu, są dostępne (48h odpoczynku)
            if (daysSince >= 2) return true;

            // Jeśli trenowane niedawno (dziś/wczoraj), ale poniżej MAV minimum (praca pomocnicza), nadal dostępne
            const landmarks = VOLUME_LANDMARKS[muscle];
            return landmarks && stats.sets < landmarks.mavMin;
        });
    };

    /**
     * Funkcja pomocnicza: Dobiera synergiczne mięśnie zgodnie z zasadami Pull/Push/Legs
     * @param {string} primaryMuscle - Główna partia (chest, back, legs, frontDelts, sideDelts, rearDelts)
     * @param {Array} availableMinor - Dostępne mniejsze/pomocnicze partie
     * @returns {Array} - Lista zgodnych mięśni do dodania
     */
    const getSynergisticMuscles = (primaryMuscle, availableMinor) => {
        // PULL (Ciąganie): Plecy + BICEPS + TYLNE BARKI
        if (primaryMuscle === 'back') {
            return availableMinor.filter(m => m === 'biceps' || m === 'rearDelts');
        }

        // PULL: Tylne barki jako główna + BICEPS
        if (primaryMuscle === 'rearDelts') {
            return availableMinor.filter(m => m === 'biceps');
        }

        // PUSH (Pchanie): Klatka + TRICEPS + PRZEDNIE BARKI + BOCZNE BARKI
        if (primaryMuscle === 'chest') {
            return availableMinor.filter(m => m === 'triceps' || m === 'frontDelts' || m === 'sideDelts');
        }

        // PUSH: Przednie barki jako główna + TRICEPS + BOCZNE BARKI
        if (primaryMuscle === 'frontDelts') {
            return availableMinor.filter(m => m === 'triceps' || m === 'sideDelts');
        }

        // PUSH: Boczne barki jako główna + TRICEPS + PRZEDNIE BARKI
        if (primaryMuscle === 'sideDelts') {
            return availableMinor.filter(m => m === 'triceps' || m === 'frontDelts');
        }

        // LEGS: Nogi + Core
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

            // NOWA LOGIKA: Dodaj synergiczne mięśnie zgodnie z Pull/Push/Legs
            const minorUndertrained = status.undertrained.filter(m => minorUndertrainedGroups.includes(m));
            console.log('Minor undertrained available:', minorUndertrained);

            const synergistic = getSynergisticMuscles(primaryUndertrained, minorUndertrained);
            console.log('Synergistic muscles for', primaryUndertrained, ':', synergistic);

            if (synergistic.length > 0) {
                targetMuscles.push(synergistic[0]); // Dodaj pierwszą synergiczną partię
            }
        } else {
            // Tylko mniejsze partie są niedotrenowane
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
        const majorRestedGroups = ['legs', 'chest', 'back', 'frontDelts', 'sideDelts', 'rearDelts'];
        const minorRestedGroups = ['biceps', 'triceps', 'core'];

        // Znajdź wypoczętą partię o najwyższym priorytecie
        const primaryRested = restedNotToday.find(m => majorRestedGroups.includes(m));

        let targetMuscles = [];
        if (primaryRested) {
            targetMuscles = [primaryRested];

            // NOWA LOGIKA: Dodaj synergiczne mięśnie zgodnie z Pull/Push/Legs
            const minorRested = restedNotToday.filter(m => minorRestedGroups.includes(m));
            const synergistic = getSynergisticMuscles(primaryRested, minorRested);

            if (synergistic.length > 0) {
                targetMuscles.push(synergistic[0]); // Dodaj pierwszą synergiczną partię
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
            if (muscle === 'legs') return 0;
            if (muscle === 'chest' || muscle === 'back') return 1;
            if (muscle === 'frontDelts' || muscle === 'sideDelts' || muscle === 'rearDelts') return 2; // 3 osobne barki
            if (muscle === 'biceps' || muscle === 'triceps') return 3;
            return 4; // core
        };

        const musclesByRecency = availableMuscles.map(muscle => ({
            muscle,
            daysSince: aggregated[muscle]?.lastTrained
                ? Math.floor((now - new Date(aggregated[muscle].lastTrained)) / (1000 * 60 * 60 * 24))
                : 999,
            sets: aggregated[muscle]?.sets || 0,
            priority: getMajorPriority(muscle)
        })).sort((a, b) => {
            // KLUCZOWA ZMIANA DLA ROTACJI:
            // 1. Sortowanie GŁÓWNE: Najdłużej od ostatniego treningu (największy daysSince)
            //    To zapewnia rotację: chest -> back -> legs zamiast zawsze tego samego
            if (b.daysSince !== a.daysSince) return b.daysSince - a.daysSince;

            // 2. Sortowanie DRUGORZĘDNE: Główne grupy przed pomocniczymi
            //    (tylko dla mięśni z tym samym czasem od ostatniego treningu)
            if (a.priority !== b.priority) return a.priority - b.priority;

            // 3. Rozstrzyganie remisów: Najmniej serii
            return a.sets - b.sets;
        });

        console.log('DEBUG - Muscles by recency:', musclesByRecency);

        // ULEPSZONA LOGIKA: Wybierz JEDNĄ główną grupę mięśniową (nogi, klatka, plecy, barki)
        // i opcjonalnie połącz z mniejszymi grupami (ramiona, core)
        // To zapobiega łączeniu nogi + plecy w jeden trening
        const primaryMajorGroups = ['legs', 'chest', 'back', 'frontDelts', 'sideDelts', 'rearDelts'];
        const minorGroups = ['biceps', 'triceps', 'core'];

        // Znajdź główną grupę o najwyższym priorytecie
        const primaryMuscle = musclesByRecency.find(m => primaryMajorGroups.includes(m.muscle));

        let targetMuscles = [];
        if (primaryMuscle) {
            targetMuscles = [primaryMuscle.muscle];

            // NOWA LOGIKA: Dodaj synergiczne mięśnie zgodnie z Pull/Push/Legs
            const minorAvailable = musclesByRecency
                .filter(m => minorGroups.includes(m.muscle))
                .map(m => m.muscle);
            const synergistic = getSynergisticMuscles(primaryMuscle.muscle, minorAvailable);

            if (synergistic.length > 0) {
                targetMuscles.push(synergistic[0]); // Dodaj pierwszą synergiczną partię
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
        'frontDelts': ['push', 'front', 'przod', 'shoulders'],  // Przód = Push
        'sideDelts': ['push', 'side', 'bok', 'shoulders'],   // Bok = Push
        'rearDelts': ['pull', 'rear', 'tylne'],  // Tył = Pull
        'biceps': ['pull', 'biceps'],
        'triceps': ['push', 'triceps'],
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
        'frontDelts': ['frontDelts'],  // Przód osobno
        'sideDelts': ['sideDelts'],   // Bok osobno
        'rearDelts': ['rearDelts'],   // Tył osobno
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
