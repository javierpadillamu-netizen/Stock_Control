import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { firebaseConfig } from "../config";

// Una sola app de Firebase para los registros y las cuentas
export const app = initializeApp(firebaseConfig);
// Cache compartida entre pestañas: con la app abierta en dos pestañas (o la app
// instalada y una pestaña de Chrome a la vez) la segunda ya no se queda en "Loading".
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const auth = getAuth(app);

// Para probar en local con los emuladores de Firebase (npx firebase-tools emulators:start)
if (import.meta.env.VITE_FIREBASE_EMULATOR === "true") {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}
