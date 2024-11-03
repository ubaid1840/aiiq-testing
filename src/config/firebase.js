import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getStorage} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC_4yYWHw4y2KaYAZPiDwWsv0wu0NeF2Fs",
  authDomain: "aiiq-turbine-ai-bot.firebaseapp.com",
  projectId: "aiiq-turbine-ai-bot",
  storageBucket: "aiiq-turbine-ai-bot.appspot.com",
  messagingSenderId: "519888108539",
  appId: "1:519888108539:web:28261886fdab41bddca95e"
};

const app = initializeApp(firebaseConfig);
const auth  = getAuth(app)
const provider = new GoogleAuthProvider();
const storage = getStorage(app)

export {auth, provider, app, storage}
