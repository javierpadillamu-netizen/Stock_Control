import { useState, type ReactNode } from "react";
import { isDemo } from "./config";
import { LISTS, today, type ListKey } from "./schema";
import { RecordForm } from "./components/RecordForm";
import { PondsForm } from "./components/PondsForm";
import { History } from "./components/History";
import { Icon, type IconName } from "./components/Icon";

type Menu = "water" | "stock";

type Screen =
  | { s: "home" }
  | { s: "menu"; menu: Menu }
  | { s: "form"; list: ListKey }
  | { s: "history"; list: ListKey };

interface Option {
  list: ListKey;
  label: string;
  hint: string;
  icon: IconName;
}

// Submenus de cada flujo: Water elige la medicion y Stock el tipo de stock
const MENUS: Record<Menu, { title: string; prompt: string; options: Option[] }> = {
  water: {
    title: "Water",
    prompt: "Select a measurement",
    options: [
      { list: "irrigation", label: "Irrigation", hint: "Readings by area and sub-area", icon: "sprinkler" },
      { list: "river", label: "River", hint: "River water intake", icon: "river" },
      { list: "wastewater", label: "Waste Water", hint: "Waste water volume", icon: "drain" },
      { list: "ponds", label: "Ponds", hint: "Available depth for all 12 ponds", icon: "pond" },
    ],
  },
  stock: {
    title: "Stock",
    prompt: "What are you entering?",
    options: [
      { list: "productionStock", label: "Production Stock", hint: "Stock produced in the shift", icon: "factory" },
      { list: "stockOnhand", label: "Stock Onhand", hint: "Stock currently in storage", icon: "warehouse" },
    ],
  },
};

const FLOWS: { label: string; hint: string; icon: IconName; to: Screen }[] = [
  { label: "Water", hint: "Irrigation, River, Waste Water, Ponds", icon: "water", to: { s: "menu", menu: "water" } },
  { label: "Stock", hint: "Production Stock or Stock Onhand", icon: "stock", to: { s: "menu", menu: "stock" } },
  { label: "Pits", hint: "Product quantity by pit and shift", icon: "pits", to: { s: "form", list: "pits" } },
];

const TABS: { id: string; label: string; icon: IconName; to: Screen }[] = [
  { id: "home", label: "Home", icon: "home", to: { s: "home" } },
  { id: "water", label: "Water", icon: "water", to: { s: "menu", menu: "water" } },
  { id: "stock", label: "Stock", icon: "stock", to: { s: "menu", menu: "stock" } },
  { id: "pits", label: "Pits", icon: "pits", to: { s: "form", list: "pits" } },
  { id: "history", label: "Records", icon: "history", to: { s: "history", list: "irrigation" } },
];

function menuOf(list: ListKey): Menu | null {
  const flow = LISTS[list].flow;
  return flow === "Water" ? "water" : flow === "Stock" ? "stock" : null;
}

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

function Card({ label, hint, icon, onClick }: { label: string; hint: string; icon: IconName; onClick: () => void }) {
  return (
    <button className="card" onClick={onClick}>
      <span className="card-icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <span className="card-text">
        <span className="card-label">{label}</span>
        <span className="card-hint">{hint}</span>
      </span>
      <span className="chevron" aria-hidden="true">
        <Icon name="chevron" />
      </span>
    </button>
  );
}

