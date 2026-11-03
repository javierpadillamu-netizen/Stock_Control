import { isDemo } from "../config";
import { demoAuth } from "./demoAuth";
import type { AuthService } from "./types";

export * from "./types";

// Firebase se carga solo cuando esta configurado
const load = () => import("./firebaseAuth").then((m) => m.firebaseAuth);

export const authService: AuthService = isDemo
  ? demoAuth
  : {
      subscribe(cb) {
        let stop: (() => void) | null = null;
        let cancelled = false;
        cb({ status: "loading" });
        void load().then((a) => {
          if (!cancelled) stop = a.subscribe(cb);
        });
        return () => {
          cancelled = true;
          stop?.();
        };
      },
      signIn: async (...a) => (await load()).signIn(...a),
      signUp: async (...a) => (await load()).signUp(...a),
      resetPassword: async (...a) => (await load()).resetPassword(...a),
      signOut: async () => (await load()).signOut(),
      listUsers: async () => (await load()).listUsers(),
      setRole: async (...a) => (await load()).setRole(...a),
    };
