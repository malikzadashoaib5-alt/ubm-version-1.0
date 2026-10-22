import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleAuthProvider, db } from '../lib/firebase.ts';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInDemoAccount: (email: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isPlatformAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Super admin email recognized by the system
export const PLATFORM_ADMIN_EMAIL = 'ghaffarhonda15@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync user document
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email || 'user@ubm.app',
              displayName: currentUser.displayName || 'UBM Business Member',
              createdAt: new Date().toISOString()
            });
          }
        } catch (e) {
          console.warn('Could not sync user profile to Firestore:', e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      // Fallback for iframe popup block if any
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/unauthorized-domain') {
        alert('Notice: Sign-in popup was blocked or domain not allowlisted. You can also use the Demo Instant Login option below.');
      }
      throw err;
    }
  };

  const signInDemoAccount = async (email: string, displayName: string) => {
    try {
      // Use Firebase anonymous auth or synthesized authenticated user session
      const cred = await signInAnonymously(auth);
      // Update local storage representation or Firestore user profile
      const userRef = doc(db, 'users', cred.user.uid);
      await setDoc(userRef, {
        uid: cred.user.uid,
        email: email,
        displayName: displayName,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Override the user object with custom email/display name for tenant association
      const customUser = Object.create(cred.user);
      Object.defineProperty(customUser, 'email', { value: email, configurable: true });
      Object.defineProperty(customUser, 'displayName', { value: displayName, configurable: true });
      setUser(customUser);
    } catch (err) {
      console.error('Demo login error:', err);
      // In worst case fallback to direct simulated user
      const mockUser = {
        uid: 'user_demo_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
        email: email,
        displayName: displayName,
        emailVerified: true,
        isAnonymous: false,
        getIdToken: async () => 'mock-token'
      } as unknown as FirebaseUser;
      setUser(mockUser);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setUser(null);
  };

  const isPlatformAdmin = !!(user?.email && user.email.toLowerCase() === PLATFORM_ADMIN_EMAIL.toLowerCase());

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInDemoAccount, signOut, isPlatformAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
