const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { trackError } = require('../backend/monitoring/errorMonitor');

const AUTO_FIX_ACTIONS = {
  // Check and fix npm dependencies
  async fixDependencies() {
    console.log('🔍 Checking npm dependencies...');
    try {
      // Root dependencies
      execSync('npm install', { stdio: 'inherit' });
      
      // Frontend dependencies
      process.chdir('frontend');
      execSync('npm install', { stdio: 'inherit' });
      
      // Backend dependencies
      process.chdir('../backend');
      execSync('npm install', { stdio: 'inherit' });
      
      process.chdir('..');
      console.log('✅ Dependencies fixed successfully');
    } catch (error) {
      trackError(error, { action: 'fixDependencies' });
      console.error('❌ Failed to fix dependencies:', error.message);
    }
  },

  // Check and fix environment variables
  async fixEnvironment() {
    console.log('🔍 Checking environment variables...');
    try {
      const envFiles = [
        { path: 'frontend/.env.local', template: 'frontend/.env.example' },
        { path: 'backend/.env', template: 'backend/.env.example' }
      ];

      for (const { path: envPath, template } of envFiles) {
        if (!fs.existsSync(envPath) && fs.existsSync(template)) {
          fs.copyFileSync(template, envPath);
          console.log(`✅ Created ${envPath} from template`);
        }
      }
    } catch (error) {
      trackError(error, { action: 'fixEnvironment' });
      console.error('❌ Failed to fix environment:', error.message);
    }
  },

  // Check and fix database connections
  async fixDatabase() {
    console.log('🔍 Checking database connections...');
    try {
      const mongoose = require('mongoose');
      const config = require('../backend/config');
      
      if (!config.mongoUri) {
        console.log('⚠️ MongoDB URI not configured, skipping database check');
        return;
      }
      
      await mongoose.connect(config.mongoUri);
      console.log('✅ Database connection successful');
      
      await mongoose.disconnect();
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log('⚠️ MongoDB module not found, skipping database check');
        return;
      }
      trackError(error, { action: 'fixDatabase' });
      console.error('❌ Database connection failed:', error.message);
    }
  },

  // Check and fix Firebase configuration
  async fixFirebase() {
    console.log('🔍 Checking Firebase configuration...');
    try {
      const admin = require('firebase-admin');
      const config = require('../backend/config');
      
      if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) {
        console.log('⚠️ Firebase configuration not complete, skipping Firebase check');
        return;
      }
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: config.firebase.storageBucket,
      });
      
      console.log('✅ Firebase initialization successful');
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log('⚠️ Firebase Admin module not found, skipping Firebase check');
        return;
      }
      trackError(error, { action: 'fixFirebase' });
      console.error('❌ Firebase initialization failed:', error.message);
    }
  },

  // Check and fix Redis connection
  async fixRedis() {
    console.log('🔍 Checking Redis connection...');
    try {
      const Redis = require('ioredis');
      const config = require('../backend/config');
      
      if (!config.redis.url) {
        console.log('⚠️ Redis URL not configured, skipping Redis check');
        return;
      }
      
      const redis = new Redis(config.redis.url);
      await redis.ping();
      console.log('✅ Redis connection successful');
      
      await redis.quit();
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log('⚠️ Redis module not found, skipping Redis check');
        return;
      }
      trackError(error, { action: 'fixRedis' });
      console.error('❌ Redis connection failed:', error.message);
    }
  },

  // Check and fix file permissions
  async fixPermissions() {
    console.log('🔍 Checking file permissions...');
    try {
      const dirs = ['frontend/.next', 'backend/logs'];
      
      for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.chmodSync(dir, '755');
      }
      
      console.log('✅ File permissions fixed');
    } catch (error) {
      trackError(error, { action: 'fixPermissions' });
      console.error('❌ Failed to fix permissions:', error.message);
    }
  },

  // Check and fix build files
  async fixBuild() {
    console.log('🔍 Checking build files...');
    try {
      // Clean build directories
      const dirs = ['frontend/.next', 'frontend/out'];
      for (const dir of dirs) {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }
      
      // Rebuild frontend
      process.chdir('frontend');
      execSync('npm run build', { stdio: 'inherit' });
      process.chdir('..');
      
      console.log('✅ Build files fixed');
    } catch (error) {
      trackError(error, { action: 'fixBuild' });
      console.error('❌ Failed to fix build:', error.message);
    }
  },

  // Check and fix security issues
  async fixSecurity() {
    console.log('🔍 Checking security issues...');
    try {
      // Run npm audit
      execSync('npm audit', { stdio: 'inherit' });
      
      // Run security scan on frontend
      process.chdir('frontend');
      execSync('npm audit', { stdio: 'inherit' });
      
      // Run security scan on backend
      process.chdir('../backend');
      execSync('npm audit', { stdio: 'inherit' });
      
      process.chdir('..');
      console.log('✅ Security checks completed');
    } catch (error) {
      trackError(error, { action: 'fixSecurity' });
      console.error('❌ Failed to fix security issues:', error.message);
    }
  },

  // Check and fix API endpoints
  async fixAPI() {
    console.log('🔍 Checking API endpoints...');
    try {
      const axios = require('axios');
      const config = require('../backend/config');
      
      // Test health check endpoint
      const response = await axios.get(`http://localhost:${config.port}/api/health`);
      if (response.status === 200) {
        console.log('✅ API health check successful');
      } else {
        throw new Error('API health check failed');
      }
    } catch (error) {
      trackError(error, { action: 'fixAPI' });
      console.error('❌ Failed to fix API endpoints:', error.message);
    }
  }
};

async function runAutoFix() {
  console.log('🚀 Starting auto-fix process...\n');
  
  for (const [action, fn] of Object.entries(AUTO_FIX_ACTIONS)) {
    console.log(`\nRunning ${action}...`);
    await fn();
  }
  
  console.log('\n✨ Auto-fix process completed!');
}

// Run auto-fix if this file is executed directly
if (require.main === module) {
  runAutoFix().catch(error => {
    console.error('❌ Auto-fix failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAutoFix,
  AUTO_FIX_ACTIONS
}; 