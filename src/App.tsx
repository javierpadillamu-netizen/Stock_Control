import { useState } from "react";
import { isDemo } from "./config";
import { LISTS, type ListKey } from "./schema";
import { RecordForm } from "./components/RecordForm";
import { PondsForm } from "./components/PondsForm";
import { History } from "./components/History";

type Screen =
  | { s: "home" }
  | { s: "water" }
  | { s: "form"; list: ListKey }
  | { s: "ponds" }
  | { s: "history"; list: ListKey };

const WATER: { list: ListKey; label: string; hint: string }[] = [
  { list: "irrigation", label: "Irrigation", hint: "Readings by area and sub-area" },
  { list: "river", label: "River", hint: "River water intake" },
  { list: "wastewater", label: "Waste Water", hint: "Waste water volume" },
  { list: "ponds", label: "Ponds", hint: "Available depth for all 12 ponds" },
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
    // Without local storage only the remembered name is lost
  }
}

function Tile({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button className="tile" onClick={onClick}>
      <span className="tile-text">
        <span className="tile-label">{label}</span>
        <span className="tile-hint">{hint}</span>
      </span>
      <span className="chevron" aria-hidden="true">›</span>
    </button>
  );
}

export default function App() {
  const [nombre, setNombre] = useState(loadName);
  const [screen, setScreen] = useState<Screen>({ s: "home" });
  const [nameError, setNameError] = useState(false);

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

  let title = "Production Records";
  let section: string | null = null;
  let body;
  if (screen.s === "home") {
    body = (
      <>
        <div className={nameError ? "field has-error" : "field"}>
          <label htmlFor="nombre">Your name</label>
          <input
            id="nombre"
            value={nombre}
            autoComplete="name"
            placeholder="First and last name"
            onChange={(e) => {
              setNombre(e.target.value);
              setNameError(false);
            }}
          />
          {nameError && <p className="error">Enter your name to continue</p>}
        </div>
        <h2 className="section-label">Select a flow</h2>
        <div className="tiles">
          <Tile label="Water" hint="Irrigation, River, Waste Water, Ponds" onClick={() => go({ s: "water" })} />
          <Tile label="Stock" hint="Product stock by shift" onClick={() => go({ s: "form", list: "stock" })} />
          <Tile label="Pits" hint="Product quantity by pit and shift" onClick={() => go({ s: "form", list: "pits" })} />
        </div>
        <button className="link" onClick={() => go({ s: "history", list: "irrigation" })}>View and edit records</button>
      </>
    );
  } else if (screen.s === "water") {
    title = "Water";
    body = (
      <>
        <h2 className="section-label">Select a measurement</h2>
        <div className="tiles">
          {WATER.map((w) => (
            <Tile key={w.list} label={w.label} hint={w.hint} onClick={() => go(w.list === "ponds" ? { s: "ponds" } : { s: "form", list: w.list })} />
          ))}
        </div>
      </>
    );
  } else if (screen.s === "form" || screen.s === "ponds") {
    const key: ListKey = screen.s === "ponds" ? "ponds" : screen.list;
    title = LISTS[key].title;
    section = LISTS[key].flow === "Water" ? "Water" : null;
    body = (
      <>
        {screen.s === "ponds" ? (
          <PondsForm nombre={nombre.trim()} />
        ) : (
          <RecordForm key={key} list={LISTS[key]} nombre={nombre.trim()} onSaved={() => {}} />
        )}
        <button className="link" onClick={() => go({ s: "history", list: key })}>View {LISTS[key].title} records</button>
      </>
    );
  } else {
    title = "Records";
    const current = screen.list;
    body = (
      <>
        <div className="field">
          <label htmlFor="h-list">Record type</label>
          <select id="h-list" value={current} onChange={(e) => setScreen({ s: "history", list: e.target.value as ListKey })}>
            {Object.values(LISTS).map((l) => (
              <option key={l.key} value={l.key}>{l.flow === "Water" ? `Water · ${l.title}` : l.title}</option>
            ))}
          </select>
        </div>
        {!nombre.trim() ? (
          <p className="notice bad">Go back and enter your name to view and edit records.</p>
        ) : (
          <History list={LISTS[current]} nombre={nombre.trim()} />
        )}
      </>
    );
  }

  return (
    <div className="app">
      <header>
        <div className="header-inner">
          {back && <button className="back" aria-label="Back" onClick={() => setScreen(back)}>‹</button>}
          <div className="header-titles">
            {section && <span className="eyebrow">{section}</span>}
            <h1>{title}</h1>
          </div>
        </div>
      </header>
      {isDemo && <p className="demo">Demo mode: records are saved in this browser only.</p>}
      <main>{body}</main>
    </div>
  );
}
