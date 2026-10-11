import React, { useEffect, useMemo, useRef, useState } from "react";
import "./RosieReminders.css";

const KEY = "rosieverse.reminders.v1";
const EMPTY = { version: 1, items: [], notes: [], goals: [], gratitude: [] };
const CATEGORIES = [
  { id: "notes", title: "Notes & Ideas", detail: "Capture your brightest thoughts." },
  { id: "shopping", title: "Shopping List", detail: "Everything your pup could want." },
  { id: "appointments", title: "Appointments", detail: "Keep your important dates." },
  { id: "tasks", title: "Task List", detail: "Get it done, one paw at a time." },
  { id: "goals", title: "Goals & Gratitude", detail: "Celebrate progress and brighter days." }
];
const two = (n) => String(n).padStart(2, "0");
const dateKey = (date = new Date()) => [date.getFullYear(), two(date.getMonth() + 1), two(date.getDate())].join("-");
const dateObj = (key) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); };
const pretty = (key, options = { weekday: "short", month: "short", day: "numeric", year: "numeric" }) =>
  new Intl.DateTimeFormat(undefined, options).format(dateObj(key));
const makeId = () => typeof crypto !== "undefined" && crypto.randomUUID
  ? crypto.randomUUID() : "rr-" + Date.now() + "-" + Math.random().toString(36).slice(2);
function readStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && saved.version === 1 && ["items", "notes", "goals", "gratitude"].every(k => Array.isArray(saved[k]))) return saved;
  } catch { /* Fall back to an empty organizer when storage is disabled or malformed. */ }
  return { ...EMPTY, items: [], notes: [], goals: [], gratitude: [] };
}
function isScheduled(item, key) {
  if (!item.date || item.date > key) return false;
  if (item.repeat === "daily") return true;
  if (item.repeat === "weekly") {
    const elapsed = Math.round((dateObj(key) - dateObj(item.date)) / 86400000);
    return elapsed % 7 === 0;
  }
  if (item.repeat === "monthly") return Number(key.slice(8)) === Number(item.date.slice(8));
  return item.date === key;
}
function doneKey(item, key) { return item.repeat && item.repeat !== "none" ? key : "once"; }
function isDone(item, key) { return (item.completedDates || []).includes(doneKey(item, key)); }
const blankItem = (category, day = dateKey()) => ({
  id: "", category, title: "", detail: "", date: category === "shopping" ? "" : day,
  time: "", repeat: "none", priority: "normal"
});
function calendarDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = first.getDay();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, i) => {
    const day = i - offset + 1;
    return day > 0 && day <= count ? dateKey(new Date(first.getFullYear(), first.getMonth(), day)) : null;
  });
}

