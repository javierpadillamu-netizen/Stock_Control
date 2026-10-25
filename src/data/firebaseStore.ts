import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  getDoc,
  getDocs,
  initializeFirestore,
  orderBy,
  persistentLocalCache,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc,
  where,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import type { Fields, ListDef, RecordItem } from "../schema";
import { firebaseConfig } from "../config";
import type { Store } from "./store";

// Cada lista es una coleccion de Firestore con el mismo nombre que su clave (irrigation, river, ...).
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { localCache: persistentLocalCache() });
const auth = getAuth(app);

// Para probar en local con los emuladores de Firebase (npx firebase-tools emulators:start)
if (import.meta.env.VITE_FIREBASE_EMULATOR === "true") {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

// Sesion anonima: las reglas de Firestore exigen una sesion para leer o escribir.
let session: Promise<unknown> | null = null;
function ready() {
  session ??= auth.currentUser ? Promise.resolve() : signInAnonymously(auth);
  return session;
}

function toItem(list: ListDef, id: string, data: DocumentData): RecordItem {
  const fields: Fields = {};
  for (const key of ["Title", "Modificado", "ModificadoPor", "FechaModificacion", ...list.fields.map((f) => f.key)]) {
    fields[key] = data[key] ?? null;
  }
  fields.Modificado = fields.Modificado === true;
  const created = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
  return { id, created, fields };
}

export const firebaseStore: Store = {
  async list(list, range) {
    await ready();
    const constraints: QueryConstraint[] = range
      ? [where("Fecha", ">=", range.from), where("Fecha", "<=", range.to), orderBy("Fecha", "desc")]
      : [orderBy("Fecha", "desc")];
    const snap = await getDocs(query(collection(db, list.key), ...constraints));
    return snap.docs.map((d) => toItem(list, d.id, d.data())).sort((a, b) => b.created.localeCompare(a.created));
  },
  async create(list, fields) {
    await ready();
    const ref = await addDoc(collection(db, list.key), { ...fields, createdAt: serverTimestamp() });
    return toItem(list, ref.id, { ...fields, createdAt: Timestamp.now() });
  },
  async update(list, id, fields) {
    await ready();
    const ref = doc(db, list.key, id);
    await updateDoc(ref, fields);
    const snap = await getDoc(ref);
    return toItem(list, id, snap.data() ?? {});
  },
};
