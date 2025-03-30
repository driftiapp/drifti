'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { User } from 'firebase/auth';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      logger.error('Firebase auth is not initialized', {
        component: 'AuthContext',
        action: 'initialization'
      });
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    if (!auth) {
      logger.error('Firebase auth is not initialized', {
        component: 'AuthContext',
        action: 'signOut'
      });
      throw new Error('Firebase auth is not initialized');
    }

    try {
      await auth.signOut();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error during sign out');
      logger.error('Failed to sign out', {
        component: 'AuthContext',
        action: 'signOut',
        error
      });
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 