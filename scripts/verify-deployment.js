const axios = require('axios');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SERVICES = {
  backend: 'https://drifti-backend.onrender.com',
  frontend: 'https://drifti-frontend.onrender.com'
};

const PERFORMANCE_THRESHOLDS = {
  responseTime: 1000, // 1 second
  memoryUsage: 0.8, // 80% of available memory
  cpuUsage: 0.7, // 70% of available CPU
  diskUsage: 0.85 // 85% of available disk space
};

async function checkServiceHealth(url) {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${url}/health`);
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      details: response.data,
      performance: {
        responseTime,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function verifyMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    // Check database stats
    const stats = await mongoose.connection.db.stats();
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Check for backup
    const backupStatus = await checkMongoDBBackup();
    
    return {
      status: 'connected',
      collections: collections.map(c => c.name),
      stats: {
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        objects: stats.objects
      },
      backup: backupStatus
    };
  } catch (error) {
    return {
      status: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkMongoDBBackup() {
  try {
    // Check if backup exists and is recent (within last 24 hours)
    const backupDir = path.join(__dirname, '../backups');
    const files = fs.readdirSync(backupDir);
    const latestBackup = files
      .filter(f => f.startsWith('mongodb-backup-'))
      .sort()
      .pop();
    
    if (!latestBackup) {
      return {
        status: 'no_backup',
        error: 'No backup found'
      };
    }
    
    const backupPath = path.join(backupDir, latestBackup);
    const stats = fs.statSync(backupPath);
    const backupAge = Date.now() - stats.mtime.getTime();
    
    return {
      status: backupAge < 24 * 60 * 60 * 1000 ? 'recent' : 'stale',
      timestamp: stats.mtime.toISOString(),
      size: stats.size,
      age: Math.round(backupAge / (60 * 60 * 1000)) + ' hours'
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function verifyFirebase() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
    }
    
    const auth = admin.auth();
    const users = await auth.listUsers(1);
    
    // Check Firebase security rules
    const securityRules = await checkFirebaseSecurityRules();
    
    return {
      status: 'connected',
      projectId: admin.app().options.projectId,
      userCount: users.users.length,
      security: securityRules
    };
  } catch (error) {
    return {
      status: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkFirebaseSecurityRules() {
  try {
    const rules = await admin.securityRules().getRules();
    return {
      status: 'configured',
      rules: rules
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function checkSecurity() {
  try {
    // Check SSL/TLS configuration
    const sslCheck = await checkSSL();
    
    // Check security headers
    const headersCheck = await checkSecurityHeaders();
    
    // Check for known vulnerabilities
    const vulnerabilityCheck = await checkVulnerabilities();
    
    return {
      ssl: sslCheck,
      headers: headersCheck,
      vulnerabilities: vulnerabilityCheck
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function checkSSL() {
  try {
    const response = await axios.get(SERVICES.backend);
    return {
      status: 'secure',
      protocol: response.request.protocol,
      certificate: response.request.res.socket.getPeerCertificate()
    };
  } catch (error) {
    return {
      status: 'insecure',
      error: error.message
    };
  }
}

async function checkSecurityHeaders() {
  try {
    const response = await axios.get(SERVICES.backend);
    const headers = response.headers;
    const requiredHeaders = [
      'strict-transport-security',
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'content-security-policy'
    ];
    
    const missingHeaders = requiredHeaders.filter(h => !headers[h]);
    
    return {
      status: missingHeaders.length === 0 ? 'secure' : 'incomplete',
      missingHeaders,
      presentHeaders: requiredHeaders.filter(h => headers[h])
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function checkVulnerabilities() {
  try {
    const result = execSync('npm audit --json').toString();
    const audit = JSON.parse(result);
    return {
      status: audit.metadata.vulnerabilities.total === 0 ? 'secure' : 'vulnerable',
      vulnerabilities: audit.metadata.vulnerabilities,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function checkPerformance() {
  try {
    // Check system resources
    const resources = await checkSystemResources();
    
    // Check API response times
    const apiPerformance = await checkAPIPerformance();
    
    // Check database performance
    const dbPerformance = await checkDatabasePerformance();
    
    return {
      resources,
      api: apiPerformance,
      database: dbPerformance
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function checkSystemResources() {
  try {
    const result = execSync('node -e "console.log(JSON.stringify(process.memoryUsage()))"').toString();
    const memoryUsage = JSON.parse(result);
    
    return {
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function checkAPIPerformance() {
  const endpoints = [
    '/health',
    '/api/users',
    '/api/auth/status'
  ];
  
  const results = await Promise.all(
    endpoints.map(async endpoint => {
      const startTime = Date.now();
      try {
        await axios.get(`${SERVICES.backend}${endpoint}`);
        return {
          endpoint,
          status: 'success',
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        return {
          endpoint,
          status: 'error',
          error: error.message
        };
      }
    })
  );
  
  return results;
}

async function checkDatabasePerformance() {
  try {
    const startTime = Date.now();
    await mongoose.connection.db.command({ ping: 1 });
    const pingTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      pingTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function verifyDeployment() {
  console.log('Starting comprehensive deployment verification...\n');

  // Check services
  console.log('Checking services...');
  for (const [name, url] of Object.entries(SERVICES)) {
    console.log(`\nVerifying ${name} service...`);
    const health = await checkServiceHealth(url);
    console.log(`${name} service is ${health.status}`);
    if (health.details) console.log('Details:', health.details);
    if (health.error) console.error('Error:', health.error);
  }

  // Check MongoDB
  console.log('\nVerifying MongoDB connection...');
  const mongoStatus = await verifyMongoDB();
  console.log(`MongoDB is ${mongoStatus.status}`);
  if (mongoStatus.collections) console.log('Collections:', mongoStatus.collections);
  if (mongoStatus.stats) console.log('Database stats:', mongoStatus.stats);
  if (mongoStatus.backup) console.log('Backup status:', mongoStatus.backup);
  if (mongoStatus.error) console.error('Error:', mongoStatus.error);

  // Check Firebase
  console.log('\nVerifying Firebase connection...');
  const firebaseStatus = await verifyFirebase();
  console.log(`Firebase is ${firebaseStatus.status}`);
  if (firebaseStatus.projectId) console.log('Project ID:', firebaseStatus.projectId);
  if (firebaseStatus.userCount) console.log('User count:', firebaseStatus.userCount);
  if (firebaseStatus.security) console.log('Security rules:', firebaseStatus.security);
  if (firebaseStatus.error) console.error('Error:', firebaseStatus.error);

  // Check Security
  console.log('\nChecking security...');
  const securityStatus = await checkSecurity();
  console.log('Security status:', securityStatus);

  // Check Performance
  console.log('\nChecking performance...');
  const performanceStatus = await checkPerformance();
  console.log('Performance status:', performanceStatus);

  // Cleanup
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
}

// Run if called directly
if (require.main === module) {
  verifyDeployment().catch(console.error);
}

module.exports = {
  verifyDeployment,
  checkServiceHealth,
  verifyMongoDB,
  verifyFirebase,
  checkSecurity,
  checkPerformance
}; 