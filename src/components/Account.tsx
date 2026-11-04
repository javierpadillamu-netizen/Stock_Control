import { useCallback, useEffect, useState } from "react";
import { authErrorMessage, authService, isAdmin, roleLabel, ROLES, type Profile, type Role } from "../auth";

// Datos de la cuenta y, para un admin, la lista de cuentas para aprobar y cambiar roles
export function Account({ profile }: { profile: Profile }) {
  return (
    <>
      <div className="panel account">
        <p className="account-name">{profile.name}</p>
        <p className="hint">{profile.email}</p>
        <p>
          Role: <strong>{roleLabel(profile.role)}</strong>
        </p>
        <button className="secondary" onClick={() => void authService.signOut()}>
          Sign out
        </button>
      </div>
      {isAdmin(profile.role) && <Users me={profile} />}
    </>
  );
}

function Users({ me }: { me: Profile }) {
  const [users, setUsers] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const all = await authService.listUsers();
      // Las pendientes primero, luego por nombre
      all.sort((a, b) => Number(b.role === "pending") - Number(a.role === "pending") || a.name.localeCompare(b.name));
      setUsers(all);
    } catch (e) {
      setError(authErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function change(u: Profile, role: Role) {
    setSaving(u.uid);
    setError(null);
    try {
      await authService.setRole(u.uid, role);
      setUsers((prev) => (prev ?? []).map((x) => (x.uid === u.uid ? { ...x, role } : x)));
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setSaving(null);
    }
  }

  const pending = (users ?? []).filter((u) => u.role === "pending").length;
  return (
    <>
      <h2 className="section-title">Users</h2>
      <p className="section-sub">
        {pending > 0 ? `${pending} ${pending === 1 ? "account is" : "accounts are"} waiting for approval` : "Give each account a role"}
      </p>
      {error && <p className="notice bad">{error}</p>}
      {users === null && !error && <p className="hint">Loading…</p>}
      <ul className="records">
        {(users ?? []).map((u) => (
          <li key={u.uid} className={u.role === "pending" ? "record modified" : "record"}>
            <div className="user-row">
              <div className="user-text">
                <strong>{u.name || "(no name)"}</strong>
                <span className="hint">{u.email}</span>
              </div>
              {u.uid === me.uid ? (
                <span className="badge">{roleLabel(u.role)} · you</span>
              ) : (
                <select
                  aria-label={`Role of ${u.name}`}
                  value={u.role}
                  disabled={saving === u.uid}
                  onChange={(e) => void change(u, e.target.value as Role)}
                >
                  {ROLES.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </li>
        ))}
      </ul>
      <ul className="hint role-help">
        {ROLES.map((r) => (
          <li key={r.role}>
            <strong>{r.label}:</strong> {r.hint}
          </li>
        ))}
      </ul>
    </>
  );
}
