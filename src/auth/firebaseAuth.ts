import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { collection, doc, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../data/firebase";
import { isRole, type AuthService, type Profile } from "./types";

// Cada cuenta tiene un documento users/{uid} con su nombre, correo y rol.
// Lo crea la propia persona al registrarse, siempre con rol "pending";
// solo un admin puede cambiar el rol (ver firestore.rules).
const userRef = (uid: string) => doc(db, "users", uid);

function toProfile(uid: string, data: Record<string, unknown>): Profile {
  return {
    uid,
    email: String(data.email ?? ""),
    name: String(data.name ?? ""),
    role: isRole(data.role) ? data.role : "pending",
  };
}

function createProfile(user: User, name: string) {
  return setDoc(userRef(user.uid), {
    name: name.trim(),
    email: (user.email ?? "").toLowerCase(),
    role: "pending",
    createdAt: serverTimestamp(),
  });
}

// Mientras alguien se registra, el perfil lo crea signUp con el nombre que escribio
let signingUp = false;

export const firebaseAuth: AuthService = {
  subscribe(cb) {
    let stopProfile: (() => void) | null = null;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopProfile?.();
      stopProfile = null;
      // Las sesiones anonimas de la version anterior ya no sirven: se cierran
      if (!user || user.isAnonymous) {
        if (user) void signOut(auth);
        cb({ status: "signedOut" });
        return;
      }
      cb({ status: "loading" });
      stopProfile = onSnapshot(
        userRef(user.uid),
        (snap) => {
          if (!snap.exists()) {
            // El registro quedo a medias (por ejemplo sin conexion): se crea el perfil ahora
            if (!snap.metadata.fromCache && !signingUp) void createProfile(user, user.displayName || (user.email ?? "").split("@")[0]);
            return;
          }
          cb({ status: "signedIn", profile: toProfile(user.uid, snap.data()) });
        },
        () => cb({ status: "signedIn", profile: { uid: user.uid, email: user.email ?? "", name: user.displayName ?? "", role: "pending" } }),
      );
    });
    return () => {
      stopProfile?.();
      stopAuth();
    };
  },
  async signIn(email, password) {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  },
  async signUp(name, email, password) {
    signingUp = true;
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await createProfile(user, name);
      await updateProfile(user, { displayName: name.trim() });
    } finally {
      signingUp = false;
    }
  },
  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email.trim());
  },
  async signOut() {
    await signOut(auth);
  },
  async listUsers() {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => toProfile(d.id, d.data()));
  },
  async setRole(uid, role) {
    await updateDoc(userRef(uid), { role });
  },
};
