import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACU5EOpmrelbqigXxUcaMgswqZrx3Acdo",
  authDomain: "volley-team-app-1f4ba.firebaseapp.com",
  projectId: "volley-team-app-1f4ba",
  storageBucket: "volley-team-app-1f4ba.firebasestorage.app",
  messagingSenderId: "697170615974",
  appId: "1:697170615974:web:62c1fb496a358f1cec9e67",
  measurementId: "G-CST0JGG1WK"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// On exporte l'authentification et la base de données pour les utiliser ailleurs
export const auth = getAuth(app);
export const db = getFirestore(app);