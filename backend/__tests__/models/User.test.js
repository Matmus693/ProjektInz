const mongoose = require('mongoose');
const User = require('../../models/User');
const { createTestUser } = require('../setup');

describe('Model User - Testy Jednostkowe', () => {

    describe('Tworzenie użytkownika', () => {
        test('powinien utworzyć użytkownika z poprawnymi danymi', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            const user = await new User(userData).save();

            expect(user._id).toBeDefined();
            expect(user.username).toBe(userData.username);
            expect(user.email).toBe(userData.email.toLowerCase());
            expect(user.password).not.toBe(userData.password);
        });

        test('powinien wymagać wszystkich pól', async () => {
            const user = new User({});
            await expect(user.save()).rejects.toThrow();
        });

        test('powinien wymagać minimalnej długości hasła', async () => {
            const user = new User({
                username: 'test',
                email: 'test@example.com',
                password: '12345',
            });
            await expect(user.save()).rejects.toThrow();
        });
    });

    describe('Unikalne pola', () => {
        test('powinien zwrócić błąd przy duplikacji emaila', async () => {
            await createTestUser({ email: 'duplicate@example.com' });

            const duplicate = new User({
                username: 'different',
                email: 'duplicate@example.com',
                password: 'password123',
            });

            await expect(duplicate.save()).rejects.toThrow();
        });

        test('powinien zwrócić błąd przy duplikacji username', async () => {
            await createTestUser({ username: 'duplicate' });

            const duplicate = new User({
                username: 'duplicate',
                email: 'different@example.com',
                password: 'password123',
            });

            await expect(duplicate.save()).rejects.toThrow();
        });
    });

    describe('Hashowanie hasła', () => {
        test('powinien zahashować hasło przed zapisem', async () => {
            const plainPassword = 'password123';
            const user = await new User({
                username: 'testuser',
                email: 'test@example.com',
                password: plainPassword,
            }).save();

            expect(user.password).not.toBe(plainPassword);
            expect(user.password.length).toBeGreaterThan(plainPassword.length);
        });

        test('nie powinien ponownie hashować hasła przy aktualizacji', async () => {
            const user = await createTestUser();
            const originalHash = user.password;

            user.username = 'updated';
            await user.save();

            expect(user.password).toBe(originalHash);
        });
    });

    describe('Metoda comparePassword', () => {
        test('powinien zwrócić true dla poprawnego hasła', async () => {
            const password = 'password123';
            const user = await createTestUser({ password });

            const isMatch = await user.comparePassword(password);
            expect(isMatch).toBe(true);
        });

        test('powinien zwrócić false dla niepoprawnego hasła', async () => {
            const user = await createTestUser({ password: 'password123' });

            const isMatch = await user.comparePassword('wrongpassword');
            expect(isMatch).toBe(false);
        });
    });

    describe('Transformacje danych', () => {
        test('powinien zamienić email na małe litery', async () => {
            const user = await new User({
                username: 'test',
                email: 'TEST@EXAMPLE.COM',
                password: 'password123',
            }).save();

            expect(user.email).toBe('test@example.com');
        });

        test('powinien usunąć białe znaki z username i email', async () => {
            const user = await new User({
                username: '  testuser  ',
                email: '  test@example.com  ',
                password: 'password123',
            }).save();

            expect(user.username).toBe('testuser');
            expect(user.email).toBe('test@example.com');
        });
    });
});
