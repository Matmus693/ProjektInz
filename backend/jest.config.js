module.exports = {
    
    testEnvironment: 'node',

    testMatch: ['**/__tests__*.test.js'],

    collectCoverageFrom: [
        'models*.js',
        'routes*.js',
        'services*.js',
        'middleware*.js',
        'utils*.js',
        '!node_modules/**',
        '!__tests__/**'
    ],

    coverageDirectory: 'coverage',

    coverageReporters: ['text', 'lcov', 'html'],

    coverageThreshold: {
        global: {
            branches: 70,
            functions: 75,
            lines: 80,
            statements: 80
        }
    },

    testTimeout: 10000,

    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,

    verbose: true
};
