const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
    try {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

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

afterEach(async () => {
    try {
        const collections = mongoose.connection.collections;

        for (const key in collections) {
            await collections[key].deleteMany();
        }
    } catch (error) {
        console.error('Błąd podczas czyszczenia kolekcji:', error);
        throw error;
    }
});

afterAll(async () => {
    try {
        await mongoose.disconnect();

        if (mongoServer) {
            await mongoServer.stop();
        }

        console.log('✓ Zamknięto połączenie z testową bazą danych');
    } catch (error) {
        console.error('Błąd podczas zamykania połączenia:', error);
        throw error;
    }
});

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

const generateTestToken = (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret-key', {
        expiresIn: '1h',
    });
};

const createTestExercise = async (overrides = {}) => {
    const defaultExercise = {
        name: `Test Exercise ${Date.now()}`,
        muscleGroup: 'Chest',
        ...overrides,
    };

    const Exercise = require('../models/Exercise');
    const exercise = await new Exercise(defaultExercise).save();
    return exercise;
};

module.exports = {
    createTestUser,
    generateTestToken,
    createTestExercise,
};
