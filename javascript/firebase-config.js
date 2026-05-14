import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFEDyIR0sarvfJVO0Ty6MLxbO-g2Rh0X8",
  authDomain: "perpustakaan-98b3f.firebaseapp.com",
  projectId: "perpustakaan-98b3f",
  storageBucket: "perpustakaan-98b3f.firebasestorage.app",
  messagingSenderId: "105359151878",
  appId: "1:105359151878:web:92c45faea1ff0a22dd4487",
  measurementId: "G-CFTBV4R43Q",
};
 
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);