const firebase = require('firebase');
const firebaseConfig = {
    apiKey: "AIzaSyBuf5Z37VYdptNI9i-pz5p_J5OQmBvbhoQ",
    authDomain: "helical-liberty-321002.firebaseapp.com",
    projectId: "helical-liberty-321002",
    storageBucket: "helical-liberty-321002.appspot.com",
    messagingSenderId: "207720154270",
    appId: "1:207720154270:web:98a71936d84987b6c0e78f",
    measurementId: "G-WMDE6Z3NKP"
  };
  firebase.initializeApp(firebaseConfig);
  const db=firebase.firestore();
  module.exports = db;
 
  