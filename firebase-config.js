// Firebase configuration for NicMarkets505.
// If you create another Firebase project, replace only this object.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHysbWt29vYsDip1HAIgHExXx2QVTRmWQ",
  authDomain: "nicmarkets505.firebaseapp.com",
  projectId: "nicmarkets505",
  storageBucket: "nicmarkets505.firebasestorage.app",
  messagingSenderId: "416081307113",
  appId: "1:416081307113:web:921d548dc721bca3929778",
  measurementId: "G-80T2TR9RYZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const productsCol = collection(db, "products");

export { app, auth, db, storage, productsCol };
