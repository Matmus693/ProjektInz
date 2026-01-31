const request = require('supertest');
const express = require('express');
const workoutsRouter = require('../../routes/workouts');
const Workout = require('../../models/Workout');
const { createTestUser, generateTestToken } = require('../setup');

const app = express();
app.use(express.json());
app.use('/api/workouts', workoutsRouter);

process.env.JWT_SECRET = 'test-secret-key';

/**
 * Testy integracyjne tras treningów (Black-box testing)
 */
describe('Trasy Workouts - Testy Integracyjne', () => {

    let testUser;
    let authToken;

    beforeEach(async () => {
        testUser = await createTestUser({
            username: 'workoutuser',
            email: 'workout@example.com',
        });
        authToken = generateTestToken(testUser._id);
    });

    describe('GET /api/workouts', () => {
        test('powinien zwrócić puste [] dla nowego użytkownika', async () => {
            const response = await request(app)
                .get('/api/workouts')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual([]);
        });

        test('powinien zwrócić treningi użytkownika', async () => {
            await Workout.create({
                userId: testUser._id,
                name: 'Trening A',
                date: '2026-01-30',
                time: '10:00',
            });

            const response = await request(app)
                .get('/api/workouts')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
        });

        test('powinien wymagać autoryzacji', async () => {
            await request(app)
                .get('/api/workouts')
                .expect(401);
        });
    });

    describe('POST /api/workouts', () => {
        test('powinien utworzyć nowy trening', async () => {
            const workoutData = {
                name: 'Nowy trening',
                date: '2026-02-01',
                time: '10:00',
            };

            const response = await request(app)
                .post('/api/workouts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(workoutData)
                .expect(201);

            expect(response.body.name).toBe(workoutData.name);
            expect(response.body.userId).toBe(testUser._id.toString());
        });

        test('powinien wymagać autoryzacji', async () => {
            await request(app)
                .post('/api/workouts')
                .send({ name: 'Test' })
                .expect(401);
        });
    });

    describe('GET /api/workouts/:id', () => {
        test('powinien zwrócić szczegóły treningu', async () => {
            const workout = await Workout.create({
                userId: testUser._id,
                name: 'Test',
                date: '2026-01-31',
                time: '10:00',
            });

            const response = await request(app)
                .get(`/api/workouts/${workout._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.name).toBe('Test');
        });

        test('powinien zwrócić 404 dla nieistniejącego treningu', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            await request(app)
                .get(`/api/workouts/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('PUT /api/workouts/:id', () => {
        test('powinien zaktualizować trening', async () => {
            const workout = await Workout.create({
                userId: testUser._id,
                name: 'Stara nazwa',
                date: '2026-01-31',
                time: '10:00',
            });

            const response = await request(app)
                .put(`/api/workouts/${workout._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Nowa nazwa' })
                .expect(200);

            expect(response.body.name).toBe('Nowa nazwa');
        });
    });

    describe('DELETE /api/workouts/:id', () => {
        test('powinien usunąć trening', async () => {
            const workout = await Workout.create({
                userId: testUser._id,
                name: 'Do usunięcia',
                date: '2026-01-31',
                time: '10:00',
            });

            await request(app)
                .delete(`/api/workouts/${workout._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const deleted = await Workout.findById(workout._id);
            expect(deleted).toBeNull();
        });
    });
});
