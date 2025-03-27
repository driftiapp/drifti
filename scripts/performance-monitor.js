const axios = require('axios');
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');
const os = require('os');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_PRIVATE_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Performance thresholds
const THRESHOLDS = {
  apiResponseTime: 1000, // 1 second
  dbResponseTime: 500,   // 500ms
  memoryUsage: 0.85,     // 85% of available memory
  diskUsage: 0.85,       // 85% of available disk space
  cpuUsage: 0.80         // 80% CPU usage
};

async function checkAPIPerformance() {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/health`);
    const responseTime = Date.now() - startTime;

    return {
      status: responseTime <= THRESHOLDS.apiResponseTime ? 'healthy' : 'warning',
      responseTime,
      statusCode: response.status,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkDatabasePerformance() {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const startTime = Date.now();
    await client.db().command({ ping: 1 });
    const responseTime = Date.now() - startTime;
    await client.close();

    return {
      status: responseTime <= THRESHOLDS.dbResponseTime ? 'healthy' : 'warning',
      responseTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkFirebasePerformance() {
  try {
    const startTime = Date.now();
    await admin.auth().listUsers(1);
    const responseTime = Date.now() - startTime;

    return {
      status: responseTime <= THRESHOLDS.apiResponseTime ? 'healthy' : 'warning',
      responseTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

function checkSystemResources() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = usedMemory / totalMemory;

  const cpus = os.cpus();
  const cpuUsage = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b);
    const idle = cpu.times.idle;
    return acc + (1 - idle / total);
  }, 0) / cpus.length;

  return {
    memory: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usage: memoryUsage,
      status: memoryUsage <= THRESHOLDS.memoryUsage ? 'healthy' : 'warning'
    },
    cpu: {
      cores: cpus.length,
      usage: cpuUsage,
      status: cpuUsage <= THRESHOLDS.cpuUsage ? 'healthy' : 'warning'
    },
    timestamp: new Date().toISOString()
  };
}

async function generateReport() {
  console.log('📊 Generating performance report...\n');

  const report = {
    timestamp: new Date().toISOString(),
    api: await checkAPIPerformance(),
    database: await checkDatabasePerformance(),
    firebase: await checkFirebasePerformance(),
    system: checkSystemResources()
  };

  // Print report
  console.log('Performance Report:');
  console.log('==================\n');

  // API Status
  console.log('API Status:');
  console.log(`Status: ${report.api.status}`);
  console.log(`Response Time: ${report.api.responseTime}ms`);
  if (report.api.error) console.log(`Error: ${report.api.error}`);
  console.log();

  // Database Status
  console.log('Database Status:');
  console.log(`Status: ${report.database.status}`);
  console.log(`Response Time: ${report.database.responseTime}ms`);
  if (report.database.error) console.log(`Error: ${report.database.error}`);
  console.log();

  // Firebase Status
  console.log('Firebase Status:');
  console.log(`Status: ${report.firebase.status}`);
  console.log(`Response Time: ${report.firebase.responseTime}ms`);
  if (report.firebase.error) console.log(`Error: ${report.firebase.error}`);
  console.log();

  // System Resources
  console.log('System Resources:');
  console.log('Memory:');
  console.log(`  Total: ${(report.system.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`  Used: ${(report.system.memory.used / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`  Free: ${(report.system.memory.free / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`  Usage: ${(report.system.memory.usage * 100).toFixed(2)}%`);
  console.log(`  Status: ${report.system.memory.status}`);
  console.log();
  console.log('CPU:');
  console.log(`  Cores: ${report.system.cpu.cores}`);
  console.log(`  Usage: ${(report.system.cpu.usage * 100).toFixed(2)}%`);
  console.log(`  Status: ${report.system.cpu.status}`);

  // Check for warnings
  const warnings = [];
  if (report.api.status === 'warning') warnings.push('API response time is high');
  if (report.database.status === 'warning') warnings.push('Database response time is high');
  if (report.firebase.status === 'warning') warnings.push('Firebase response time is high');
  if (report.system.memory.status === 'warning') warnings.push('High memory usage');
  if (report.system.cpu.status === 'warning') warnings.push('High CPU usage');

  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    warnings.forEach(warning => console.log(`- ${warning}`));
  }

  return report;
}

// Run if called directly
if (require.main === module) {
  generateReport().catch(error => {
    console.error('❌ Performance monitoring failed:', error);
    process.exit(1);
  });
}

module.exports = {
  generateReport,
  checkAPIPerformance,
  checkDatabasePerformance,
  checkFirebasePerformance,
  checkSystemResources
}; 