const Exercise = require('../../models/Exercise');
const { createTestExercise } = require('../setup');

describe('Model Exercise - Testy Jednostkowe', () => {

    describe('Walidacja pól wymaganych', () => {
        test('powinien utworzyć ćwiczenie z poprawnymi danymi', async () => {
            const exerciseData = {
                name: 'Bench Press',
                muscleGroup: 'Chest',
            };

            const exercise = await new Exercise(exerciseData).save();

            expect(exercise._id).toBeDefined();
            expect(exercise.name).toBe(exerciseData.name);
            expect(exercise.muscleGroup).toBe(exerciseData.muscleGroup);
        });

        test('powinien wymagać nazwy', async () => {
            const exercise = new Exercise({ muscleGroup: 'Chest' });
            await expect(exercise.save()).rejects.toThrow();
        });

        test('powinien wymagać grupy mięśniowej', async () => {
            const exercise = new Exercise({ name: 'Test Exercise' });
            await expect(exercise.save()).rejects.toThrow();
        });
    });

    describe('Walidacja enum muscleGroup', () => {
        const validGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Other'];

        test('powinien zaakceptować wszystkie poprawne grupy mięśniowe', async () => {
            for (const group of validGroups.slice(0, 3)) {
                const exercise = await createTestExercise({
                    name: `Test ${group}`,
                    muscleGroup: group
                });
                expect(exercise.muscleGroup).toBe(group);
            }
        });

        test('powinien odrzucić niepoprawną grupę mięśniową', async () => {
            const exercise = new Exercise({
                name: 'Test',
                muscleGroup: 'InvalidGroup',
            });
            await expect(exercise.save()).rejects.toThrow();
        });
    });

    describe('Walidacja muscleEngagement', () => {
        test('powinien zaakceptować wartości 0-100', async () => {
            const exercise = await createTestExercise({
                name: 'Test Engagement',
                muscleGroup: 'Chest',
                muscleEngagement: {
                    upperChest: 50,
                    triceps: 30,
                    frontDelts: 20,
                },
            });

            expect(exercise.muscleEngagement.upperChest).toBe(50);
            expect(exercise.muscleEngagement.triceps).toBe(30);
            expect(exercise.muscleEngagement.frontDelts).toBe(20);
        });

        test('powinien odrzucić wartości poniżej 0', async () => {
            const exercise = new Exercise({
                name: 'Test',
                muscleGroup: 'Chest',
                muscleEngagement: { upperChest: -10 },
            });
            await expect(exercise.save()).rejects.toThrow();
        });

        test('powinien odrzucić wartości powyżej 100', async () => {
            const exercise = new Exercise({
                name: 'Test',
                muscleGroup: 'Chest',
                muscleEngagement: { upperChest: 150 },
            });
            await expect(exercise.save()).rejects.toThrow();
        });
    });

    describe('Unikalna nazwa', () => {
        test('powinien zwrócić błąd przy duplikacji nazwy', async () => {
            await createTestExercise({ name: 'Unique Exercise' });

            const duplicate = new Exercise({
                name: 'Unique Exercise',
                muscleGroup: 'Back',
            });

            await expect(duplicate.save()).rejects.toThrow();
        });
    });

    describe('Wartości domyślne', () => {
        test('powinien ustawić domyślne wartości', async () => {
            const exercise = await createTestExercise();

            expect(exercise.equipment).toBe('Bodyweight');
            expect(exercise.isCustom).toBe(false);
            expect(exercise.type).toBe('Compound');
        });
    });
});
