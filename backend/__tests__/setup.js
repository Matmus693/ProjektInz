const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Konfiguracja przed wszystkimi testami
beforeAll(async () => {
    try {
        // Uruchom serwer MongoDB w pamięci
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Rozłącz się z istniejącym połączeniem (jeśli istnieje)
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        // Połącz się z testową bazą danych
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✓ Połączono z testową bazą danych MongoDB');
    } catch (error) {
        console.error('Błąd podczas konfiguracji testów:', error);
        throw error;
    }
});

// Czyszczenie po każdym teście
afterEach(async () => {
    try {
        const collections = mongoose.connection.collections;

        // Wyczyść wszystkie kolekcje
        for (const key in collections) {
            await collections[key].deleteMany();
        }
    } catch (error) {
        console.error('Błąd podczas czyszczenia kolekcji:', error);
        throw error;
    }
});

// Sprzątanie po wszystkich testach
afterAll(async () => {
    try {
        // Rozłącz się z bazą danych
        await mongoose.disconnect();

        // Zatrzymaj serwer MongoDB
        if (mongoServer) {
            await mongoServer.stop();
        }

        console.log('✓ Zamknięto połączenie z testową bazą danych');
    } catch (error) {
        console.error('Błąd podczas zamykania połączenia:', error);
        throw error;
    }
});

// Funkcje pomocnicze dla testów

/**
 * Tworzy testowego użytkownika
 */
const createTestUser = async (userData = {}) => {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');

    const defaultUser = {
        username: 'testUser',
        email: 'test@example.com',
        password: await bcrypt.hash('TestPassword123', 10),
        ...userData,
    };

    return await User.create(defaultUser);
};

/**
 * Generuje token JWT dla testowego użytkownika
 */
const generateTestToken = (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret-key', {
        expiresIn: '1h',
    });
};

/**
 * Tworzy testowe ćwiczenie
 */
const createTestExercise = async (overrides = {}) => {
    const defaultExercise = {
        name: `Test Exercise ${Date.now()}`,
        muscleGroup: 'Chest', // Poprawiona wielka litera
        ...overrides,
    };

    const Exercise = require('../models/Exercise');
    const exercise = await new Exercise(defaultExercise).save();
    return exercise;
};

// Eksportuj funkcje pomocnicze
module.exports = {
    createTestUser,
    generateTestToken,
    createTestExercise,
};
