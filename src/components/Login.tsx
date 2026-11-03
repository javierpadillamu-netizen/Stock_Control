import { useState } from "react";
import { authErrorMessage, authService } from "../auth";
import { isDemo } from "../config";
import { Icon } from "./Icon";

type Mode = "signIn" | "signUp" | "reset";

// Entrada con correo y contraseña. Una cuenta nueva queda pendiente hasta que un admin le da un rol.
export function Login() {
  const [mode, setMode] = useState<Mode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function switchTo(m: Mode) {
    setMode(m);
    setMessage(null);
  }

  async function submit() {
    if (mode === "signUp" && name.trim().length < 2) return setMessage({ ok: false, text: "Enter your first and last name" });
    if (!email.trim()) return setMessage({ ok: false, text: "Enter your email" });
    if (mode !== "reset" && !password) return setMessage({ ok: false, text: "Enter your password" });
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signIn") await authService.signIn(email, password);
      else if (mode === "signUp") await authService.signUp(name, email, password);
      else {
        await authService.resetPassword(email);
        setMessage({ ok: true, text: "If there is an account with this email, you will receive a link to set a new password." });
      }
    } catch (e) {
      setMessage({ ok: false, text: authErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signIn" ? "Sign in" : mode === "signUp" ? "Create account" : "Reset password";
  return (
    <div className="login">
      <section className="hero-card">
        <span className="hero-icon" aria-hidden="true">
          <Icon name="factory" />
        </span>
        <div>
          <h1>Production Records</h1>
          <p>{mode === "signUp" ? "An admin will approve your account." : "Sign in with your work account."}</p>
        </div>
      </section>
      {isDemo && <p className="notice demo">Demo mode: any email and password work, and the account is an admin.</p>}
      <form
        className="panel form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <h2 className="section-title login-title">{title}</h2>
        {mode === "signUp" && (
          <div className="field">
            <label htmlFor="l-name">Full name</label>
            <input id="l-name" value={name} autoComplete="name" placeholder="First and last name" onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="l-email">Email</label>
          <input id="l-email" type="email" value={email} autoComplete="email" inputMode="email" onChange={(e) => setEmail(e.target.value)} />
        </div>
        {mode !== "reset" && (
          <div className="field">
            <label htmlFor="l-pass">Password</label>
            <input
              id="l-pass"
              type="password"
              value={password}
              autoComplete={mode === "signUp" ? "new-password" : "current-password"}
              placeholder={mode === "signUp" ? "At least 6 characters" : ""}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}
        {message && <p className={message.ok ? "notice ok" : "notice bad"}>{message.text}</p>}
        <button type="submit" className="primary" disabled={busy}>
          {busy ? "Please wait…" : mode === "signIn" ? "Sign in" : mode === "signUp" ? "Create account" : "Send reset link"}
        </button>
        <div className="login-links">
          {mode !== "signIn" && (
            <button type="button" className="link" onClick={() => switchTo("signIn")}>
              I already have an account
            </button>
          )}
          {mode !== "signUp" && (
            <button type="button" className="link" onClick={() => switchTo("signUp")}>
              Create an account
            </button>
          )}
          {mode === "signIn" && (
            <button type="button" className="link" onClick={() => switchTo("reset")}>
              Forgot your password?
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
