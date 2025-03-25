const admin = require('firebase-admin');

// Initialize Firebase Admin
const initializeFirebase = () => {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
                })
            });
            console.log('Firebase Admin initialized successfully');
        }
        return admin;
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        throw error;
    }
};

module.exports = { initializeFirebase }; 