const Progress = require('../../models/Progress');
const { createTestUser } = require('../setup');

/**
 * Testy jednostkowe modelu Progress (White-box testing)
 */
describe('Model Progress - Testy Jednostkowe', () => {

    let testUser;

    beforeEach(async () => {
        testUser = await createTestUser();
    });

    describe('Tworzenie dokumentu postępu', () => {
        test('powinien utworzyć dokument postępu', async () => {
            const progress = await new Progress({
                userId: testUser._id,
            }).save();

            expect(progress._id).toBeDefined();
            expect(progress.userId.toString()).toBe(testUser._id.toString());
        });

        test('powinien wymagać userId', async () => {
            const progress = new Progress({});
            await expect(progress.save()).rejects.toThrow();
        });
    });

    describe('Historia wagi', () => {
        test('powinien dodać pomiar wagi', async () => {
            const progress = await new Progress({
                userId: testUser._id,
                weight: [
                    { date: '2026-01-31', weight: 75.5 },
                ],
            }).save();

            expect(progress.weight).toHaveLength(1);
            expect(progress.weight[0].weight).toBe(75.5);
            expect(progress.weight[0].timestamp).toBeDefined();
        });

        test('powinien dodać wiele pomiarów', async () => {
            const progress = await new Progress({
                userId: testUser._id,
                weight: [
                    { date: '2026-01-30', weight: 76 },
                    { date: '2026-01-31', weight: 75.5 },
                ],
            }).save();

            expect(progress.weight).toHaveLength(2);
        });
    });

    describe('Wymiary ciała', () => {
        test('powinien zapisać wymiary', async () => {
            const measurements = {
                chest: 100,
                waist: 85,
                biceps: 38,
                thighs: 60,
            };

            const progress = await new Progress({
                userId: testUser._id,
                measurements,
            }).save();

            expect(progress.measurements.chest).toBe(100);
            expect(progress.measurements.waist).toBe(85);
        });

        test('powinien zapisać historię wymiarów', async () => {
            const progress = await new Progress({
                userId: testUser._id,
                measurementsHistory: [
                    {
                        date: '2026-01-31',
                        measurements: { chest: 100, waist: 85 },
                    },
                ],
            }).save();

            expect(progress.measurementsHistory).toHaveLength(1);
        });
    });

    describe('Cel wagowy', () => {
        test('powinien ustawić wagę docelową', async () => {
            const progress = await new Progress({
                userId: testUser._id,
                targetWeight: 70,
            }).save();

            expect(progress.targetWeight).toBe(70);
        });
    });
});
