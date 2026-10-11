import React, { useCallback, useEffect, useRef, useState } from "react";
import { rosieRequest, useRosieAccount } from "./AccountContext.jsx";
import styles from "./PrivateNotes.module.css";

function AccountChip() {
  const { user, logout } = useRosieAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!user) return null;
  async function signOut() {
    setBusy(true); setError("");
    try { await logout(); } catch (issue) { setError(issue.message); }
    finally { setBusy(false); }
  }
  return <div className={styles.accountArea}>
    <div className={styles.chip}><span aria-hidden="true">✦</span><span>{user.displayName}</span>
      <button type="button" disabled={busy} onClick={signOut}>{busy ? "Signing out…" : "Sign Out"}</button></div>
    {error && <small role="alert" className={styles.failure}>{error}</small>}
  </div>;
}

function Entrance() {
  const { login, connectionError, refresh } = useRosieAccount();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  useEffect(() => {
    if (retryAfter < 1) return undefined;
    const timer = setInterval(() => setRetryAfter(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryAfter > 0]);
  const submit = async event => {
    event.preventDefault();
    if (busy || retryAfter) return;
    setBusy(true); setError("");
    try {
      await login(username, pin);
      setPin("");
    } catch (issue) {
      setError(issue.message);
      if (issue.retryAfter) setRetryAfter(Math.ceil(issue.retryAfter));
      setPin("");
    } finally { setBusy(false); }
  };
  const mins = Math.floor(retryAfter / 60);
  const secs = String(retryAfter % 60).padStart(2, "0");
  return <div className={styles.entrance}>
    <div className={styles.topLine}>THE PRIVATE SALON <span aria-hidden="true">✦</span> EST. 2016</div>
    <div className={styles.portrait}>
      <img src="/rosie-mood-focused.webp" alt="Rosie, the distinguished Shiba Inu proprietor of RosieVerse" />
    </div>
    <div className={styles.crown} aria-hidden="true">✦  R O S I E V E R S E  ✦</div>
    <h2>Welcome to RosieVerse</h2>
    <p className={styles.subheading}>A private little world for Rosie’s favorite humans.</p>
    <form className={styles.form} onSubmit={submit}>
      <label htmlFor="rv-username">Username</label>
      <input id="rv-username" name="username" type="text" autoCapitalize="none" autoCorrect="off"
        autoComplete="username" enterKeyHint="next" maxLength={32} required
        value={username} onChange={event => setUsername(event.target.value)}
        placeholder="Your member name" />
      <label htmlFor="rv-pin">Secret PIN</label>
      <input id="rv-pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]*"
        autoComplete="current-password" maxLength={6} minLength={4} required enterKeyHint="go"
        value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="•••• or ••••••" />
      {error && <div role="alert" className={styles.failure}>{error}{retryAfter > 0 && <span> Try again in {mins}:{secs}.</span>}</div>}
      {connectionError && !error && <div role="status" className={styles.failure}>{connectionError}
        <button className={styles.retry} type="button" onClick={refresh}>Retry connection</button></div>}
      <button className={styles.enter} type="submit" disabled={busy || retryAfter > 0}>
        {busy ? "Rosie is inspecting…" : "Enter RosieVerse"} <span aria-hidden="true">✦</span>
      </button>
    </form>
    <p className={styles.invite}>By invitation only <span aria-hidden="true">·</span> No email required</p>
  </div>;
}

const draftKey = (userId, id) => "rosieverse.unsaved." + userId + "." + id;
function retrieveDraft(userId, note) {
  try {
    const raw = sessionStorage.getItem(draftKey(userId, note.id));
    return raw ? { ...note, ...JSON.parse(raw) } : note;
  } catch { return note; }
}
function persistDraft(userId, id, draft) {
  try { sessionStorage.setItem(draftKey(userId, id), JSON.stringify(draft)); } catch { /* memory still holds edits */ }
}
function clearDraft(userId, id) {
  try { sessionStorage.removeItem(draftKey(userId, id)); } catch { /* ignored */ }
}

function Notebook({ onCountChange }) {
  const { user, refresh } = useRosieAccount();
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState({});
  const pending = useRef(new Map());
  const inflight = useRef(new Map());
  const timers = useRef(new Map());
  const unmounted = useRef(false);
  const owner = user.id;

  const setNoteStatus = useCallback((id, value) => {
    if (!unmounted.current) setStatus(prev => ({ ...prev, [id]: value }));
  }, []);

  const flush = useCallback(async id => {
    if (inflight.current.has(id)) return inflight.current.get(id);
    const work = (async () => {
      while (pending.current.has(id)) {
        const draft = pending.current.get(id);
        pending.current.delete(id);
        try {
          const payload = await rosieRequest("notes/" + id, {
            method: "PATCH", keepalive: true, body: JSON.stringify(draft)
          });
          const newer = pending.current.get(id);
          if (!newer) {
            clearDraft(owner, id);
            setNoteStatus(id, "Saved");
            if (!unmounted.current) setNotes(previous => previous.map(n => n.id === id ? {
              ...n, updated_at: payload.note.updated_at
            } : n));
          }
        } catch (issue) {
          if (!pending.current.has(id)) pending.current.set(id, draft);
          setNoteStatus(id, "Save Failed");
          if (issue.status === 401) refresh();
          break;
        }
      }
    })();
    inflight.current.set(id, work);
    try { await work; } finally { inflight.current.delete(id); }
  }, [owner, refresh, setNoteStatus]);

  const schedule = useCallback((id, next) => {
    pending.current.set(id, next);
    persistDraft(owner, id, next);
    setNoteStatus(id, "Saving…");
    clearTimeout(timers.current.get(id));
    timers.current.set(id, setTimeout(() => { timers.current.delete(id); flush(id); }, 700));
  }, [flush, owner, setNoteStatus]);

  useEffect(() => {
    unmounted.current = false;
    let alive = true;
    (async () => {
      try {
        const payload = await rosieRequest("notes");
        if (!alive) return;
        const restored = payload.notes.map(n => retrieveDraft(owner, n));
        setNotes(restored);
        setSelected(restored[0]?.id || null);
        onCountChange?.(restored.length);
        for (const note of restored) {
          if (JSON.stringify({ title: note.title, body: note.body }) !== JSON.stringify({
            title: payload.notes.find(n => n.id === note.id)?.title,
            body: payload.notes.find(n => n.id === note.id)?.body
          })) {
            schedule(note.id, { title: note.title, body: note.body });
          }
        }
      } catch (issue) {
        if (alive) { setError(issue.message); if (issue.status === 401) refresh(); }
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [owner]); // The workspace is keyed by signed-in account in the parent.

  useEffect(() => {
    const beforeUnload = event => {
      if (pending.current.size || inflight.current.size) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", beforeUnload);
    const visibility = () => {
      if (document.visibilityState === "hidden") {
        for (const id of pending.current.keys()) flush(id);
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      unmounted.current = true;
      for (const timer of timers.current.values()) clearTimeout(timer);
      for (const id of pending.current.keys()) flush(id);
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [flush]);

  const add = async () => {
    setCreating(true); setError("");
    try {
      const { note } = await rosieRequest("notes", { method: "POST",
        body: JSON.stringify({ title: "Untitled note", body: "" }) });
      setNotes(prev => [note, ...prev]); setSelected(note.id);
      onCountChange?.(notes.length + 1);
    } catch (issue) { setError(issue.message); if (issue.status === 401) refresh(); }
    finally { setCreating(false); }
  };
  const patch = (id, field, value) => {
    const current = notes.find(n => n.id === id);
    if (!current) return;
    const next = { title: current.title, body: current.body, [field]: value };
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...next } : n));
    schedule(id, next);
  };
  const remove = async id => {
    if (!window.confirm("Permanently delete this note from Rosie's ledger?")) return;
    setError("");
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    await flush(id);
    if (pending.current.has(id)) { setError("Save failed. Retry saving before deleting."); return; }
    try {
      await rosieRequest("notes/" + id, { method: "DELETE" });
      clearDraft(owner, id);
      const remaining = notes.filter(n => n.id !== id);
      setNotes(remaining); setSelected(remaining[0]?.id || null);
      onCountChange?.(remaining.length);
    } catch (issue) { setError(issue.message); if (issue.status === 401) refresh(); }
  };
  const active = notes.find(n => n.id === selected);
  return <div className={styles.ledger}>
    <AccountChip />
    <div className={styles.ledgerHeader}><div><span className={styles.eyebrow}>ROSIE’S PRIVATE LEDGER</span>
      <h3>Notes &amp; Ideas</h3><p>Collected thoughts, safely tucked away in the cloud.</p></div>
      <button type="button" className={styles.newNote} disabled={creating || loading} onClick={add}>
        {creating ? "Preparing…" : "＋ New Note"}</button></div>
    {error && <p role="alert" className={styles.failure}>{error} <button type="button" className={styles.retry}
      onClick={() => { setError(""); setLoading(true); rosieRequest("notes").then(({notes: found})=>{
        const restored = found.map(n=>retrieveDraft(owner,n));setNotes(restored);setSelected(restored[0]?.id||null);onCountChange?.(restored.length);
      }).catch(issue=>setError(issue.message)).finally(()=>setLoading(false)); }}>Retry</button></p>}
    {loading ? <p role="status" className={styles.empty}>Rosie is opening the ledger…</p> : <>
      {!!notes.length && <nav className={styles.noteList} aria-label="Your notes">{notes.map(note =>
        <button type="button" key={note.id} aria-current={note.id === selected ? "true" : undefined}
          className={note.id === selected ? styles.current : ""} onClick={() => {
            for (const id of pending.current.keys()) flush(id);
            setSelected(note.id);
          }}>
          <strong>{note.title || "Untitled note"}</strong><small>{new Date(note.updated_at).toLocaleDateString()}</small>
        </button>)}</nav>}
      {active ? <section className={styles.paper} aria-label="Edit note">
        <input aria-label="Note title" maxLength={140} value={active.title}
          onChange={e => patch(active.id, "title", e.target.value)} placeholder="Untitled note" />
        <textarea aria-label="Note text" maxLength={20000} rows={9} value={active.body}
          onChange={e => patch(active.id, "body", e.target.value)} placeholder="Every remarkable idea begins with a thought…" />
        <div className={styles.paperFooter}><span role="status" aria-live="polite"
          className={status[active.id] === "Save Failed" ? styles.failure : styles.saveState}>
          {status[active.id] || "Saved"} {status[active.id] === "Saved" ? "✓" : ""}</span>
          {status[active.id] === "Save Failed" && <button className={styles.retry} onClick={() => flush(active.id)}>Retry Save</button>}
          <button type="button" className={styles.delete} onClick={() => remove(active.id)}>Delete note</button>
        </div>
      </section> : <div className={styles.empty}>A fresh page awaits. Rosie recommends beginning with an excellent idea.</div>}
    </>}
    <p className={styles.privacy}>Private to {user.displayName}. Notes sync whenever you enter RosieVerse on another device.</p>
  </div>;
}

export function PrivateNotes({ onCountChange }) {
  const { user, checking } = useRosieAccount();
  if (checking) return <div className={styles.loading} role="status">Rosie is checking the guest book…</div>;
  if (!user) return <Entrance />;
  return <Notebook key={user.id} onCountChange={onCountChange} />;
}
export { AccountChip };
