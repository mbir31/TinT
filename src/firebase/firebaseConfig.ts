/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth, User } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const env = (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export const getFirebaseInstance = () => {
  if (typeof window === 'undefined') return { app: null, auth: null, db: null };

  if (isFirebaseConfigured()) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
  }

  return { app, auth, db };
};

export const ensureAnonymousAuth = async (): Promise<string> => {
  const { auth } = getFirebaseInstance();
  if (!auth) {
    // Generate guest token for session
    let guestId = sessionStorage.getItem('tint_guest_uid');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('tint_guest_uid', guestId);
    }
    return guestId;
  }

  try {
    if (auth.currentUser) {
      return auth.currentUser.uid;
    }
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  } catch (err) {
    console.warn('Anonymous auth fallback:', err);
    let guestId = sessionStorage.getItem('tint_guest_uid');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('tint_guest_uid', guestId);
    }
    return guestId;
  }
};
