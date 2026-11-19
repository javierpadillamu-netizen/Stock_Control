import { useEffect, useState } from "react";
import { checkForUpdate, reloadToLatest } from "../update";

// Cada cuanto se revisa si hay version nueva mientras la app esta abierta
const INTERVAL_MS = 5 * 60 * 1000;

// Aviso que aparece cuando se publica una version nueva con la app abierta.
// No recarga sola para no perder lo que se este escribiendo en un formulario.
export function UpdateBanner() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const check = () => {
      if (document.visibilityState === "visible") checkForUpdate().then((v) => v && setVersion(v));
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    const timer = window.setInterval(check, INTERVAL_MS);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.clearInterval(timer);
    };
  }, []);

  if (!version) return null;
  return (
    <div className="update-banner" role="status">
      <span>A new version of the app is available.</span>
      <button className="primary" onClick={() => reloadToLatest(version)}>
        Update
      </button>
    </div>
  );
}
