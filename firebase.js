// Conexion Firebase para esta web estatica.
// No uses npm aqui: index.html carga script.js como modulo del navegador,
// por eso los imports son desde la CDN de gstatic (no "firebase/app").
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { collection, getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

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
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const productsCol = collection(db, "products");

export { app, auth, db, firebaseConfig, productsCol, storage };