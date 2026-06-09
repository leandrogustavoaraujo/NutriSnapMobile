import { initializeApp, getApps, getApp } from 'firebase/app';

import {
  initializeAuth,
  getAuth,
  Auth,
} from 'firebase/auth';

import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

declare const require: any;

const firebaseConfig = {
  apiKey: 'AIzaSyAw54P5Cc-TaAKLbkrCU43oLjnCZfAAaoQ',
  authDomain: 'nutrisnap-21100.firebaseapp.com',
  projectId: 'nutrisnap-21100',
  storageBucket: 'nutrisnap-21100.firebasestorage.app',
  messagingSenderId: '586786823373',
  appId: '1:586786823373:web:da36d466af2222b3cadd84',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let authInstance: Auth;

try {
  const firebaseAuth = require('firebase/auth');

  authInstance = initializeAuth(app, {
    persistence: firebaseAuth.getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (error) {
  authInstance = getAuth(app);
}

export const auth: Auth = authInstance;

export default app;