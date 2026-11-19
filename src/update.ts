// Actualizacion automatica de la app instalada en el telefono.
// Cada publicacion genera version.json con un identificador nuevo. La app lo
// consulta sin cache al abrirse y al volver a primer plano; si cambio, recarga
// la pagina saltandose la cache para traer la version nueva.

declare const __APP_VERSION__: string;

const CURRENT = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev";
const TRIED_KEY = "update-tried";

async function latestVersion(): Promise<string | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return typeof data.version === "string" ? data.version : null;
  } catch {
    return null; // sin conexion: seguimos con la version actual
  }
}

function readTried(): string | null {
  try {
    return sessionStorage.getItem(TRIED_KEY);
  } catch {
    return null;
  }
}

/** Recarga trayendo la version nueva (el parametro evita que el telefono use la pagina guardada). */
export function reloadToLatest(version: string) {
  try {
    sessionStorage.setItem(TRIED_KEY, version);
  } catch {
    // sin almacenamiento: recargamos igual
  }
  const url = new URL(window.location.href);
  url.searchParams.set("v", version);
  window.location.replace(url.toString());
}

/** Devuelve la version publicada si es distinta de la que esta corriendo. */
export async function checkForUpdate(): Promise<string | null> {
  if (import.meta.env.DEV) return null;
  const latest = await latestVersion();
  if (!latest || latest === CURRENT) return null;
  // Si ya intentamos recargar a esta version y seguimos en la vieja, no entramos en bucle.
  if (readTried() === latest) return null;
  return latest;
}

/** Revisa al abrir la app y, si hay version nueva, recarga antes de que se use. */
export async function updateOnStart() {
  const latest = await checkForUpdate();
  if (latest) reloadToLatest(latest);
}
