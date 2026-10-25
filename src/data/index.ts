import { isDemo } from "../config";
import { localStore } from "./localStore";
import type { Store } from "./store";

// Firebase se carga solo cuando esta configurado
export const store: Store = isDemo
  ? localStore
  : {
      list: async (...a) => (await import("./firebaseStore")).firebaseStore.list(...a),
      create: async (...a) => (await import("./firebaseStore")).firebaseStore.create(...a),
      update: async (...a) => (await import("./firebaseStore")).firebaseStore.update(...a),
    };
