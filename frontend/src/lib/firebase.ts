import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, PhoneAuthProvider, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let facebookProvider: FacebookAuthProvider | undefined;
let phoneProvider: PhoneAuthProvider | undefined;

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  
  // Configure Google Provider
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
  googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  
  // Configure Facebook Provider
  facebookProvider = new FacebookAuthProvider();
  facebookProvider.addScope('email');
  facebookProvider.addScope('public_profile');
  
  // Configure Phone Provider
  phoneProvider = new PhoneAuthProvider(auth);
}

export { app, auth, googleProvider, facebookProvider, phoneProvider }; 