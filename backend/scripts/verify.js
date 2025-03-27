const mongoose = require('mongoose');
const admin = require('firebase-admin');
const Redis = require('ioredis');
const axios = require('axios');
const WebSocket = require('ws');
const config = require('../config');

const redis = new Redis(config.redis.url);

async function verifyDatabase() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function verifyFirebase() {
  try {
    await admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: config.firebase.storageBucket,
    });
    console.log('✅ Firebase initialization successful');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    return false;
  }
}

async function verifyRedis() {
  try {
    await redis.ping();
    console.log('✅ Redis connection successful');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    return false;
  }
}

async function verifyWebSocket() {
  return new Promise((resolve) => {
    const ws = new WebSocket(config.wsUrl);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection successful');
      ws.close();
      resolve(true);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket connection failed:', error.message);
      resolve(false);
    });
  });
}

async function verifyAPIEndpoints() {
  const endpoints = [
    { path: '/api/health', method: 'GET' },
    { path: '/api/users/me', method: 'GET', auth: true },
    { path: '/api/notifications', method: 'GET', auth: true },
    { path: '/api/challenges', method: 'GET', auth: true },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${config.apiUrl}${endpoint.path}`,
        headers: endpoint.auth ? { Authorization: 'Bearer test-token' } : {},
      });
      
      if (response.status === 200) {
        console.log(`✅ API endpoint ${endpoint.path} is working`);
        results.push(true);
      } else {
        console.log(`❌ API endpoint ${endpoint.path} returned status ${response.status}`);
        results.push(false);
      }
    } catch (error) {
      console.error(`❌ API endpoint ${endpoint.path} failed:`, error.message);
      results.push(false);
    }
  }

  return results.every(result => result);
}

async function verifyFileUpload() {
  try {
    const testFile = Buffer.from('test file content');
    const bucket = admin.storage().bucket();
    
    await bucket.file('test.txt').save(testFile, {
      metadata: { contentType: 'text/plain' },
    });
    
    console.log('✅ File upload test successful');
    return true;
  } catch (error) {
    console.error('❌ File upload test failed:', error.message);
    return false;
  }
}

async function verifyExternalServices() {
  const services = [
    { name: 'Google Maps', url: 'https://maps.googleapis.com/maps/api/geocode/json?address=test' },
    { name: 'Stripe', url: 'https://api.stripe.com/v1/balance' },
  ];

  const results = [];

  for (const service of services) {
    try {
      const response = await axios.get(service.url);
      if (response.status === 200) {
        console.log(`✅ ${service.name} connection successful`);
        results.push(true);
      } else {
        console.log(`❌ ${service.name} connection failed with status ${response.status}`);
        results.push(false);
      }
    } catch (error) {
      console.error(`❌ ${service.name} connection failed:`, error.message);
      results.push(false);
    }
  }

  return results.every(result => result);
}

async function runVerification() {
  console.log('Starting application verification...\n');

  const results = {
    database: await verifyDatabase(),
    firebase: await verifyFirebase(),
    redis: await verifyRedis(),
    websocket: await verifyWebSocket(),
    api: await verifyAPIEndpoints(),
    fileUpload: await verifyFileUpload(),
    externalServices: await verifyExternalServices(),
  };

  console.log('\nVerification Results:');
  console.log('====================');
  Object.entries(results).forEach(([component, success]) => {
    console.log(`${success ? '✅' : '❌'} ${component}`);
  });

  const allPassed = Object.values(results).every(result => result);
  console.log(`\nOverall Status: ${allPassed ? '✅ All components verified successfully' : '❌ Some components failed verification'}`);
  
  process.exit(allPassed ? 0 : 1);
}

runVerification().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
}); 