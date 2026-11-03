import type { AuthService, Profile, Session } from "./types";

// Modo demo: sin Firebase, cualquier correo entra como admin y la cuenta queda en este navegador
const KEY = "registros:demo-cuenta";
let current: Profile | null = load();
const listeners = new Set<(s: Session) => void>();

function load(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function set(p: Profile | null) {
  current = p;
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {
    // queda solo en memoria
  }
  for (const cb of listeners) cb(session());
}

const session = (): Session => (current ? { status: "signedIn", profile: current } : { status: "signedOut" });

function profileFor(email: string, name?: string): Profile {
  const e = email.trim().toLowerCase();
  return { uid: `demo-${e}`, email: e, name: name?.trim() || e.split("@")[0], role: "admin" };
}

export const demoAuth: AuthService = {
  subscribe(cb) {
    listeners.add(cb);
    cb(session());
    return () => listeners.delete(cb);
  },
  async signIn(email) {
    set(profileFor(email));
  },
  async signUp(name, email) {
    set(profileFor(email, name));
  },
  async resetPassword() {},
  async signOut() {
    set(null);
  },
  async listUsers() {
    return current ? [current] : [];
  },
  async setRole() {
    throw new Error("Roles can only be changed when the app is connected to Firebase");
  },
};
