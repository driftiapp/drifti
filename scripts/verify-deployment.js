const axios = require('axios');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { MongoClient } = require('mongodb');

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

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_PRIVATE_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    await client.db().command({ ping: 1 });
    console.log('✅ MongoDB connection verified');
    await client.close();
    return true;
  } catch (error) {
    console.error('❌ MongoDB verification failed:', error.message);
    return false;
  }
}

async function verifyFirebase() {
  try {
    // Verify Firebase Authentication
    await admin.auth().listUsers(1);
    console.log('✅ Firebase Authentication verified');

    // Verify Firestore
    const db = admin.firestore();
    await db.collection('test').doc('test').get();
    console.log('✅ Firebase Firestore verified');

    // Verify Storage
    const bucket = admin.storage().bucket();
    await bucket.exists();
    console.log('✅ Firebase Storage verified');

    return true;
  } catch (error) {
    console.error('❌ Firebase verification failed:', error.message);
    return false;
  }
}

async function verifyBackend() {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/health`);
    console.log('✅ Backend health check passed');
    return true;
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return false;
  }
}

async function verifyFrontend() {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/health`);
    console.log('✅ Frontend health check passed');
    return true;
  } catch (error) {
    console.error('❌ Frontend health check failed:', error.message);
    return false;
  }
}

async function verifyEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_API_URL',
    'MONGODB_URI',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
}

async function main() {
  console.log('🔍 Starting deployment verification...\n');

  const results = {
    backend: await verifyBackend(),
    frontend: await verifyFrontend(),
    firebase: await verifyFirebase(),
    mongodb: await verifyMongoDB(),
    envVars: await verifyEnvironmentVariables()
  };

  const allPassed = Object.values(results).every(result => result === true);
  
  console.log('\n📊 Verification Results:');
  Object.entries(results).forEach(([service, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${service}`);
  });

  if (!allPassed) {
    console.error('\n❌ Deployment verification failed');
    process.exit(1);
  }

  console.log('\n✅ All verifications passed successfully!');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Verification process failed:', error);
  process.exit(1);
});

module.exports = {
  verifyDeployment: main,
  checkServiceHealth,
  verifyMongoDB,
  verifyFirebase,
  verifyBackend,
  verifyFrontend,
  verifyEnvironmentVariables
}; 