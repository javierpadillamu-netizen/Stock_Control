// Configuracion web de Firebase, de Configuracion del proyecto > Tus apps > Configuracion del SDK.
// No es secreta: la base de datos la protegen las reglas de firestore.rules.
// Mientras apiKey, projectId y appId esten vacios, la app corre en modo demo (datos solo en el navegador).
const FIREBASE = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  appId: "",
};

// Las variables VITE_FIREBASE_* (por ejemplo en .env.local) reemplazan estos valores, util para pruebas locales.
const env = import.meta.env;
export const firebaseConfig = {
  apiKey: (env.VITE_FIREBASE_API_KEY as string | undefined) || FIREBASE.apiKey,
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || FIREBASE.authDomain,
  projectId: (env.VITE_FIREBASE_PROJECT_ID as string | undefined) || FIREBASE.projectId,
  appId: (env.VITE_FIREBASE_APP_ID as string | undefined) || FIREBASE.appId,
};

export const isDemo = !(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
