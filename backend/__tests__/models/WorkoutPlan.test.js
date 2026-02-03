const WorkoutPlan = require('../../models/WorkoutPlan');
const { createTestUser } = require('../setup');

describe('Model WorkoutPlan - Testy Jednostkowe', () => {

    let testUser;

    beforeEach(async () => {
        testUser = await createTestUser();
    });

    describe('Tworzenie planu', () => {
        test('powinien utworzyć plan z poprawnymi danymi', async () => {
            const planData = {
                userId: testUser._id,
                name: 'Test Plan',
                type: 'Własny',
                exercises: [],
            };

            const plan = await new WorkoutPlan(planData).save();

            expect(plan._id).toBeDefined();
            expect(plan.name).toBe(planData.name);
        });

        test('powinien wymagać userId i nazwy', async () => {
            const plan = new WorkoutPlan({});
            await expect(plan.save()).rejects.toThrow();
        });
    });

    describe('Typy planów', () => {
        test('powinien zaakceptować typ Szablon', async () => {
            const plan = await new WorkoutPlan({
                userId: testUser._id,
                name: 'Template',
                type: 'Szablon',
            }).save();

            expect(plan.type).toBe('Szablon');
        });

        test('powinien zaakceptować typ Własny', async () => {
            const plan = await new WorkoutPlan({
                userId: testUser._id,
                name: 'Custom',
                type: 'Własny',
            }).save();

            expect(plan.type).toBe('Własny');
        });

        test('powinien odrzucić niepoprawny typ', async () => {
            const plan = new WorkoutPlan({
                userId: testUser._id,
                name: 'Test',
                type: 'Invalid',
            });
            await expect(plan.save()).rejects.toThrow();
        });
    });

    describe('Flagi i właściwości', () => {
        test('powinien zapisać plan jako wygenerowany', async () => {
            const plan = await new WorkoutPlan({
                userId: testUser._id,
                name: 'Generated',
                isGenerated: true,
            }).save();

            expect(plan.isGenerated).toBe(true);
        });

        test('powinien zapisać plan jako tymczasowy', async () => {
            const plan = await new WorkoutPlan({
                userId: testUser._id,
                name: 'Temporary',
                temporary: true,
            }).save();

            expect(plan.temporary).toBe(true);
        });
    });
});
