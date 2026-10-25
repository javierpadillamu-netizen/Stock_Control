import { isDemo } from "../config";
import { localStore } from "./localStore";
import { sharepointStore } from "./sharepointStore";
import type { Store } from "./store";

export const store: Store = isDemo ? localStore : sharepointStore;
