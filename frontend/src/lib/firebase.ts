import { initializeApp, getApps, getApp, FirebaseOptions, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

// Validate required environment variables
const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
] as const;

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

// Type assertion to ensure all required fields are strings
const firebaseConfig = {
    apiKey: process.env['NEXT_PUBLIC_FIREBASE_API_KEY'] || '',
    authDomain: process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'] || '',
    projectId: process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] || '',
    storageBucket: process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'] || '',
    messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] || '',
    appId: process.env['NEXT_PUBLIC_FIREBASE_APP_ID'] || '',
    measurementId: process.env['NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID']
} as FirebaseOptions;

// Initialize Firebase with error handling
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | undefined;
let performance: ReturnType<typeof getPerformance> | undefined;

try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Initialize analytics and performance only in production and on client side
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        // Initialize analytics only if supported
        isSupported().then(supported => {
            if (supported) {
                analytics = getAnalytics(app);
            }
        }).catch(console.error);

        // Initialize performance monitoring
        try {
            performance = getPerformance(app);
        } catch (error) {
            console.error('Error initializing performance monitoring:', error);
        }
    }

    // Connect to emulators in development
    if (process.env.NODE_ENV === 'development') {
        if (process.env['NEXT_PUBLIC_USE_FIREBASE_EMULATOR'] === 'true') {
            connectAuthEmulator(auth, 'http://localhost:9099');
            connectFirestoreEmulator(db, 'localhost', 8080);
            connectStorageEmulator(storage, 'localhost', 9199);
        }
    }
} catch (error) {
    console.error('Error initializing Firebase:', error);
    // Re-throw error in production, log in development
    if (process.env.NODE_ENV === 'production') {
        throw error;
    }
    throw error; // Throw in development too to prevent undefined behavior
}

// Export initialized services
export { app, auth, db, storage, analytics, performance };

// Export type-safe service checks
export const isFirebaseInitialized = (): boolean => !!app;
export const isAuthInitialized = (): boolean => !!auth;
export const isDbInitialized = (): boolean => !!db;
export const isStorageInitialized = (): boolean => !!storage;
export const isAnalyticsAvailable = (): boolean => !!analytics;
export const isPerformanceAvailable = (): boolean => !!performance; 