// Roles de las cuentas:
// pending: se registro y espera que un admin le asigne un rol, no ve datos
// viewer: ve los registros y exporta a Excel
// editor: ademas registra y corrige
// admin: ademas aprueba cuentas y cambia roles
export type Role = "pending" | "viewer" | "editor" | "admin";

export const ROLES: { role: Role; label: string; hint: string }[] = [
  { role: "pending", label: "Pending", hint: "No access yet" },
  { role: "viewer", label: "Viewer", hint: "Views and exports records" },
  { role: "editor", label: "Editor", hint: "Also enters and corrects records" },
  { role: "admin", label: "Admin", hint: "Also approves accounts and changes roles" },
];

export function roleLabel(role: Role) {
  return ROLES.find((r) => r.role === role)?.label ?? role;
}

export interface Profile {
  uid: string;
  email: string;
  name: string;
  role: Role;
}

export type Session = { status: "loading" } | { status: "signedOut" } | { status: "signedIn"; profile: Profile };

export const canRead = (role: Role) => role !== "pending";
export const canEdit = (role: Role) => role === "editor" || role === "admin";
export const isAdmin = (role: Role) => role === "admin";

export function isRole(v: unknown): v is Role {
  return v === "pending" || v === "viewer" || v === "editor" || v === "admin";
}

export interface AuthService {
  // Avisa cada vez que cambia la sesion o el rol de la cuenta; devuelve la funcion para dejar de escuchar
  subscribe(cb: (s: Session) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(name: string, email: string, password: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  signOut(): Promise<void>;
  // Solo admin
  listUsers(): Promise<Profile[]>;
  setRole(uid: string, role: Role): Promise<void>;
}

// Mensajes legibles para los errores de Firebase Auth y Firestore
export function authErrorMessage(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password";
    case "auth/invalid-email":
      return "Enter a valid email";
    case "auth/email-already-in-use":
      return "There is already an account with this email. Sign in instead.";
    case "auth/weak-password":
      return "Use a password of at least 6 characters";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/network-request-failed":
    case "unavailable":
      return "No connection. Check your internet and try again.";
    case "auth/operation-not-allowed":
      return "Email sign-in is not enabled in Firebase yet.";
    case "permission-denied":
      return "Your account does not have permission to do this.";
  }
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}
