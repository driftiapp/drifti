const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.production' });

// Function to check if all required environment variables are set
const checkEnvironmentVariables = () => {
    const requiredVars = [
        'MONGODB_PASSWORD',
        'REDIS_HOST',
        'REDIS_PORT',
        'JWT_SECRET',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'SMTP_USER',
        'SMTP_PASS',
        'WHITELISTED_IPS',
        'SENTRY_DSN',
        'NEW_RELIC_LICENSE_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('Missing required environment variables:');
        missingVars.forEach(varName => console.error(`- ${varName}`));
        process.exit(1);
    }
};

// Function to run database migrations
const runMigrations = () => {
    try {
        console.log('Running database migrations...');
        execSync('npm run migrate', { stdio: 'inherit' });
        console.log('Database migrations completed successfully');
    } catch (error) {
        console.error('Database migrations failed:', error);
        process.exit(1);
    }
};

// Function to run tests
const runTests = () => {
    try {
        console.log('Running tests...');
        execSync('npm test', { stdio: 'inherit' });
        console.log('Tests completed successfully');
    } catch (error) {
        console.error('Tests failed:', error);
        process.exit(1);
    }
};

// Function to build the application
const buildApp = () => {
    try {
        console.log('Building application...');
        execSync('npm run build', { stdio: 'inherit' });
        console.log('Application built successfully');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
};

// Function to verify production configuration
const verifyConfig = () => {
    try {
        // Check if production config file exists
        const configPath = path.join(__dirname, '../config/production.js');
        if (!fs.existsSync(configPath)) {
            throw new Error('Production configuration file not found');
        }

        // Verify SSL certificates
        const sslPath = path.join(__dirname, '../ssl');
        if (!fs.existsSync(sslPath)) {
            throw new Error('SSL certificates not found');
        }

        console.log('Production configuration verified');
    } catch (error) {
        console.error('Configuration verification failed:', error);
        process.exit(1);
    }
};

// Main deployment function
const deploy = async () => {
    try {
        console.log('Starting deployment process...');

        // Check environment variables
        checkEnvironmentVariables();

        // Run tests
        runTests();

        // Verify configuration
        verifyConfig();

        // Run database migrations
        runMigrations();

        // Build application
        buildApp();

        console.log('Deployment completed successfully! 🚀');
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
};

// Run deployment
deploy(); 