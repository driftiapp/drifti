require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const requiredEnvVars = [
    'PORT',
    'NODE_ENV',
    'WS_PORT',
    'WS_PATH',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'REDIS_HOST',
    'REDIS_PORT',
    'METRICS_ENABLED',
    'METRICS_PORT',
    'REACT_APP_API_URL',
    'REACT_APP_WS_URL',
    'REACT_APP_ENV',
    'PRESENCE_ACTIVITY_TIMEOUT',
    'PRESENCE_CLEANUP_INTERVAL',
    'LOG_LEVEL',
    'LOG_FORMAT',
    'CORS_ORIGIN',
    'RATE_LIMIT_WINDOW',
    'RATE_LIMIT_MAX',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
];

console.log('🔍 Testing environment configuration...\n');

// Check for missing environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
}

// Validate specific environment variables
const validations = [
    {
        name: 'NODE_ENV',
        valid: ['development', 'production', 'test'].includes(process.env.NODE_ENV),
        message: 'NODE_ENV must be one of: development, production, test'
    },
    {
        name: 'PORT',
        valid: !isNaN(process.env.PORT) && process.env.PORT > 0,
        message: 'PORT must be a positive number'
    },
    {
        name: 'WS_PORT',
        valid: !isNaN(process.env.WS_PORT) && process.env.WS_PORT > 0,
        message: 'WS_PORT must be a positive number'
    },
    {
        name: 'JWT_EXPIRES_IN',
        valid: /^\d+[h|m|s]$/.test(process.env.JWT_EXPIRES_IN),
        message: 'JWT_EXPIRES_IN must be in format: <number>[h|m|s]'
    }
];

const invalidVars = validations.filter(v => !v.valid);

if (invalidVars.length > 0) {
    console.error('❌ Invalid environment variables:');
    invalidVars.forEach(v => console.error(`   - ${v.name}: ${v.message}`));
    process.exit(1);
}

// Check for secure values
const secureChecks = [
    {
        name: 'JWT_SECRET',
        minLength: 32,
        message: 'JWT_SECRET should be at least 32 characters long'
    },
    {
        name: 'ADMIN_PASSWORD',
        minLength: 12,
        message: 'ADMIN_PASSWORD should be at least 12 characters long'
    },
    {
        name: 'DB_PASSWORD',
        minLength: 12,
        message: 'DB_PASSWORD should be at least 12 characters long'
    }
];

const insecureVars = secureChecks.filter(check =>
    process.env[check.name].length < check.minLength
);

if (insecureVars.length > 0) {
    console.warn('⚠️  Warning: Some environment variables may not be secure enough:');
    insecureVars.forEach(v => console.warn(`   - ${v.name}: ${v.message}`));
}

console.log('\n✅ All required environment variables are present!');
console.log('✅ Environment variable format validation passed!');
console.log('\n📝 Environment Summary:');
console.log(`   - Node Environment: ${process.env.NODE_ENV}`);
console.log(`   - API Port: ${process.env.PORT}`);
console.log(`   - WebSocket Port: ${process.env.WS_PORT}`);
console.log(`   - Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
console.log(`   - Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
console.log(`   - Metrics: ${process.env.METRICS_ENABLED ? 'Enabled' : 'Disabled'}`);
console.log(`   - Logging: ${process.env.LOG_LEVEL} (${process.env.LOG_FORMAT})`);

// Function to check if a file exists
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

// Function to check if a directory exists
function directoryExists(dirPath) {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

// Function to check if a file is readable
function isFileReadable(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.R_OK);
        return true;
    } catch (error) {
        return false;
    }
}

// Function to check if a file is executable
function isFileExecutable(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.X_OK);
        return true;
    } catch (error) {
        return false;
    }
}

// Main test function
async function testEnvironment() {
    console.log(chalk.blue('🔍 Testing environment setup...'));

    // Check required files
    const requiredFiles = [
        '.env',
        'scripts/manage-backups.js',
        'scripts/rotate-secrets.js',
        'scripts/BackupManager.js',
        'scripts/MasterKeyManager.js'
    ];

    console.log(chalk.blue('\n📁 Checking required files:'));
    for (const file of requiredFiles) {
        const exists = fileExists(file);
        const readable = exists && isFileReadable(file);
        const executable = exists && isFileExecutable(file);

        console.log(`\n${file}:`);
        console.log(`  Exists: ${exists ? chalk.green('✅') : chalk.red('❌')}`);
        if (exists) {
            console.log(`  Readable: ${readable ? chalk.green('✅') : chalk.red('❌')}`);
            console.log(`  Executable: ${executable ? chalk.green('✅') : chalk.red('❌')}`);
        }
    }

    // Check required directories
    const requiredDirs = [
        'backups',
        '.backup-keys'
    ];

    console.log(chalk.blue('\n📁 Checking required directories:'));
    for (const dir of requiredDirs) {
        const exists = directoryExists(dir);
        console.log(`\n${dir}:`);
        console.log(`  Exists: ${exists ? chalk.green('✅') : chalk.red('❌')}`);
    }

    // Check environment variables
    console.log(chalk.blue('\n🔑 Checking environment variables:'));
    const requiredEnvVars = [
        'BACKUP_ENCRYPTION_KEY',
        'MASTER_BACKUP_KEY'
    ];

    for (const envVar of requiredEnvVars) {
        const exists = process.env[envVar] !== undefined;
        console.log(`\n${envVar}:`);
        console.log(`  Set: ${exists ? chalk.green('✅') : chalk.red('❌')}`);
        if (exists) {
            console.log(`  Length: ${chalk.cyan(process.env[envVar].length)} characters`);
        }
    }

    console.log(chalk.green('\n✅ Environment test completed!'));
}

// Run the test
testEnvironment().catch(error => {
    console.error(chalk.red(`❌ Test failed: ${error.message}`));
    process.exit(1);
}); 