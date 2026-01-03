import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDAszoqKpN64wmvuwHRNUMPGv5Gjaw2wlw",
  authDomain: "docscan-56408.firebaseapp.com",
  projectId: "docscan-56408",
  storageBucket: "docscan-56408.firebasestorage.app",
  messagingSenderId: "302100100302",
  appId: "1:302100100302:web:3d6a2783bdd50d207bcc9f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
