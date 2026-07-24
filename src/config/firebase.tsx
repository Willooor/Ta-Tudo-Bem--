import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAIoGfd_HFsRvrVSmimyvFfedelbzBqdz4",
  authDomain: "expotec-ta-tudo-bem.firebaseapp.com",
  projectId: "expotec-ta-tudo-bem",
  storageBucket: "expotec-ta-tudo-bem.firebasestorage.app",
  messagingSenderId: "272494947580",
  appId: "1:272494947580:web:e5efbf80e699f83556bb79"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);