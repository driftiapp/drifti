const axios = require('axios');
const { execSync } = require('child_process');
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const HealthCheckService = require('../backend/services/HealthCheckService');

class DeploymentManager {
    constructor() {
        this.environments = {
            staging: {
                backend: process.env.RAILWAY_URL,
                frontend: process.env.FIREBASE_STAGING_URL,
                mongodb: process.env.MONGODB_STAGING_URI
            },
            production: {
                backend: process.env.RENDER_URL,
                frontend: process.env.FIREBASE_PRODUCTION_URL,
                mongodb: process.env.MONGODB_PRODUCTION_URI
            }
        };
    }

    async deploy(environment) {
        console.log(`🚀 Starting deployment to ${environment}...`);
        
        try {
            // 1. Pre-deployment checks
            await this.runPreDeploymentChecks(environment);

            // 2. Database migrations
            await this.runDatabaseMigrations(environment);

            // 3. Deploy backend
            await this.deployBackend(environment);

            // 4. Deploy frontend
            await this.deployFrontend(environment);

            // 5. Post-deployment verification
            await this.verifyDeployment(environment);

            console.log(`✅ Deployment to ${environment} completed successfully!`);
        } catch (error) {
            console.error(`❌ Deployment to ${environment} failed:`, error);
            throw error;
        }
    }

    async runPreDeploymentChecks(environment) {
        console.log('Running pre-deployment checks...');

        // Check git status
        const gitStatus = execSync('git status --porcelain').toString();
        if (gitStatus) {
            throw new Error('Working directory is not clean. Commit or stash changes first.');
        }

        // Check current branch
        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
        const allowedBranch = environment === 'production' ? 'main' : 'staging';
        if (currentBranch !== allowedBranch) {
            throw new Error(`Must be on ${allowedBranch} branch to deploy to ${environment}`);
        }

        // Run tests
        console.log('Running tests...');
        execSync('npm test', { stdio: 'inherit' });

        // Check dependencies
        console.log('Checking dependencies...');
        execSync('npm audit', { stdio: 'inherit' });

        // Build check
        console.log('Checking build...');
        execSync('npm run build', { stdio: 'inherit' });
    }

    async runDatabaseMigrations(environment) {
        console.log('Running database migrations...');

        // Connect to MongoDB
        await mongoose.connect(this.environments[environment].mongodb);

        // Get pending migrations
        const Migration = mongoose.model('Migration');
        const pendingMigrations = await Migration.find({ status: 'pending' });

        if (pendingMigrations.length > 0) {
            console.log(`Found ${pendingMigrations.length} pending migrations...`);
            
            // Run migrations
            for (const migration of pendingMigrations) {
                try {
                    console.log(`Running migration: ${migration.name}`);
                    await migration.execute();
                    migration.status = 'completed';
                    migration.completedAt = new Date();
                    await migration.save();
                } catch (error) {
                    console.error(`Migration ${migration.name} failed:`, error);
                    migration.status = 'failed';
                    migration.error = error.message;
                    await migration.save();
                    throw error;
                }
            }
        }

        // Verify indexes
        console.log('Verifying database indexes...');
        await mongoose.model('HealthCheck').ensureIndexes();
        await mongoose.model('Order').ensureIndexes();
        await mongoose.model('Business').ensureIndexes();
        await mongoose.model('User').ensureIndexes();
    }

    async deployBackend(environment) {
        console.log(`Deploying backend to ${environment}...`);

        const deployCommand = environment === 'production'
            ? 'git push render main'
            : 'git push railway staging';

        execSync(deployCommand, { stdio: 'inherit' });

        // Wait for deployment to complete and verify health
        console.log('Waiting for backend deployment to complete...');
        await this.waitForHealthyBackend(environment);
    }

    async deployFrontend(environment) {
        console.log(`Deploying frontend to ${environment}...`);

        // Build frontend with environment-specific configuration
        execSync(`npm run build:${environment}`, { stdio: 'inherit' });

        // Deploy to Firebase
        execSync(`firebase deploy --only hosting:${environment}`, { stdio: 'inherit' });

        // Verify frontend deployment
        await this.verifyFrontendDeployment(environment);
    }

    async waitForHealthyBackend(environment, maxAttempts = 30, interval = 10000) {
        const backendUrl = this.environments[environment].backend;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await axios.get(`${backendUrl}/api/health`);
                if (response.data.status === 'healthy') {
                    console.log('Backend health check passed!');
                    return;
                }
            } catch (error) {
                console.log(`Waiting for backend to be healthy (attempt ${attempt}/${maxAttempts})...`);
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error('Backend failed to become healthy within timeout');
    }

    async verifyFrontendDeployment(environment) {
        const frontendUrl = this.environments[environment].frontend;
        
        try {
            const response = await axios.get(frontendUrl);
            if (response.status !== 200) {
                throw new Error(`Frontend health check failed: ${response.status}`);
            }
            console.log('Frontend deployment verified!');
        } catch (error) {
            throw new Error(`Frontend verification failed: ${error.message}`);
        }
    }

    async verifyDeployment(environment) {
        console.log('Running post-deployment verification...');

        // Start health monitoring
        const healthCheck = new HealthCheckService();
        await healthCheck.startMonitoring();

        // Run comprehensive health check
        const status = await healthCheck.runHealthCheck();
        if (!Object.values(status).every(s => s)) {
            throw new Error('Post-deployment health check failed');
        }

        // Verify critical flows
        await this.verifyCriticalFlows(environment);

        console.log('Post-deployment verification completed successfully!');
    }

    async verifyCriticalFlows(environment) {
        const backendUrl = this.environments[environment].backend;
        
        // Test authentication
        await axios.post(`${backendUrl}/api/auth/test`);

        // Test order creation
        await axios.post(`${backendUrl}/api/orders/test`);

        // Test payment processing
        await axios.post(`${backendUrl}/api/payments/test`);

        // Test business operations
        await axios.post(`${backendUrl}/api/business/test`);

        console.log('Critical flows verified successfully!');
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const environment = args[0];

    if (!['staging', 'production'].includes(environment)) {
        console.error('Please specify environment: staging or production');
        process.exit(1);
    }

    const manager = new DeploymentManager();
    manager.deploy(environment)
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Deployment failed:', error);
            process.exit(1);
        });
}

module.exports = DeploymentManager; 