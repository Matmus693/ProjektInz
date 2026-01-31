module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverageFrom: [
        '__tests__/**/*.js',
        '!__tests__/**/*.test.js',
        '!__tests__/setup.js',
    ],
    verbose: true,
};