export default function App() {
  const [nombre, setNombre] = useState(loadName);
  const [screen, setScreen] = useState<Screen>({ s: "home" });
  const [nameError, setNameError] = useState(false);

  function go(next: Screen) {
    if (next.s !== "home" && next.s !== "history" && !nombre.trim()) {
      // Sin nombre no se puede registrar: vuelve al inicio y lo pide
      setNameError(true);
      setScreen({ s: "home" });
      setTimeout(() => document.getElementById("nombre")?.focus());
      return;
    }
    saveName(nombre.trim());
    setScreen(next);
    window.scrollTo(0, 0);
  }

  // Un formulario vuelve al menu de su flujo; Pits y los menus vuelven al inicio
  let back: { to: Screen; label: string } | null = null;
  if (screen.s === "menu" || screen.s === "history") back = { to: { s: "home" }, label: "Home" };
  if (screen.s === "form") {
    const menu = menuOf(screen.list);
    back = menu ? { to: { s: "menu", menu }, label: MENUS[menu].title } : { to: { s: "home" }, label: "Home" };
  }

  // Pestaña activa de la barra inferior
  const tab =
    screen.s === "home" ? "home" :
    screen.s === "history" ? "history" :
    screen.s === "menu" ? screen.menu :
    menuOf(screen.list) ?? "pits";

  let title = "";
  let subtitle: string | null = null;
  let body: ReactNode;
  if (screen.s === "home") {
    body = (
      <>
        <section className="hero-card">
          <span className="hero-icon" aria-hidden="true">
            <Icon name="factory" />
          </span>
          <div>
            <h1>Home</h1>
            <p>Choose an area to start recording.</p>
          </div>
        </section>
        <div className={nameError ? "field name-field has-error" : "field name-field"}>
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
        <h2 className="section-title">Areas</h2>
        <p className="section-sub">Select where you are recording</p>
        <div className="cards">
          {FLOWS.map((f) => (
            <Card key={f.label} label={f.label} hint={f.hint} icon={f.icon} onClick={() => go(f.to)} />
          ))}
        </div>
      </>
    );
  } else if (screen.s === "menu") {
    const menu = MENUS[screen.menu];
    title = menu.title;
    subtitle = menu.prompt;
    body = (
      <div className="cards">
        {menu.options.map((o) => (
          <Card key={o.list} label={o.label} hint={o.hint} icon={o.icon} onClick={() => go({ s: "form", list: o.list })} />
        ))}
      </div>
    );
  } else if (screen.s === "form") {
    const key = screen.list;
    title = LISTS[key].title;
    subtitle = `New record · ${nombre.trim()}`;
    body = (
      <>
        <div className="panel">
          {key === "ponds" ? (
            <PondsForm nombre={nombre.trim()} />
          ) : (
            <RecordForm key={key} list={LISTS[key]} nombre={nombre.trim()} onSaved={() => {}} />
          )}
        </div>
        <button className="link" onClick={() => go({ s: "history", list: key })}>
          View {LISTS[key].title} records
        </button>
      </>
    );
  } else {
    title = "Records";
    subtitle = "View, edit and export";
    const current = screen.list;
    body = (
      <>
        <div className="field">
          <label htmlFor="h-list">Record type</label>
          <select id="h-list" value={current} onChange={(e) => setScreen({ s: "history", list: e.target.value as ListKey })}>
            {Object.values(LISTS).map((l) => (
              <option key={l.key} value={l.key}>
                {l.flow === l.title ? l.title : `${l.flow} · ${l.title}`}
              </option>
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

  const name = nombre.trim();
  return (
    <div className="app">
      <header>
        <div className="header-inner">
          <span className="brand-icon" aria-hidden="true">
            <Icon name="factory" />
          </span>
          <div className="brand">
            <strong>Production Records</strong>
            <span>{today()}{name && ` · ${name}`}</span>
          </div>
          <button className="avatar" aria-label="Change name" onClick={() => setScreen({ s: "home" })}>
            {name ? name[0].toUpperCase() : "?"}
          </button>
        </div>
      </header>
      <main>
        {isDemo && <p className="notice demo">Demo mode: records are saved in this browser only.</p>}
        {back && (
          <button className="back" onClick={() => setScreen(back.to)}>
            <Icon name="back" />
            {back.label}
          </button>
        )}
        {title && (
          <div className="page-head">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        )}
        {body}
      </main>
      <nav className="tabbar" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "tab active" : "tab"} aria-current={tab === t.id ? "page" : undefined} onClick={() => go(t.to)}>
            <Icon name={t.icon} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
