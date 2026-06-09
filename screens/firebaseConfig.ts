import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDbJlcK_QtT0bej0YYOeuMiTCFI7L1mGqA",
  authDomain: "nutrisnap-mobile.firebaseapp.com",
  projectId: "nutrisnap-mobile",
  storageBucket: "nutrisnap-mobile.firebasestorage.app",
  messagingSenderId: "33410351191",
  appId: "1:33410351191:web:6be5ebb431b7f9c1c0a312"
};

const app = initializeApp(firebaseConfig);

export default app;
