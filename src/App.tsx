import { useEffect, useState } from "react";
import type { AccountInfo } from "@azure/msal-browser";
import { isDemo } from "./config";
import { LISTS, type ListKey } from "./schema";
import { initAuth, login, logout } from "./data/auth";
import { RecordForm } from "./components/RecordForm";
import { PondsForm } from "./components/PondsForm";
import { History } from "./components/History";

type Screen =
  | { s: "home" }
  | { s: "water" }
  | { s: "form"; list: ListKey }
  | { s: "ponds" }
  | { s: "history"; list: ListKey };

const WATER: { list: ListKey; label: string }[] = [
  { list: "irrigation", label: "Irrigation" },
  { list: "river", label: "River" },
  { list: "wastewater", label: "Waste Water" },
  { list: "ponds", label: "Ponds" },
];

function loadName() {
  try {
    return localStorage.getItem("registros:nombre") ?? "";
  } catch {
    return "";
  }
}

function saveName(n: string) {
  try {
    localStorage.setItem("registros:nombre", n);
  } catch {
    // Sin almacenamiento local solo se pierde el nombre recordado
  }
}

export default function App() {
  const [ready, setReady] = useState(isDemo);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [nombre, setNombre] = useState(loadName);
  const [screen, setScreen] = useState<Screen>({ s: "home" });
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    if (isDemo) return;
    initAuth()
      .then((acc) => {
        setAccount(acc);
        if (acc && !loadName()) setNombre(acc.name ?? "");
      })
      .catch((e) => setAuthError(e instanceof Error ? e.message : String(e)))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return <div className="app"><p className="hint">Cargando…</p></div>;

  if (!isDemo && !account) {
    return (
      <div className="app">
        <header><h1>Registros de producción</h1></header>
        <main>
          <p>Inicia sesión con tu cuenta de la empresa para registrar datos.</p>
          {authError && <p className="notice bad">{authError}</p>}
          <button className="primary" onClick={() => void login()}>Iniciar sesión con Microsoft</button>
        </main>
      </div>
    );
  }

  function go(next: Screen) {
    if (next.s !== "home" && next.s !== "history" && !nombre.trim()) {
      setNameError(true);
      return;
    }
    saveName(nombre.trim());
    setScreen(next);
    window.scrollTo(0, 0);
  }

  const back =
    screen.s === "home" ? null :
    screen.s === "form" || screen.s === "ponds"
      ? (LISTS[screen.s === "ponds" ? "ponds" : screen.list].flow === "Water" ? { s: "water" as const } : { s: "home" as const })
      : { s: "home" as const };

  let title = "Registros de producción";
  let body;
  if (screen.s === "home") {
    body = (
      <>
        <div className={nameError ? "field has-error" : "field"}>
          <label htmlFor="nombre">Tu nombre</label>
          <input
            id="nombre"
            value={nombre}
            autoComplete="name"
            onChange={(e) => {
              setNombre(e.target.value);
              setNameError(false);
            }}
          />
          {nameError && <p className="error">Escribe tu nombre antes de continuar</p>}
        </div>
        <div className="tiles">
          <button className="tile water" onClick={() => go({ s: "water" })}>Water</button>
          <button className="tile stock" onClick={() => go({ s: "form", list: "stock" })}>Stock</button>
          <button className="tile pits" onClick={() => go({ s: "form", list: "pits" })}>Pits</button>
        </div>
        <button className="link" onClick={() => go({ s: "history", list: "irrigation" })}>Ver y editar registros</button>
      </>
    );
  } else if (screen.s === "water") {
    title = "Water";
    body = (
      <div className="tiles">
        {WATER.map((w) => (
          <button key={w.list} className="tile water" onClick={() => go(w.list === "ponds" ? { s: "ponds" } : { s: "form", list: w.list })}>
            {w.label}
          </button>
        ))}
      </div>
    );
  } else if (screen.s === "form" || screen.s === "ponds") {
    const key: ListKey = screen.s === "ponds" ? "ponds" : screen.list;
    title = LISTS[key].title;
    body = (
      <>
        {screen.s === "ponds" ? (
          <PondsForm nombre={nombre.trim()} />
        ) : (
          <RecordForm key={key} list={LISTS[key]} nombre={nombre.trim()} onSaved={() => {}} />
        )}
        <button className="link" onClick={() => go({ s: "history", list: key })}>Ver registros de {LISTS[key].title}</button>
      </>
    );
  } else {
    title = "Registros";
    const current = screen.list;
    body = (
      <>
        <div className="field">
          <label htmlFor="h-list">Lista</label>
          <select id="h-list" value={current} onChange={(e) => setScreen({ s: "history", list: e.target.value as ListKey })}>
            {Object.values(LISTS).map((l) => (
              <option key={l.key} value={l.key}>{l.flow === "Water" ? `Water · ${l.title}` : l.title}</option>
            ))}
          </select>
        </div>
        {!nombre.trim() ? (
          <p className="notice bad">Vuelve al inicio y escribe tu nombre para poder editar.</p>
        ) : (
          <History list={LISTS[current]} nombre={nombre.trim()} />
        )}
      </>
    );
  }

  return (
    <div className="app">
      <header>
        {back && <button className="back" aria-label="Volver" onClick={() => setScreen(back)}>‹</button>}
        <h1>{title}</h1>
        {!isDemo && account && screen.s === "home" && (
          <button className="link small" onClick={() => void logout()}>Salir</button>
        )}
      </header>
      {isDemo && <p className="demo">Modo demo: los datos se guardan solo en este navegador.</p>}
      <main>{body}</main>
    </div>
  );
}
