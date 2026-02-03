const Workout = require('../../models/Workout');
const { createTestUser } = require('../setup');

describe('Model Workout - Testy Jednostkowe', () => {

    let testUser;

    beforeEach(async () => {
        testUser = await createTestUser();
    });

    describe('Walidacja pól wymaganych', () => {
        test('powinien utworzyć trening z poprawnymi danymi', async () => {
            const workoutData = {
                userId: testUser._id,
                name: 'Test Workout',
                date: '2026-01-31',
                time: '10:00',
                exercises: [],
            };

            const workout = await new Workout(workoutData).save();

            expect(workout._id).toBeDefined();
            expect(workout.name).toBe(workoutData.name);
            expect(workout.userId.toString()).toBe(testUser._id.toString());
        });

        test('powinien wymagać userId', async () => {
            const workout = new Workout({
                name: 'Test',
                date: '2026-01-31',
                time: '10:00',
            });
            await expect(workout.save()).rejects.toThrow();
        });

        test('powinien wymagać nazwy, daty i czasu', async () => {
            const workout = new Workout({ userId: testUser._id });
            await expect(workout.save()).rejects.toThrow();
        });
    });

    describe('Struktura ćwiczeń', () => {
        test('powinien zapisać trening z ćwiczeniami i seriami', async () => {
            const workout = await new Workout({
                userId: testUser._id,
                name: 'Test',
                date: '2026-01-31',
                time: '10:00',
                exercises: [
                    {
                        name: 'Bench Press',
                        numSets: 3,
                        sets: [
                            { weight: '80', reps: '10' },
                            { weight: '80', reps: '9' },
                            { weight: '80', reps: '8' },
                        ],
                    },
                ],
            }).save();

            expect(workout.exercises).toHaveLength(1);
            expect(workout.exercises[0].name).toBe('Bench Press');
            expect(workout.exercises[0].sets).toHaveLength(3);
        });

        test('powinien wymagać nazwy ćwiczenia', async () => {
            const workout = new Workout({
                userId: testUser._id,
                name: 'Test',
                date: '2026-01-31',
                time: '10:00',
                exercises: [{ numSets: 3, sets: [] }],
            });
            await expect(workout.save()).rejects.toThrow();
        });
    });

    describe('Typ treningu', () => {
        const validTypes = ['push', 'pull', 'legs', 'fullbody', 'other'];

        test('powinien zaakceptować poprawne typy', async () => {
            const workout = await new Workout({
                userId: testUser._id,
                name: 'Test',
                date: '2026-01-31',
                time: '10:00',
                type: 'push',
            }).save();

            expect(workout.type).toBe('push');
        });

        test('powinien odrzucić niepoprawny typ', async () => {
            const workout = new Workout({
                userId: testUser._id,
                name: 'Test',
                date: '2026-01-31',
                time: '10:00',
                type: 'invalid',
            });
            await expect(workout.save()).rejects.toThrow();
        });
    });
});
