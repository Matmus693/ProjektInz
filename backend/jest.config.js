module.exports = {
    // Środowisko testowe
    testEnvironment: 'node',

    // Wzorce plików testowych
    testMatch: ['**/__tests__/**/*.test.js'],

    // Pokrycie kodu
    collectCoverageFrom: [
        'models/**/*.js',
        'routes/**/*.js',
        'services/**/*.js',
        'middleware/**/*.js',
        'utils/**/*.js',
        '!node_modules/**',
        '!__tests__/**'
    ],

    // Katalog dla raportów pokrycia
    coverageDirectory: 'coverage',

    // Typy raportów pokrycia
    coverageReporters: ['text', 'lcov', 'html'],

    // Próg pokrycia kodu
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 75,
            lines: 80,
            statements: 80
        }
    },

    // Timeout dla testów (10 sekund)
    testTimeout: 10000,

    // Konfiguracja przed uruchomieniem testów
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

    // Wyczyść mocki między testami
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,

    // Verbose output
    verbose: true
};