export default function RosieReminders() {
  const [store, setStore] = useState(readStore);
  const [section, setSection] = useState("today");
  const [tab, setTab] = useState("today");
  const [selectedDate, setSelectedDate] = useState(dateKey);
  const [month, setMonth] = useState(() => dateObj(dateKey()));
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(() => blankItem("tasks"));
  const [heroLoaded, setHeroLoaded] = useState(false);
  const heroRef = useRef(null);
  const [headerDocked, setHeaderDocked] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [gratitudeInput, setGratitudeInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [focusedNote, setFocusedNote] = useState(null);
  const importRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(store)); setStorageError(""); }
    catch { setStorageError("This device could not save your changes. Export a backup before leaving."); }
  }, [store]);

  // The large Rosie illustration scrolls naturally; a slim branded header takes over
  // only once the illustration has reached the top and passed out of view.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!heroRef.current) return;
      const docked = heroRef.current.getBoundingClientRect().bottom <= 1;
      setHeaderDocked(previous => previous === docked ? previous : docked);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const shown = useMemo(() => {
    const source = section === "today" ? store.items.filter(x => isScheduled(x, selectedDate))
      : store.items.filter(x => x.category === section);
    return [...source].sort((a, b) =>
      Number(isDone(a, selectedDate)) - Number(isDone(b, selectedDate)) ||
      (a.date || "9999").localeCompare(b.date || "9999") ||
      (a.time || "99:99").localeCompare(b.time || "99:99") ||
      a.title.localeCompare(b.title));
  }, [section, store.items, selectedDate]);
  const counts = useMemo(() => ({
    tasks: store.items.filter(x => x.category === "tasks" && !isDone(x, selectedDate)).length,
    shopping: store.items.filter(x => x.category === "shopping" && !isDone(x, selectedDate)).length,
    appointments: store.items.filter(x => x.category === "appointments" && !isDone(x, selectedDate)).length,
    notes: store.notes.length, goals: store.goals.length
  }), [store, selectedDate]);
  const featured = shown.find(x => x.priority === "high" && !isDone(x, selectedDate));

  const openNew = (category = section === "today" ? "tasks" : section) => {
    setForm(blankItem(["tasks", "shopping", "appointments"].includes(category) ? category : "tasks", selectedDate));
    setEditorOpen(true);
  };
  const openEdit = (item) => {
    setForm({ ...blankItem(item.category, selectedDate), ...item });
    setEditorOpen(true);
  };
  const saveItem = (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    const next = { ...form, title: form.title.trim(), detail: form.detail.trim() };
    setStore(prev => ({ ...prev, items: next.id
      ? prev.items.map(x => x.id === next.id ? { ...x, ...next } : x)
      : [...prev.items, { ...next, id: makeId(), completedDates: [] }] }));
    setEditorOpen(false);
  };
  const removeItem = (id) => {
    if (!window.confirm("Delete this reminder?")) return;
    setStore(prev => ({ ...prev, items: prev.items.filter(x => x.id !== id) }));
    setEditorOpen(false);
  };
  const toggleDone = (item) => {
    const marker = doneKey(item, selectedDate);
    setStore(prev => ({ ...prev, items: prev.items.map(x => {
      if (x.id !== item.id) return x;
      const dates = x.completedDates || [];
      return { ...x, completedDates: dates.includes(marker) ? dates.filter(d => d !== marker) : [...dates, marker] };
    }) }));
  };
  const moveDay = (delta) => setSelectedDate(prev => dateKey(new Date(dateObj(prev).getFullYear(), dateObj(prev).getMonth(), dateObj(prev).getDate() + delta)));
  const chooseSection = (id) => { setSection(id); if (id === "today") setTab("today"); };
  const addNote = () => {
    const id = makeId();
    setStore(prev => ({ ...prev, notes: [{ id, title: "Untitled note", body: "", updatedAt: Date.now() }, ...prev.notes] }));
    setFocusedNote(id);
    setSection("notes");
  };
  const updateNote = (id, patch) => setStore(prev => ({ ...prev, notes: prev.notes.map(x => x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x) }));
  const addGoal = (event) => {
    event.preventDefault();
    if (!goalInput.trim()) return;
    setStore(prev => ({ ...prev, goals: [...prev.goals, { id: makeId(), title: goalInput.trim(), progress: 0 }] }));
    setGoalInput("");
  };
  const addGratitude = (event) => {
    event.preventDefault();
    if (!gratitudeInput.trim()) return;
    setStore(prev => ({ ...prev, gratitude: [{ id: makeId(), date: dateKey(), text: gratitudeInput.trim() }, ...prev.gratitude] }));
    setGratitudeInput("");
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rosie-reminders-backup-" + dateKey() + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importData = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("Backup exceeds the 2 MB limit.");
      const parsed = JSON.parse(await file.text());
      if (parsed.version !== 1 || !["items", "notes", "goals", "gratitude"].every(k => Array.isArray(parsed[k])))
        throw new Error("This is not a compatible Rosie Reminders backup.");
      if (!window.confirm("Replace all current Reminders data with the backup?")) return;
      setStore(parsed);
      setFocusedNote(null);
    } catch (error) { window.alert(error.message || "Unable to import backup."); }
  };
  const notesActive = store.notes.find(n => n.id === focusedNote) || store.notes[0];

  useEffect(() => {
    if (!editorOpen) return undefined;
    const onEscape = event => { if (event.key === "Escape") setEditorOpen(false); };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [editorOpen]);

  return <main className="rr-page" aria-label="Rosie's Reminders - Personal Organizer">
    <header className="rr-hero" ref={heroRef}>
      {!heroLoaded && <div className="rr-hero-fallback"><small>ROSIEVERSE</small><h1>Rosie’s Reminders</h1><p>Personal Organizer</p></div>}
      <picture>
        <source media="(min-width: 760px)" srcSet="/rosieverse/reminders/hero-desktop.webp" />
        <img src="/rosieverse/reminders/hero-mobile.webp" alt="Rosie, chief executive dog, at her moonlit organizer desk"
          draggable="false" onLoad={() => setHeroLoaded(true)} onError={() => setHeroLoaded(false)} />
      </picture>
      <h1 className="rr-screen-reader">Rosie’s Reminders - Personal Organizer</h1>
    </header>
    <div className={"rr-sticky-dock"+(headerDocked ? " is-visible" : "")} aria-hidden={!headerDocked}>
      <div className="rr-sticky-banner">
        <span className="rr-sticky-brand">RosieVerse</span>
        <span className="rr-sticky-title">Rosie’s Reminders</span>
        <span className="rr-sticky-crown" aria-hidden="true">♛</span>
      </div>
    </div>

    <section className="rr-content">
      <div className="rr-tabs" role="tablist" aria-label="Organizer view">
        <button type="button" role="tab" aria-selected={tab === "today"} className={tab === "today" ? "active" : ""}
          onClick={() => { setTab("today"); setSection("today"); }}>Today</button>
        <button type="button" role="tab" aria-selected={tab === "calendar"} className={tab === "calendar" ? "active" : ""}
          onClick={() => { setTab("calendar"); setSection("today"); setMonth(dateObj(selectedDate)); }}>Calendar</button>
      </div>
      <section className="rr-paper" aria-label="Reminders organizer">
        <div className="rr-panel-head">
          <span className="rr-emblem" aria-hidden="true">♛</span>
          <div><h2>{section === "today" ? (tab === "calendar" ? "Your Calendar" : "Today at a Glance")
            : CATEGORIES.find(x => x.id === section)?.title}</h2>
            <p>{section === "today" ? "Your day, beautifully organized. Small steps make a brighter tomorrow."
              : CATEGORIES.find(x => x.id === section)?.detail}</p></div>
        </div>
        {storageError && <p className="rr-warning" role="alert">{storageError}</p>}

        {section === "today" && <>
          {tab === "calendar" && <div className="rr-calendar">
            <div className="rr-month-head">
              <button type="button" aria-label="Previous month" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))}>‹</button>
              <strong>{new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(month)}</strong>
              <button type="button" aria-label="Next month" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))}>›</button>
            </div>
            <div className="rr-calendar-grid">{["S","M","T","W","T","F","S"].map((day, i) => <b key={i}>{day}</b>)}
              {calendarDays(month).map((day, i) => day
                ? <button key={day} type="button" aria-pressed={day === selectedDate}
                    aria-label={pretty(day)} className={day === selectedDate ? "picked" : day === dateKey() ? "current" : ""}
                    onClick={() => setSelectedDate(day)}>{Number(day.slice(8))}
                    {store.items.some(x => isScheduled(x, day)) && <i aria-hidden="true"/>}</button>
                : <span key={"blank"+i} />)}</div>
          </div>}
          <div className="rr-datebar">
            <button type="button" onClick={() => moveDay(-1)} aria-label="Previous day">‹</button>
            <strong>{pretty(selectedDate)}</strong>
            <button type="button" onClick={() => moveDay(1)} aria-label="Next day">›</button>
            <button type="button" className="rr-today-link" onClick={() => { setSelectedDate(dateKey()); setMonth(dateObj(dateKey())); }}>Today</button>
          </div>
        </>}
        {(section === "today" || ["tasks","shopping","appointments"].includes(section)) && <>
          <div className="rr-rows">
            {shown.length ? shown.map(item => <div key={item.id} className={"rr-entry" + (isDone(item, selectedDate) ? " is-done" : "")}>
              <button type="button" className="rr-check" aria-label={(isDone(item, selectedDate) ? "Mark incomplete: " : "Complete: ") + item.title}
                aria-pressed={isDone(item, selectedDate)} onClick={() => toggleDone(item)}>{isDone(item, selectedDate) ? "✓" : ""}</button>
              <div className="rr-entry-content"><strong>{item.title}</strong>
                {(item.detail || item.date || item.time || (item.repeat && item.repeat !== "none")) && <small>
                  {[section !== "today" && item.date ? pretty(item.date, {month:"short",day:"numeric"}) : "",
                    item.time || "", item.repeat !== "none" ? item.repeat : "", item.detail].filter(Boolean).join(" · ")}</small>}
              </div>{item.priority === "high" && <span className="rr-star" aria-label="High priority">★</span>}
              <button type="button" className="rr-edit" onClick={() => openEdit(item)} aria-label={"Edit "+item.title}>›</button>
            </div>) : <p className="rr-empty">Nothing scheduled here yet. Rosie approves of a clear desk.</p>}
          </div>
          {featured && <div className="rr-priority"><span>★</span><div><b>Top Priority</b><p>{featured.title}</p></div></div>}
          <button type="button" className="rr-primary" onClick={() => openNew()}>＋ Add {section === "appointments" ? "Appointment" : section === "shopping" ? "Shopping Item" : "Reminder"}</button>
        </>}

        {section === "notes" && <div className="rr-notes">
          <div className="rr-side-head"><strong>Your Notes</strong><button type="button" onClick={addNote}>＋ New note</button></div>
          <div className="rr-note-picker">{store.notes.map(note => <button key={note.id} type="button"
            className={notesActive?.id === note.id ? "active" : ""} onClick={() => setFocusedNote(note.id)}>{note.title}</button>)}</div>
          {notesActive ? <div className="rr-note-editor">
            <input aria-label="Note title" value={notesActive.title} onChange={e => updateNote(notesActive.id, { title: e.target.value })} />
            <textarea aria-label="Note text" rows={7} value={notesActive.body}
              onChange={e => updateNote(notesActive.id, { body: e.target.value })} placeholder="Write down your brightest thoughts..." />
            <div className="rr-note-footer"><span>Saved automatically on this device</span>
              <button type="button" onClick={() => { if(window.confirm("Delete this note?")) {setStore(prev => ({...prev, notes:prev.notes.filter(n => n.id !== notesActive.id)})); setFocusedNote(null);}}}>Delete note</button></div>
          </div> : <p className="rr-empty">A fresh page, waiting for an excellent idea.</p>}
        </div>}

        {section === "goals" && <div className="rr-goals">
          <h3>Goals</h3>
          <form className="rr-inline-add" onSubmit={addGoal}><input aria-label="New goal" placeholder="A goal worth pursuing" value={goalInput} onChange={e => setGoalInput(e.target.value)} maxLength={140}/><button type="submit">Add</button></form>
          {store.goals.map(goal => <div className="rr-goal" key={goal.id}>
            <strong>{goal.title}</strong><span>{goal.progress}%</span>
            <div className="rr-progress" role="progressbar" aria-valuenow={goal.progress} aria-valuemin={0} aria-valuemax={100}><i style={{width:goal.progress+"%"}}/></div>
            <button type="button" onClick={() => setStore(prev => ({...prev, goals:prev.goals.map(g => g.id === goal.id ? {...g,progress:Math.min(100,g.progress+25)}:g)}))}>＋ 25%</button>
            <button type="button" onClick={() => setStore(prev => ({...prev, goals:prev.goals.filter(g=>g.id !== goal.id)}))} aria-label={"Remove goal "+goal.title}>Remove</button>
          </div>)}
          <h3>Gratitude Journal</h3>
          <form className="rr-inline-add" onSubmit={addGratitude}><input aria-label="Gratitude entry" placeholder="Something good about today…" value={gratitudeInput} onChange={e=>setGratitudeInput(e.target.value)} maxLength={300}/><button type="submit">Add</button></form>
          {store.gratitude.map(g => <div className="rr-gratitude" key={g.id}><span><b>{pretty(g.date,{month:"short",day:"numeric"})}</b> {g.text}</span><button type="button" aria-label="Remove gratitude entry" onClick={() => setStore(prev=>({...prev,gratitude:prev.gratitude.filter(x=>x.id!==g.id)}))}>×</button></div>)}
          {!store.gratitude.length && !store.goals.length && <p className="rr-empty">A brighter day begins with one small step.</p>}
        </div>}
      </section>
      <div className="rr-feature-grid" aria-label="Organizer tools">
        {CATEGORIES.map(c => <button type="button" key={c.id}
          className={"rr-feature rr-feature-"+c.id+(section === c.id ? " selected" : "")}
          onClick={() => chooseSection(c.id)}
          aria-label={"Open "+c.title+(counts[c.id] ? ", "+counts[c.id]+" entries" : "")}
          aria-pressed={section === c.id}>
          <img className="rr-button-image" src={"/rosieverse/reminders/buttons/"+c.id+".webp"}
            alt="" draggable="false" loading="lazy" />
        </button>)}
      </div>
      <div className="rr-tools"><button type="button" onClick={exportData}>Export backup</button>
        <button type="button" onClick={() => importRef.current?.click()}>Import backup</button>
        <input ref={importRef} type="file" accept=".json,application/json" onChange={importData} hidden aria-label="Import backup file"/></div>
      <p className="rr-storage-note">Saved on this device. Account synchronization and background notifications are not enabled yet.</p>
    </section>
    {editorOpen && <div className="rr-modal-cover" onMouseDown={e => { if(e.target===e.currentTarget) setEditorOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="rr-modal-title" className="rr-modal">
        <div className="rr-modal-head"><h2 id="rr-modal-title">{form.id ? "Edit" : "New"} Reminder</h2><button type="button" onClick={()=>setEditorOpen(false)} aria-label="Close">×</button></div>
        <form onSubmit={saveItem}>
          <label>Type<select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
            <option value="tasks">Task</option><option value="appointments">Appointment</option><option value="shopping">Shopping item</option>
          </select></label>
          <label>Title<input required maxLength={140} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus /></label>
          <label>Notes (optional)<textarea rows={2} maxLength={500} value={form.detail} onChange={e=>setForm(f=>({...f,detail:e.target.value}))}/></label>
          <div className="rr-form-grid"><label>Date<input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></label>
          <label>Time<input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></label></div>
          <div className="rr-form-grid"><label>Repeat<select value={form.repeat} onChange={e=>setForm(f=>({...f,repeat:e.target.value}))}>
            <option value="none">Never</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          </select></label><label>Priority<select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
            <option value="normal">Normal</option><option value="high">High</option>
          </select></label></div>
          <div className="rr-modal-actions">{form.id && <button type="button" className="rr-danger" onClick={()=>removeItem(form.id)}>Delete</button>}
            <button type="button" onClick={()=>setEditorOpen(false)}>Cancel</button><button className="rr-save" type="submit">Save Reminder</button></div>
        </form>
      </section>
    </div>}
  </main>;
}
