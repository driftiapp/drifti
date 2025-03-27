module.exports = {
    // Test environment
    testEnvironment: 'node',
    
    // Test file patterns
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],
    
    // Coverage configuration
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover'],
    collectCoverageFrom: [
        'routes/**/*.js',
        'models/**/*.js',
        'controllers/**/*.js',
        'services/**/*.js',
        'utils/**/*.js',
        '!**/node_modules/**'
    ],
    
    // Setup and teardown
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    
    // Environment variables
    setupFiles: ['<rootDir>/tests/setEnvVars.js'],
    
    // Mocking configuration
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    
    // Test timeout
    testTimeout: 30000,
    
    // Verbose output
    verbose: true
}; 