const request = require('supertest');
const express = require('express');
const authRouter = require('../../routes/auth');
const User = require('../../models/User');
const WorkoutPlan = require('../../models/WorkoutPlan');
const { createTestUser } = require('../setup');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

process.env.JWT_SECRET = 'test-secret-key';

describe('Trasy Auth - Testy Integracyjne', () => {

    describe('POST /api/auth/register', () => {
        test('powinien zarejestrować nowego użytkownika', async () => {
            const userData = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.token).toBeDefined();
            expect(response.body.user.username).toBe(userData.username);
            expect(response.body.user.password).toBeUndefined();
        });

        test('powinien zwrócić błąd 400 dla duplikatu emaila', async () => {
            await createTestUser({ email: 'duplicate@example.com' });

            const userData = {
                username: 'different',
                email: 'duplicate@example.com',
                password: 'password123',
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
        });

        test('powinien zwrócić błąd 400 przy krótkim haśle', async () => {
            const userData = {
                username: 'test',
                email: 'test@example.com',
                password: '12345',
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);
        });

        test('powinien zwrócić błąd 400 gdy brakuje pól', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com' })
                .expect(400);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            const User = require('../../models/User');
            await new User({
                username: 'loginuser',
                email: 'login@example.com',
                password: 'password123',
            }).save();
        });

        test('powinien zalogować użytkownika z poprawnymi danymi', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123',
                })
                .expect(200);

            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.password).toBeUndefined();
        });

        test('powinien zwrócić błąd 401 dla niepoprawnego hasła', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword',
                })
                .expect(401);
        });

        test('powinien zwrócić błąd 401 dla nieistniejącego emaila', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'notexist@example.com',
                    password: 'password123',
                })
                .expect(401);
        });

        test('powinien zwrócić błąd 400 gdy brakuje danych', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({ email: 'login@example.com' })
                .expect(400);
        });

        test('email powinien być case-insensitive', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'LOGIN@EXAMPLE.COM',
                    password: 'password123',
                })
                .expect(200);

            expect(response.body.token).toBeDefined();
        });
    });

    describe('Bezpieczeństwo', () => {
        test('hasło nigdy nie powinno być zwracane w odpowiedzi', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'secureuser',
                    email: 'secure@example.com',
                    password: 'password123',
                })
                .expect(201);

            expect(response.body.user.password).toBeUndefined();

            const user = await User.findOne({ email: 'secure@example.com' });
            expect(user).toBeDefined();
            expect(user.password).not.toBe('password123');
            expect(user.password.length).toBeGreaterThan(20);
        });

        test('token JWT powinien mieć poprawną strukturę', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'jwtuser',
                    email: 'jwt@example.com',
                    password: 'password123',
                })
                .expect(201);

            expect(response.body.token).toBeDefined();
            const token = response.body.token;
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });
    });
});
