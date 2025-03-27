const admin = require("firebase-admin");
const path = require('path');
const fs = require('fs');

const initializeFirebase = () => {
    try {
        if (!admin.apps.length) {
            // Similar to Java's FileInputStream for service account
            const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
            
            if (fs.existsSync(serviceAccountPath)) {
                // Read and parse service account file (equivalent to GoogleCredentials.fromStream)
                const serviceAccount = require(serviceAccountPath);
                
                // Similar to FirebaseOptions.Builder in Java
                const options = {
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: "https://drifti-58b5b-default-rtdb.firebaseio.com"
                };

                // Initialize Firebase (equivalent to FirebaseApp.initializeApp)
                admin.initializeApp(options);
                console.log('Firebase Admin initialized successfully using service account file');
            } else {
                console.error('Service account file not found:', serviceAccountPath);
                console.log('Attempting to initialize with environment variables...');
                
                // Fallback to environment variables
                const options = {
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY ? 
                            process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
                    }),
                    databaseURL: "https://drifti-58b5b-default-rtdb.firebaseio.com"
                };

                admin.initializeApp(options);
                console.log('Firebase Admin initialized successfully using environment variables');
            }
        }
        return admin;
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    }
};

// Equivalent to FirebaseApp.getInstance() in Java
const getFirebaseApp = () => {
    if (!admin.apps.length) {
        throw new Error('Firebase has not been initialized. Call initializeFirebase() first.');
    }
    return admin.app();
};

module.exports = { 
    initializeFirebase, 
    getFirebaseApp,
    admin 
}; 