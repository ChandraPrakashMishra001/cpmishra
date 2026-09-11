// Firebase client for BloomSense (bloomsense-9cf96)
// Web API key is a public identifier; security is enforced via Firestore rules.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiawVZrk5pifFBoDuJSibbvuw0Kv3Yvcc",
  authDomain: "bloomsense-9cf96.firebaseapp.com",
  databaseURL: "https://bloomsense-9cf96-default-rtdb.firebaseio.com",
  projectId: "bloomsense-9cf96",
  storageBucket: "bloomsense-9cf96.firebasestorage.app",
  messagingSenderId: "113263280584",
  appId: "1:113263280584:web:1d976e9833b94d00a680fd",
  measurementId: "G-LLGJ4EGW9W",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// Offline-first: keep field logs in an IndexedDB-backed cache so reads work with
// zero internet and writes queue locally until the device reconnects.
let firestore: Firestore;
try {
  firestore = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  // Already initialized (HMR) or persistence unsupported in this browser.
  firestore = getFirestore(firebaseApp);
}

export const db = firestore;

export const FIELD_LOGS_COLLECTION = "amanai_field_logs";
