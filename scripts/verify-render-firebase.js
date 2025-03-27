const axios = require('axios');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICES = {
  backend: 'https://drifti-backend.onrender.com',
  frontend: 'https://drifti-frontend.onrender.com'
};

async function checkRenderServices() {
  console.log('Checking Render services...\n');
  
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      console.log(`Verifying ${name} service...`);
      
      // Check service health
      const healthResponse = await axios.get(`${url}/health`);
      console.log(`Health check: ${healthResponse.status === 200 ? '✅' : '❌'}`);
      
      // Check environment variables
      const envResponse = await axios.get(`${url}/api/env-check`);
      console.log('Environment variables:', envResponse.data);
      
      // Check build status
      const buildResponse = await axios.get(`${url}/api/build-info`);
      console.log('Build information:', buildResponse.data);
      
      console.log(`${name} service verification complete\n`);
    } catch (error) {
      console.error(`Error checking ${name} service:`, error.message);
    }
  }
}

async function checkFirebaseConfig() {
  console.log('Checking Firebase configuration...\n');
  
  try {
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
    }
    
    // Check Firebase project
    const projectId = admin.app().options.projectId;
    console.log('Firebase Project ID:', projectId);
    
    // Check Authentication
    const auth = admin.auth();
    const users = await auth.listUsers(1);
    console.log('Authentication status: ✅');
    console.log('User count:', users.users.length);
    
    // Check Firestore
    const firestore = admin.firestore();
    await firestore.collection('test').limit(1).get();
    console.log('Firestore status: ✅');
    
    // Check Storage
    const storage = admin.storage();
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ maxResults: 1 });
    console.log('Storage status: ✅');
    console.log('Storage bucket:', bucket.name);
    
    // Check Security Rules
    const rules = await admin.securityRules().getRules();
    console.log('Security Rules status: ✅');
    console.log('Rules version:', rules.version);
    
    // Check Environment Variables
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_STORAGE_BUCKET'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.warn('Missing environment variables:', missingVars);
    } else {
      console.log('Environment variables: ✅');
    }
    
    console.log('\nFirebase configuration verification complete');
  } catch (error) {
    console.error('Firebase verification failed:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.stack) console.error('Stack trace:', error.stack);
  }
}

async function checkFrontendFirebase() {
  console.log('Checking Frontend Firebase configuration...\n');
  
  try {
    // Check frontend environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.warn('Missing frontend environment variables:', missingVars);
    } else {
      console.log('Frontend environment variables: ✅');
    }
    
    // Check Firebase config file
    const firebaseConfigPath = path.join(__dirname, '../frontend/src/config/firebase.ts');
    if (fs.existsSync(firebaseConfigPath)) {
      const configContent = fs.readFileSync(firebaseConfigPath, 'utf8');
      const hasRequiredConfig = requiredEnvVars.every(varName => 
        configContent.includes(`process.env.${varName}`)
      );
      
      if (hasRequiredConfig) {
        console.log('Firebase config file: ✅');
      } else {
        console.warn('Firebase config file is missing some environment variables');
      }
    } else {
      console.error('Firebase config file not found');
    }
    
    console.log('\nFrontend Firebase verification complete');
  } catch (error) {
    console.error('Frontend Firebase verification failed:', error.message);
  }
}

async function verifyDeployments() {
  console.log('Starting Render and Firebase verification...\n');
  
  try {
    // Check Render services
    await checkRenderServices();
    
    // Check Firebase configuration
    await checkFirebaseConfig();
    
    // Check Frontend Firebase
    await checkFrontendFirebase();
    
    console.log('\nVerification complete!');
  } catch (error) {
    console.error('Verification failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  verifyDeployments();
}

module.exports = {
  verifyDeployments,
  checkRenderServices,
  checkFirebaseConfig,
  checkFrontendFirebase
}; 