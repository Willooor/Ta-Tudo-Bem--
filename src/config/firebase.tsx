// src/config/firebase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
// @ts-expect-error - O tipo foi removido no Firebase v12, mas a função existe em runtime
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyAIoGfd_HFsRvrVSmimyvFfedelbzBqdz4",
  authDomain: "expotec-ta-tudo-bem.firebaseapp.com",
  projectId: "expotec-ta-tudo-bem",
  storageBucket: "expotec-ta-tudo-bem.firebasestorage.app",
  messagingSenderId: "272494947580",
  appId: "1:272494947580:web:e5efbf80e699f83556bb79"
};

const app = initializeApp(firebaseConfig);


export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export const db = getFirestore(app);