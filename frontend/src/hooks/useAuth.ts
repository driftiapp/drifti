'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/config/firebase';

interface User extends FirebaseUser {
  role?: 'user' | 'driver' | 'admin';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('token', token);
          
          // Add role to Firebase user
          const user: User = {
            ...firebaseUser,
            role: 'user' // Default role, can be updated from backend
          };
          
          setAuthState({
            user,
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('Error getting user token:', error);
          setAuthState({
            user: null,
            loading: false,
            error: 'Failed to get user token'
          });
        }
      } else {
        localStorage.removeItem('token');
        setAuthState({
          user: null,
          loading: false,
          error: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Email sign-in failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to sign in with email'
      }));
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Email sign-up failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to sign up with email'
      }));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to sign in with Google'
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signOut(auth);
      localStorage.removeItem('token');
      setAuthState({
        user: null,
        loading: false,
        error: null
      });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to sign out'
      }));
      throw error;
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout
  };
}

export default useAuth; 