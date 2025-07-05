// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDUzJaV9K6IW2_O2HrVSm1_QTBkuBVl1Co",
  authDomain: "young-star-platform.firebaseapp.com",
  projectId: "young-star-platform",
  storageBucket: "young-star-platform.firebasestorage.app",
  messagingSenderId: "965704830662",
  appId: "1:965704830662:web:edc7fecf83f2ede880d1c7",
  measurementId: "G-6WPNWP94Q0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);