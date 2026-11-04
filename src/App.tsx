import { useEffect, useState, type ReactNode } from "react";
import { isDemo } from "./config";
import { LISTS, today, type ListKey } from "./schema";
import { RecordForm } from "./components/RecordForm";
import { PondsForm } from "./components/PondsForm";
import { History } from "./components/History";
import { Icon, type IconName } from "./components/Icon";
import { Login } from "./components/Login";
import { Account } from "./components/Account";
import { authService, canEdit, canRead, type Profile, type Session } from "./auth";

type Menu = "water" | "stock";

type Screen =
  | { s: "home" }
  | { s: "menu"; menu: Menu }
  | { s: "form"; list: ListKey }
  | { s: "history"; list: ListKey }
  | { s: "account" };

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

// Sesion de la cuenta: cargando, sin sesion o con el perfil (nombre y rol)
function useSession() {
  const [session, setSession] = useState<Session>({ status: "loading" });
  useEffect(() => authService.subscribe(setSession), []);
  return session;
}

function Shell({ children, profile, onAccount }: { children: ReactNode; profile?: Profile; onAccount?: () => void }) {
  return (
    <div className="app">
      <header>
        <div className="header-inner">
          <span className="brand-icon" aria-hidden="true">
            <Icon name="factory" />
          </span>
          <div className="brand">
            <strong>Production Records</strong>
            <span>{today()}{profile && ` · ${profile.name}`}</span>
          </div>
          {profile && (
            <button className="avatar" aria-label="Account" onClick={onAccount}>
              {profile.name ? profile.name[0].toUpperCase() : "?"}
            </button>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}

export default function App() {
  const session = useSession();
  if (session.status === "loading") {
    return (
      <Shell>
        <main>
          <p className="hint waiting">Loading…</p>
        </main>
      </Shell>
    );
  }
  if (session.status === "signedOut") {
    return (
      <Shell>
        <main>
          <Login />
        </main>
      </Shell>
    );
  }
  const { profile } = session;
  if (!canRead(profile.role)) {
    return (
      <Shell profile={profile}>
        <main>
          <div className="panel waiting">
            <h2 className="section-title">Waiting for approval</h2>
            <p className="hint">
              Your account ({profile.email}) was created. An admin has to give it access before you can see or enter records. This
              page updates on its own once it is approved.
            </p>
            <button className="secondary" onClick={() => void authService.signOut()}>
              Sign out
            </button>
          </div>
        </main>
      </Shell>
    );
  }
  return <Main key={profile.uid} profile={profile} />;
}

function Main({ profile }: { profile: Profile }) {
  const editor = canEdit(profile.role);
  const author = { uid: profile.uid, name: profile.name };
  const [screen, setScreen] = useState<Screen>(editor ? { s: "home" } : { s: "history", list: "irrigation" });
  const [denied, setDenied] = useState(false);

  // Si le quitan el permiso de editor mientras esta en un formulario, vuelve al historial
  const blocked = !editor && (screen.s === "home" || screen.s === "menu" || screen.s === "form");
  useEffect(() => {
    if (blocked) setScreen({ s: "history", list: screen.s === "form" ? screen.list : "irrigation" });
  }, [blocked, screen]);

  function go(next: Screen) {
    if (!editor && (next.s === "home" || next.s === "menu" || next.s === "form")) {
      setDenied(true);
      setScreen({ s: "history", list: next.s === "form" ? next.list : "irrigation" });
      return;
    }
    setDenied(false);
    setScreen(next);
    window.scrollTo(0, 0);
  }

  // Un formulario vuelve al menu de su flujo; Pits y los menus vuelven al inicio
  let back: { to: Screen; label: string } | null = null;
  if (editor && (screen.s === "menu" || screen.s === "history" || screen.s === "account")) back = { to: { s: "home" }, label: "Home" };
  if (!editor && screen.s === "account") back = { to: { s: "history", list: "irrigation" }, label: "Records" };
  if (screen.s === "form") {
    const menu = menuOf(screen.list);
    back = menu ? { to: { s: "menu", menu }, label: MENUS[menu].title } : { to: { s: "home" }, label: "Home" };
  }

  // Pestaña activa de la barra inferior
  const tab =
    screen.s === "home" ? "home" :
    screen.s === "history" ? "history" :
    screen.s === "account" ? "" :
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
    subtitle = `New record · ${profile.name}`;
    body = (
      <>
        <div className="panel">
          {key === "ponds" ? (
            <PondsForm author={author} />
          ) : (
            <RecordForm key={key} list={LISTS[key]} author={author} onSaved={() => {}} />
          )}
        </div>
        <button className="link" onClick={() => go({ s: "history", list: key })}>
          View {LISTS[key].title} records
        </button>
      </>
    );
  } else if (screen.s === "account") {
    title = "Account";
    body = <Account profile={profile} />;
  } else {
    title = "Records";
    subtitle = editor ? "View, edit and export" : "View and export";
    const current = screen.list;
    body = (
      <>
        {denied && <p className="notice bad">Your account can view records only. Ask an admin for editor access.</p>}
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
        <History list={LISTS[current]} author={author} canEdit={editor} />
      </>
    );
  }

  const tabs = editor ? TABS : TABS.filter((t) => t.id === "history");
  return (
    <Shell profile={profile} onAccount={() => go({ s: "account" })}>
      <main>
        {isDemo && <p className="notice demo">Demo mode: records are saved in this browser only.</p>}
        {back && (
          <button className="back" onClick={() => go(back.to)}>
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
      {tabs.length > 1 && (
        <nav className="tabbar" aria-label="Sections">
          {tabs.map((t) => (
            <button key={t.id} className={tab === t.id ? "tab active" : "tab"} aria-current={tab === t.id ? "page" : undefined} onClick={() => go(t.to)}>
              <Icon name={t.icon} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </Shell>
  );
}
