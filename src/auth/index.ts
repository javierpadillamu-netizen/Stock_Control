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
        load().then(
          (a) => {
            if (!cancelled) stop = a.subscribe(cb);
          },
          () => {
            // No se pudo bajar el modulo de cuentas (version vieja en cache o sin red):
            // se recarga una vez para traer la version publicada.
            try {
              if (sessionStorage.getItem("auth-reload")) return;
              sessionStorage.setItem("auth-reload", "1");
            } catch {
              return;
            }
            window.location.reload();
          },
        );
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
