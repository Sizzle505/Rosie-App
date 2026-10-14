import React, { useEffect, useRef, useState } from "react";
import { useRosieAccount } from "./AccountContext.jsx";
import styles from "./AccountPortal.module.css";

// An account is never required to play or use a local organizer.
export default function AccountPortal() {
  const { user, checking, connectionError, refresh, login, register, logout } = useRosieAccount();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pinLength, setPinLength] = useState(4);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retryUntil, setRetryUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const trigger = useRef(null);
  const firstInput = useRef(null);
  const dialog = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => (firstInput.current || dialog.current)?.focus(), 30);
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key === "Tab" && dialog.current) {
        const elements = [...dialog.current.querySelectorAll('button:not([disabled]), input:not([disabled])')];
        if (!elements.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKey);
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open, mode, user]);

  useEffect(() => {
    if (!open || !retryUntil) return undefined;
    const tick = () => setRemaining(Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [open, retryUntil]);
  const switchMode = next => { setMode(next); setPin(""); setConfirmPin(""); setError(""); setRetryUntil(0); setRemaining(0); };
  const close = () => { if (!busy) setOpen(false); };
  async function submit(event) {
    event.preventDefault();
    if (busy || remaining > 0) return;
    const name = username.trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,32}$/.test(name)) { setError("Use 3–32 letters, numbers, dots, hyphens or underscores."); return; }
    if (!/^(?:\d{4}|\d{6})$/.test(pin)) { setError("Enter a four- or six-digit PIN."); return; }
    if (mode === "create") {
      if (pin.length !== pinLength) { setError("Please enter the selected PIN length."); return; }
      if (pin !== confirmPin) { setError("The PINs do not match."); return; }
    }
    setBusy(true); setError("");
    try {
      if (mode === "create") await register(name, displayName.trim() || name, pin);
      else await login(name, pin);
      setPin(""); setConfirmPin(""); setOpen(false);
    } catch (issue) {
      setError(issue.message);
      setPin(""); setConfirmPin("");
      if (issue.retryAfter) {
        setRetryUntil(Date.now() + Math.ceil(issue.retryAfter) * 1000);
        setRemaining(Math.ceil(issue.retryAfter));
      }
    } finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setError("");
    try { await logout(); setOpen(false); }
    catch (issue) { setError(issue.message); }
    finally { setBusy(false); }
  }
  return <>
    <button ref={trigger} type="button" className={styles.trigger}
      onClick={() => { setMode("login"); setError(""); setOpen(true); }}
      aria-label={user ? "Open your RosieVerse account" : "Open RosieVerse account sign-in"}
      title={user ? "Account" : "Account"}>
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="10.5" r="5.4" stroke="currentColor" strokeWidth="1.65"/>
        <path d="M6 27c.2-7.2 4.6-10.5 10-10.5S25.8 19.8 26 27" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round"/>
        <path d="M11 5.6 9.1 2.7M21 5.6l1.9-2.9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".75"/>
      </svg>
      {user && <span className={styles.signed} aria-hidden="true" />}
    </button>
    {open && <div className={styles.backdrop} onPointerDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <section ref={dialog} className={styles.panel} role="dialog" aria-modal="true" tabIndex={-1} aria-labelledby="rosie-account-title">
        <button type="button" className={styles.dismiss} onClick={close} aria-label="Close account panel" disabled={busy}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>
        </button>
        <div className={styles.crest} aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor"><path strokeWidth="1.1" d="M20 2 36 11v18L20 38 4 29V11Z"/><circle cx="10.5" cy="17" r="2.5" fill="currentColor" stroke="none"/><circle cx="17.5" cy="12" r="2.5" fill="currentColor" stroke="none"/><circle cx="24.5" cy="12" r="2.5" fill="currentColor" stroke="none"/><circle cx="31.5" cy="17" r="2.5" fill="currentColor" stroke="none"/><path d="M11 26q0-6 9-8 9 2 9 8t-9 4q-9 2-9-4Z" fill="currentColor" stroke="none"/></svg>
        </div>
        <span className={styles.kicker}>THE HOUSE OF ROSIE</span>
        <h2 id="rosie-account-title">{user ? "Your Account" : mode === "create" ? "Join RosieVerse" : "Welcome Back"}</h2>
        {user ? <>
          <p className={styles.explanation}>Signed in as <strong>{user.displayName}</strong></p>
          <p className={styles.explanation}>Your Notes &amp; Ideas are saved to your private RosieVerse account. You can keep enjoying the rest of the app as usual.</p>
          {error && <p className={styles.warning} role="alert">{error}</p>}
          <button type="button" className={styles.mainAction} disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Sign Out"}</button>
        </> : <>
          <p className={styles.explanation}>{mode === "create" ? "Choose a username and a PIN. No email needed." : "Sign in to your saved notes. Everything else works without an account."}</p>
          <div className={styles.tabs} role="group" aria-label="Account action">
            <button type="button" aria-pressed={mode === "login"} className={mode === "login" ? styles.active : ""} onClick={() => switchMode("login")}>Sign In</button>
            <button type="button" aria-pressed={mode === "create"} className={mode === "create" ? styles.active : ""} onClick={() => switchMode("create")}>Create Account</button>
          </div>
          <form className={styles.form} onSubmit={submit}>
            <label htmlFor="rosie-acct-user">Username</label>
            <input ref={firstInput} id="rosie-acct-user" type="text" autoCapitalize="none" autoCorrect="off"
              spellCheck={false} autoComplete="username" maxLength={32} required value={username}
              onChange={e => setUsername(e.target.value)} placeholder="Your member name" />
            {mode === "create" && <>
              <label htmlFor="rosie-acct-name">Display name <span>(optional)</span></label>
              <input id="rosie-acct-name" type="text" maxLength={80} autoComplete="off"
                value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="What should Rosie call you?" />
              <fieldset className={styles.pinChoice}><legend>PIN length</legend>
                {[4, 6].map(length => <button type="button" key={length} aria-pressed={pinLength === length}
                  className={pinLength === length ? styles.active : ""} onClick={() => { setPinLength(length); setPin(""); setConfirmPin(""); }}>{length} digits</button>)}
              </fieldset>
            </>}
            <label htmlFor="rosie-acct-pin">{mode === "create" ? "Choose a PIN" : "PIN"}</label>
            <input id="rosie-acct-pin" type="password" inputMode="numeric" pattern={mode === "create" ? (pinLength === 4 ? "[0-9]{4}" : "[0-9]{6}") : "[0-9]{4}([0-9]{2})?"}
              autoComplete={mode === "create" ? "new-password" : "current-password"} minLength={mode === "create" ? pinLength : 4}
              maxLength={mode === "create" ? pinLength : 6} required value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,"").slice(0,mode === "create" ? pinLength : 6))}
              placeholder={mode === "create" && pinLength === 6 ? "••••••" : "••••"} />
            {mode === "create" && <>
              <label htmlFor="rosie-acct-confirm">Confirm PIN</label>
              <input id="rosie-acct-confirm" type="password" inputMode="numeric" autoComplete="new-password"
                minLength={pinLength} maxLength={pinLength} required value={confirmPin}
                onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,"").slice(0,pinLength))} placeholder={pinLength === 6 ? "••••••" : "••••"} />
            </>}
            {error && <p className={styles.warning} role="alert">{error}{remaining > 0 ? " Try again in " + Math.floor(remaining/60) + ":" + String(remaining%60).padStart(2,"0") : ""}</p>}
            {!error && connectionError && <p className={styles.warning} role="status">Unable to check previous session. <button type="button" onClick={refresh}>Retry</button></p>}
            <button type="submit" className={styles.mainAction} disabled={busy || remaining > 0 || checking}>
              {busy ? "One moment…" : mode === "create" ? "Create Account" : "Sign In"}
            </button>
          </form>
          <p className={styles.footnote}>No email. Sign-in stays active on this device. Five incorrect PINs temporarily lock an account.</p>
        </>}
      </section>
    </div>}
  </>;
}
