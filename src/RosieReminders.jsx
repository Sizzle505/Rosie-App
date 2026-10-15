import React, { useEffect, useMemo, useRef, useState } from "react";
import "./RosieReminders.css";
import { useRosieAccount } from "./private/AccountContext.jsx";
import { PrivateNotes } from "./private/PrivateNotes.jsx";
import { isScheduled, isDone, doneKey, isOverdue, nextOccurrence, datePlus, calendarIcs, validateBackup } from "./reminderLogic.js";

const KEY = "rosieverse.reminders.v1";
const EMPTY = { version: 1, items: [], notes: [], goals: [], gratitude: [] };
const CATEGORIES = [
  { id: "notes", title: "Notes & Ideas", detail: "Capture your brightest thoughts." },
  { id: "shopping", title: "Shopping List", detail: "Everything your pup could want." },
  { id: "appointments", title: "Appointments", detail: "Keep your important dates." },
  { id: "tasks", title: "Task List", detail: "Get it done, one paw at a time." },
  { id: "goals", title: "Goals & Gratitude", detail: "Celebrate progress and brighter days." }
];

// The quick lists reuse the original v1 item storage, retaining all saved data.
function cleanListItem(raw) {
  const entry = raw.trim().replace(/^(?:[•*]\s*|[-–]\s+|\d+[.)]\s+)/, "").replace(/\s+/g, " ");
  return entry ? entry.charAt(0).toUpperCase() + entry.slice(1) : "";
}
function parseGroceryPaste(text) {
  return text.split(/[\n,;]+/).map(cleanListItem).filter(Boolean).slice(0, 150);
}

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
  const { user } = useRosieAccount();
  const [cloudNoteCount, setCloudNoteCount] = useState(0);
  const [store, setStore] = useState(readStore);
  const [section, setSection] = useState("today");
  const [tab, setTab] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dateKey);
  const [month, setMonth] = useState(() => dateObj(dateKey()));
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(() => blankItem("tasks"));
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [heroPinned, setHeroPinned] = useState(false);
  const [heroHeight, setHeroHeight] = useState(0);
  const [organizerHeight, setOrganizerHeight] = useState(220);
  const heroRef = useRef(null);
  const organizerRef = useRef(null);
  const [storageError, setStorageError] = useState("");
  const [gratitudeInput, setGratitudeInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [quickTask, setQuickTask] = useState("");
  const [groceryDraft, setGroceryDraft] = useState("");
  const [editingQuickId, setEditingQuickId] = useState(null);
  const [editingQuickTitle, setEditingQuickTitle] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [todayView, setTodayView] = useState("day");
  const [quickDue, setQuickDue] = useState("today");
  const [quickPriority, setQuickPriority] = useState(false);
  const [noteScope, setNoteScope] = useState("cloud");
  const [noteSearch, setNoteSearch] = useState("");
  const [undoSnapshot, setUndoSnapshot] = useState(null);
  const [notice, setNotice] = useState("");
  const [liveDay, setLiveDay] = useState(dateKey);
  const dayRef = useRef(liveDay);

  const [focusedNote, setFocusedNote] = useState(null);
  const importRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(store)); setStorageError(""); }
    catch { setStorageError("This device could not save your changes. Export a backup before leaving."); }
  }, [store]);

  const shown = useMemo(() => {
    let source;
    if (section === "today" && todayView === "upcoming") {
      source = store.items.filter(x => x.category !== "shopping").map(x => {
        const occurrenceDate = nextOccurrence(x, selectedDate, 13);
        return occurrenceDate ? { ...x, occurrenceDate } : null;
      }).filter(Boolean);
    } else if (section === "today" && todayView === "overdue") {
      source = store.items.filter(x => isOverdue(x, selectedDate));
    } else if (section === "today") {
      source = store.items.filter(x => isScheduled(x, selectedDate) ||
        (selectedDate === liveDay && isOverdue(x, selectedDate)));
    } else {
      source = store.items.filter(x => x.category === section);
    }
    const query = searchText.trim().toLocaleLowerCase();
    if (query) source = source.filter(x =>
      (x.title + " " + (x.detail || "")).toLocaleLowerCase().includes(query));
    if (statusFilter !== "all") source = source.filter(x => {
      const done = isDone(x, x.occurrenceDate || selectedDate);
      return statusFilter === "done" ? done : statusFilter === "open" ? !done
        : statusFilter === "high" ? x.priority === "high" && !done : true;
    });
    if (section === "shopping") return source;
    return [...source].sort((a, b) =>
      Number(isDone(a, a.occurrenceDate || selectedDate)) -
        Number(isDone(b, b.occurrenceDate || selectedDate)) ||
      Number(isOverdue(b, selectedDate)) - Number(isOverdue(a, selectedDate)) ||
      (a.occurrenceDate || a.date || "9999").localeCompare(b.occurrenceDate || b.date || "9999") ||
      Number(b.priority === "high") - Number(a.priority === "high") ||
      (a.time || "99:99").localeCompare(b.time || "99:99") ||
      a.title.localeCompare(b.title));
  }, [section, todayView, store.items, selectedDate, liveDay, searchText, statusFilter]);
  const counts = useMemo(() => ({
    tasks: store.items.filter(x => x.category === "tasks" && !isDone(x, selectedDate)).length,
    shopping: store.items.filter(x => x.category === "shopping" && !isDone(x, selectedDate)).length,
    appointments: store.items.filter(x => x.category === "appointments" && !isDone(x, selectedDate)).length,
    notes: user ? cloudNoteCount : store.notes.length, goals: store.goals.length
  }), [store, selectedDate, user, cloudNoteCount]);
  const featured = shown.find(x => x.priority === "high" && !isDone(x, x.occurrenceDate || selectedDate));
  const overdueCount = store.items.filter(x => isOverdue(x, selectedDate)).length;
  const upcomingCount = store.items.filter(x => x.category !== "shopping" &&
    nextOccurrence(x, selectedDate, 13)).length;
  const completedHere = store.items.filter(x => (section === "today"
    ? isScheduled(x, selectedDate) || isOverdue(x, selectedDate) : x.category === section) &&
    isDone(x, selectedDate) && (!x.repeat || x.repeat === "none")).length;

  const openNew = (category = section === "today" ? "tasks" : section) => {
    setForm(blankItem(["tasks", "shopping", "appointments"].includes(category) ? category : "tasks", selectedDate));
    setEditorOpen(true);
  };
  const openEdit = (item) => {
    setForm({ ...blankItem(item.category, selectedDate), ...item });
    setEditorOpen(true);
  };
  // Update the day on return to the app, including after the phone has been asleep.
  useEffect(() => {
    const refreshDay = () => {
      const now = dateKey();
      if (dayRef.current !== now) {
        const before = dayRef.current;
        dayRef.current = now;
        setSelectedDate(current => current === before ? now : current);
        setLiveDay(now);
      }
    };
    const onStorage = event => {
      if (event.key === KEY && event.newValue) {
        try {
          const incoming = validateBackup(JSON.parse(event.newValue));
          setStore(previous => JSON.stringify(previous) === JSON.stringify(incoming)
            ? previous : incoming);
        }
        catch { /* Ignore malformed changes from another tab. */ }
      }
    };
    window.addEventListener("focus", refreshDay);
    document.addEventListener("visibilitychange", refreshDay);
    window.addEventListener("storage", onStorage);
    const interval = window.setInterval(refreshDay, 60000);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshDay);
      document.removeEventListener("visibilitychange", refreshDay);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const saveItem = (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    if (form.repeat !== "none" && !form.date) {
      setNotice("Choose a starting date for repeating reminders.");
      return;
    }
    const next = { ...form, title: form.title.trim(), detail: form.detail.trim() };
    setUndoSnapshot(null);
    setStore(prev => ({ ...prev, items: next.id
      ? prev.items.map(x => x.id === next.id ? { ...x, ...next } : x)
      : [...prev.items, { ...next, id: makeId(), completedDates: [] }] }));
    setEditorOpen(false);
    setNotice("Reminder saved.");
  };

  // Both quick lists create one ordinary reminder per row, so exporting and
  // importing backups continue to work without format changes.
  const addQuickTask = (event) => {
    event.preventDefault();
    const title = cleanListItem(quickTask);
    if (!title) return;
    setUndoSnapshot(null);
    setStore(prev => ({ ...prev, items: [...prev.items, {
      ...blankItem("tasks", selectedDate), id: makeId(), title,
      date: quickDue === "none" ? "" : quickDue === "tomorrow" ? datePlus(liveDay, 1) : liveDay,
      priority: quickPriority ? "high" : "normal",
      completedDates: []
    }] }));
    setQuickTask("");
    setNotice("Task added.");
  };
  const addGroceries = (event) => {
    event.preventDefault();
    const titles = parseGroceryPaste(groceryDraft);
    if (!titles.length) return;
    setUndoSnapshot(null);
    setStore(prev => ({ ...prev, items: [...prev.items, ...titles.map(title => ({
      ...blankItem("shopping", selectedDate), id: makeId(),
      title, date: "", completedDates: []
    }))] }));
    setGroceryDraft("");
    setNotice(titles.length + " shopping item" + (titles.length === 1 ? "" : "s") + " added.");
  };
  const startQuickEdit = (item) => {
    setEditingQuickId(item.id);
    setEditingQuickTitle(item.title);
  };
  const saveQuickEdit = (event) => {
    event.preventDefault();
    const title = cleanListItem(editingQuickTitle);
    if (title && editingQuickId) { setUndoSnapshot(null); setStore(prev => ({...prev,
      items: prev.items.map(x => x.id === editingQuickId ? {...x,title} : x)
    })); }
    setEditingQuickId(null);
  };
  const removeItem = (id) => {
    if (!window.confirm("Delete this reminder?")) return;
    setUndoSnapshot(store);
    setStore(prev => ({ ...prev, items: prev.items.filter(x => x.id !== id) }));
    setNotice("Reminder deleted. Undo is available below.");
    setEditorOpen(false);
  };
  const removeQuick = id => {
    setUndoSnapshot(store);
    setStore(prev => ({ ...prev, items: prev.items.filter(x => x.id !== id) }));
    setNotice("Item removed.");
  };
  const clearCompleted = () => {
    if (!completedHere || !window.confirm("Remove " + completedHere + " completed one-time item(s)? Repeating reminders will be kept.")) return;
    setUndoSnapshot(store);
    setStore(prev => ({ ...prev, items: prev.items.filter(x => {
        if (x.repeat && x.repeat !== "none") return true;
        const inSection = section === "today" ? isScheduled(x, selectedDate) || isOverdue(x, selectedDate)
          : x.category === section;
        return !inSection || !isDone(x, selectedDate);
      }) }));
    setNotice(completedHere + " completed items cleared.");
  };
  const canDefer = item => item.category !== "shopping" && item.date &&
    item.date <= liveDay && (!item.repeat || item.repeat === "none") &&
    !isDone(item, selectedDate);
  const deferItem = item => {
    if (item.repeat && item.repeat !== "none") { openEdit(item); return; }
    setUndoSnapshot(store);
    setStore(prev => ({ ...prev, items: prev.items.map(x => x.id === item.id ?
        { ...x, date: datePlus(liveDay, 1), completedDates: [] } : x) }));
    setNotice("Moved to tomorrow.");
  };
  const copyShopping = async () => {
    const text = store.items.filter(x => x.category === "shopping" && !isDone(x, selectedDate))
      .map(x => "☐ " + x.title).join("\n");
    if (!text) { setNotice("No unchecked items to copy."); return; }
    try { await navigator.clipboard.writeText(text); setNotice("Unchecked shopping list copied."); }
    catch { setNotice("Clipboard unavailable. You can use the JSON backup instead."); }
  };
  const exportCalendar = (items = store.items) => {
    const content = calendarIcs(items);
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Rosie Reminders Calendar.ics";
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    setNotice("Calendar file prepared. Import it into your calendar; changes will not sync automatically.");
  };
  const undoLast = () => {
    if (!undoSnapshot) return;
    setStore(undoSnapshot); setUndoSnapshot(null); setNotice("Restored previous items.");
  };
  const toggleDone = (item) => {
    const marker = doneKey(item, item.occurrenceDate || selectedDate);
    setUndoSnapshot(null);
    setStore(prev => ({ ...prev, items: prev.items.map(x => {
      if (x.id !== item.id) return x;
      const dates = x.completedDates || [];
      return { ...x, completedDates: dates.includes(marker) ? dates.filter(d => d !== marker) : [...dates, marker] };
    }) }));
  };
  const moveDay = (delta) => setSelectedDate(prev => dateKey(new Date(dateObj(prev).getFullYear(), dateObj(prev).getMonth(), dateObj(prev).getDate() + delta)));

  // The ORIGINAL illustrated Rosie hero is shown in full at page entry.
  // After its first 15% scrolls offscreen, pin its original middle 70%.
  // The last 15% continues moving behind that pinned middle section.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = heroRef.current?.getBoundingClientRect();
        if (!rect || rect.height <= 0) return;
        const nextHeight = rect.height;
        // Align the document-wide wallpaper precisely with the hero's lower edge.
        // This also fills iOS safe-area / overscroll space with the same source.
        document.documentElement.style.setProperty("--rr-wallpaper-offset", nextHeight + "px");
        const nextPinned = rect.top <= -(nextHeight * 0.15);
        setHeroHeight(previous => Math.abs(previous - nextHeight) > 0.5 ? nextHeight : previous);
        setHeroPinned(previous => previous === nextPinned ? previous : nextPinned);
      });
    };
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (heroRef.current) resizeObserver?.observe(heroRef.current);
    measure();
    window.addEventListener("scroll", measure, {passive:true});
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      document.documentElement.style.removeProperty("--rr-wallpaper-offset");
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const node = organizerRef.current;
    if (!node) return undefined;
    const measure = () => {
      const next = node.getBoundingClientRect().height;
      setOrganizerHeight(previous => Math.abs(next - previous) > 0.5 ? next : previous);
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(node);
    measure();
    return () => observer?.disconnect();
  }, [section, tab]);

  const scrollToOrganizer = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const node = organizerRef.current;
      if (!node) return;
      const height = heroRef.current?.getBoundingClientRect().height || heroHeight;
      const pinnedBottom = height * .7 + 3;
      const target = node.getBoundingClientRect().top + window.scrollY - pinnedBottom;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({top:Math.max(0,target),behavior:reduced?"auto":"smooth"});
    }));
  };
  const chooseSection = (id) => {
    setSection(id);
    setSearchText(""); setStatusFilter("all");
    if (id === "today") { setTab("today"); setTodayView("day"); }
    scrollToOrganizer();
  };
  const addNote = () => {
    const id = makeId();
    setStore(prev => ({ ...prev, notes: [{ id, title: "Untitled note", body: "", updatedAt: Date.now() }, ...prev.notes] }));
    setFocusedNote(id);
    setSection("notes");
    setNoteScope("device");
  };
  const updateNote = (id, patch) => { setUndoSnapshot(null); setStore(prev => ({ ...prev, notes: prev.notes.map(x => x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x) })); };
  const addGoal = (event) => {
    event.preventDefault();
    if (!goalInput.trim()) return;
    setUndoSnapshot(null);
    setStore(prev => ({ ...prev, goals: [...prev.goals, { id: makeId(), title: goalInput.trim(), progress: 0 }] }));
    setGoalInput("");
  };
  const addGratitude = (event) => {
    event.preventDefault();
    if (!gratitudeInput.trim()) return;
    setUndoSnapshot(null);
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
      const restored = validateBackup(parsed);
      if (!window.confirm("Replace all current Reminders data with the backup?")) return;
      setUndoSnapshot(store);
      setStore(restored);
      setNotice("Backup restored. Your previous data can be recovered with Undo.");
      setFocusedNote(null);
    } catch (error) { window.alert(error.message || "Unable to import backup."); }
  };
  const matchingNotes = store.notes.filter(n =>
    (n.title + " " + n.body).toLocaleLowerCase().includes(noteSearch.trim().toLocaleLowerCase()));
  const notesActive = matchingNotes.find(n => n.id === focusedNote) || matchingNotes[0];

  useEffect(() => {
    if (!editorOpen) return undefined;
    const onEscape = event => { if (event.key === "Escape") setEditorOpen(false); };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [editorOpen]);

  return <main className="rr-page" aria-label="Rosie's Reminders - Personal Organizer"
    style={{"--rr-hero-middle-height":heroHeight * .7 + "px",
      "--rr-hero-height":heroHeight + "px",
      "--rr-hero-fifteen-height":heroHeight * .15 + "px",
      "--rr-panel-height":organizerHeight + "px"}}>
    <div className={"rr-hero-pin"+(heroPinned ? " is-pinned" : "")}
      style={{height:heroHeight ? heroHeight * .7 : 0}}
      aria-hidden="true">
      <picture>
        <source media="(min-width: 760px)" srcSet="/rosieverse/reminders/hero-desktop.webp" />
        <img src="/rosieverse/reminders/hero-mobile.webp" alt="" draggable="false" />
      </picture>
    </div>
    <header className="rr-hero" ref={heroRef}>
      {!heroLoaded && <div className="rr-hero-fallback"><small>ROSIEVERSE</small><h1>Rosie’s Reminders</h1><p>Personal Organizer</p></div>}
      <picture>
        <source media="(min-width: 760px)" srcSet="/rosieverse/reminders/hero-desktop.webp" />
        <img src="/rosieverse/reminders/hero-mobile.webp" alt="Rosie, chief executive dog, at her moonlit organizer desk"
          draggable="false" onLoad={() => setHeroLoaded(true)} onError={() => setHeroLoaded(false)} />
      </picture>
      <h1 className="rr-screen-reader">Rosie’s Reminders - Personal Organizer</h1>
    </header>
    <section className="rr-content">
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
      <div className="rr-tabs" role="tablist" aria-label="Organizer view">
        <img className="rr-tabs-continuous-art" src="/rosieverse/reminders/approved-art/today-calendar-continuous.webp"
          alt="" aria-hidden="true" draggable="false" />
        <button type="button" role="tab" aria-label="Today" aria-selected={tab === "today"}
          className={tab === "today" ? "active" : ""}
          onClick={() => {
            const next = section === "today" && tab === "today" ? null : "today";
            setTab(next); setSection("today");
            if (next) scrollToOrganizer();
          }}><span className="rr-screen-reader">Today</span></button>
        <button type="button" role="tab" aria-label="Calendar" aria-selected={tab === "calendar"}
          className={tab === "calendar" ? "active" : ""}
          onClick={() => {
            const next = section === "today" && tab === "calendar" ? null : "calendar";
            setTab(next); setSection("today"); setMonth(dateObj(selectedDate));
            if (next) scrollToOrganizer();
          }}><span className="rr-screen-reader">Calendar</span></button>
      </div>
      {(section !== "today" || tab !== null) && <section className="rr-paper" ref={organizerRef} aria-label="Reminders organizer">
        {!(section === "today" && tab === "calendar") && (
          <div className="rr-panel-head">
            <span className="rr-emblem" aria-hidden="true">♛</span>
            <div><h2>{section === "today" ? "Today at a Glance"
              : CATEGORIES.find(x => x.id === section)?.title}</h2>
              <p>{section === "today" ? "Your day, beautifully organized. Small steps make a brighter tomorrow."
                : CATEGORIES.find(x => x.id === section)?.detail}</p></div>
          </div>
        )}
        {storageError && <p className="rr-warning" role="alert">{storageError}</p>}
        {notice && <div className="rr-feedback" role="status"><span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}
        {undoSnapshot && <div className="rr-undo-line"><span>Last deletion or replacement can be reversed.</span>
          <button type="button" onClick={undoLast}>↶ Undo</button></div>}
        {["today", "tasks", "appointments", "shopping"].includes(section) && <div className="rr-utilities" aria-label="Organize reminders">
          <label className="rr-search-label"><span className="rr-screen-reader">Search current list</span>
            <input type="search" autoComplete="off" value={searchText}
              onChange={e => setSearchText(e.target.value)} placeholder="Search reminders and details…" /></label>
          <label className="rr-status-label"><span className="rr-screen-reader">Filter reminders</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All</option><option value="open">Not done</option>
              <option value="done">Completed</option><option value="high">★ Priority</option>
            </select></label>
          <div className="rr-utility-actions">
            {section === "shopping" && <button type="button" onClick={copyShopping}>Copy unchecked</button>}
            {section !== "shopping" && <button type="button" onClick={() => exportCalendar(section === "today" ? store.items : store.items.filter(x => x.category === section))}>↓ Calendar .ics</button>}
            {completedHere > 0 && (section !== "today" || todayView === "day") && <button type="button" onClick={clearCompleted}>Clear completed ({completedHere})</button>}
            {searchText && <button type="button" onClick={() => setSearchText("")}>Clear search</button>}
          </div>
        </div>}

        {section === "today" && <>
          <div className="rr-day-views" role="group" aria-label="Schedule range">
            <button type="button" className={todayView === "day" ? "active" : ""}
              aria-pressed={todayView === "day"} onClick={() => setTodayView("day")}>Selected day</button>
            <button type="button" className={todayView === "upcoming" ? "active" : ""}
              aria-pressed={todayView === "upcoming"} onClick={() => setTodayView("upcoming")}>Next 14 days ({upcomingCount})</button>
            <button type="button" className={todayView === "overdue" ? "active" : ""}
              aria-pressed={todayView === "overdue"} onClick={() => setTodayView("overdue")}>Overdue ({overdueCount})</button>
          </div>
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
                    onClick={() => { setSelectedDate(day); setTodayView("day"); }}>{Number(day.slice(8))}
                    {store.items.some(x => isScheduled(x, day)) && <i aria-hidden="true"/>}</button>
                : <span key={"blank"+i} />)}</div>
          </div>}
          <div className="rr-datebar">
            <button type="button" onClick={() => moveDay(-1)} aria-label="Previous day">‹</button>
            <strong>{todayView === "overdue" ? "Unfinished past-due items" :
              todayView === "upcoming" ? "Upcoming from " + pretty(selectedDate, {month:"short",day:"numeric"}) :
              pretty(selectedDate)}</strong>
            <button type="button" onClick={() => moveDay(1)} aria-label="Next day">›</button>
            <button type="button" className="rr-today-link" onClick={() => { setSelectedDate(dateKey()); setMonth(dateObj(dateKey())); }}>Today</button>
          </div>
        </>}
        {section === "shopping" && <>
          <form className="rr-quick-list-form rr-groceries-input" onSubmit={addGroceries}>
            <label htmlFor="rr-groceries-input">Grocery List</label>
            <textarea id="rr-groceries-input" aria-label="Grocery list items"
              rows={4} value={groceryDraft} onChange={e => setGroceryDraft(e.target.value)}
              placeholder={"Milk, eggs, cheese\nAvocados, bananas\nCoffee"} />
            <button type="submit" disabled={!groceryDraft.trim()}>＋ Add Items</button>
          </form>
          {shown.length > 0 && <div className="rr-simple-rows rr-grocery-rows" role="list" aria-label="Grocery checklist">
            {shown.map(item => <div key={item.id} role="listitem"
              className={"rr-simple-row rr-grocery-row"+(isDone(item, selectedDate) ? " is-done" : "")}>
              <button type="button" className="rr-simple-check" aria-label={(isDone(item, selectedDate) ? "Mark incomplete: " : "Complete: ") + item.title}
                aria-pressed={isDone(item, selectedDate)} onClick={() => toggleDone(item)}>{isDone(item, selectedDate) ? "✓" : ""}</button>
              {editingQuickId === item.id ? <form className="rr-simple-edit" onSubmit={saveQuickEdit}>
                <input autoFocus value={editingQuickTitle} onChange={e => setEditingQuickTitle(e.target.value)}
                  aria-label={"Rename "+item.title} onBlur={saveQuickEdit} maxLength={140} />
              </form> : <span className="rr-quick-title" tabIndex={0}
                role="button" aria-label={"Rename " + item.title}
                onKeyDown={e => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); startQuickEdit(item); } }}
                onClick={() => startQuickEdit(item)}>{item.title}</span>}
              <button type="button" className="rr-quick-edit" onClick={() => openEdit(item)}
                aria-label={"Edit details for " + item.title}>Edit</button>
              <button type="button" className="rr-simple-remove" aria-label={"Remove "+item.title}
                onClick={() => removeQuick(item.id)}>×</button>
            </div>)}
          </div>}
          {!shown.length && <p className="rr-quick-empty">Your grocery list is empty.</p>}
        </>}

        {section === "tasks" && <>
          <form className="rr-quick-list-form rr-task-entry" onSubmit={addQuickTask}>
            <label htmlFor="rr-task-input">Things to do</label>
            <div className="rr-task-input-row">
              <input id="rr-task-input" value={quickTask} aria-label="New task"
                onChange={e=>setQuickTask(e.target.value)} maxLength={140}
                placeholder="Type a task, then press Return…" />
              <button type="submit" disabled={!quickTask.trim()} aria-label="Add task">＋</button>
            </div>
            <div className="rr-quick-options"><label>Due
              <select value={quickDue} onChange={e => setQuickDue(e.target.value)}>
                <option value="today">Today</option><option value="tomorrow">Tomorrow</option>
                <option value="none">No date</option>
              </select></label>
              <label className="rr-priority-toggle"><input type="checkbox" checked={quickPriority}
                onChange={e => setQuickPriority(e.target.checked)} />★ High priority</label></div>
            <small>Press Return to add. Tap a task to rename; use Edit for dates, notes and repeats.</small>
          </form>
          <div className="rr-simple-rows rr-task-rows">{shown.map(item =>
            <div key={item.id} className={"rr-simple-row"+(isDone(item, selectedDate) ? " is-done" : "")}>
              <button type="button" className="rr-simple-check"
                aria-label={(isDone(item, selectedDate) ? "Mark incomplete: " : "Complete: ") + item.title}
                aria-pressed={isDone(item, selectedDate)} onClick={() => toggleDone(item)}>{isDone(item, selectedDate) ? "✓" : ""}</button>
              {editingQuickId === item.id ? <form className="rr-simple-edit" onSubmit={saveQuickEdit}>
                <input autoFocus value={editingQuickTitle} onChange={e=>setEditingQuickTitle(e.target.value)}
                  aria-label={"Rename "+item.title} onBlur={saveQuickEdit} maxLength={140} />
              </form> : <span className="rr-quick-title" role="button" tabIndex={0}
                aria-label={"Rename " + item.title}
                onKeyDown={e => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); startQuickEdit(item); } }}
                onClick={()=>startQuickEdit(item)}>{item.title}
                {item.date && <small>{item.date === liveDay ? "Today" : pretty(item.date,{month:"short",day:"numeric"})}{item.time ? " · " + item.time : ""}</small>}
              </span>}
              {canDefer(item) && <button type="button" className="rr-quick-defer"
                onClick={() => deferItem(item)} aria-label={"Move " + item.title + " to tomorrow"}>Tomorrow</button>}
              <button type="button" className="rr-quick-edit" onClick={() => openEdit(item)}
                aria-label={"Edit details for " + item.title}>Edit</button>
              <button type="button" className="rr-simple-remove" aria-label={"Remove "+item.title}
                onClick={()=>removeQuick(item.id)}>×</button>
            </div>)}</div>
          {!shown.length && <p className="rr-quick-empty">One task, one checkbox. Begin anywhere.</p>}
        </>}
        {(section === "today" || section === "appointments") && <>
          {shown.length > 0 && <div className="rr-rows">
            {shown.map(item => <div key={item.id} className={"rr-entry" + (isDone(item, item.occurrenceDate || selectedDate) ? " is-done" : "")}>
              <button type="button" className="rr-check" aria-label={(isDone(item, item.occurrenceDate || selectedDate) ? "Mark incomplete: " : "Complete: ") + item.title}
                aria-pressed={isDone(item, item.occurrenceDate || selectedDate)} onClick={() => toggleDone(item)}>{isDone(item, item.occurrenceDate || selectedDate) ? "✓" : ""}</button>
              <div className="rr-entry-content"><strong>{item.title}</strong>
                {(item.detail || item.date || item.time || (item.repeat && item.repeat !== "none")) && <small>
                  {[item.occurrenceDate ? pretty(item.occurrenceDate,{month:"short",day:"numeric"}) :
                    section !== "today" && item.date ? pretty(item.date, {month:"short",day:"numeric"}) :
                    isOverdue(item,liveDay) ? "Overdue · " + pretty(item.date,{month:"short",day:"numeric"}) : "",
                    item.time || "", item.repeat !== "none" ? item.repeat : "", item.detail].filter(Boolean).join(" · ")}</small>}
              </div>{item.priority === "high" && <span className="rr-star" aria-label="High priority">★</span>}
              {canDefer(item) && <button type="button" className="rr-quick-defer"
                onClick={() => deferItem(item)}>Tomorrow</button>}
              <button type="button" className="rr-edit" onClick={() => openEdit(item)} aria-label={"Edit "+item.title}>›</button>
            </div>)}
          </div>}
          {!shown.length && <p className="rr-empty">{searchText ? "No reminders match your search." :
            todayView === "overdue" && section === "today" ? "Nothing overdue. Beautifully caught up." :
            todayView === "upcoming" && section === "today" ? "No unfinished reminders in the next 14 days." :
            "Nothing scheduled in this view."}</p>}
          {featured && <div className="rr-priority"><span>★</span><div><b>Top Priority</b><p>{featured.title}</p></div></div>}
          <button type="button" className="rr-primary" onClick={() => openNew()}>＋ Add {section === "appointments" ? "Appointment" : "Reminder"}</button>
        </>}

        {section === "notes" && <>
          {user && <div className="rr-note-scope" role="group" aria-label="Note storage location">
            <button type="button" aria-pressed={noteScope === "cloud"} className={noteScope === "cloud" ? "active" : ""}
              onClick={() => setNoteScope("cloud")}>Cloud notes ({cloudNoteCount})</button>
            <button type="button" aria-pressed={noteScope === "device"} className={noteScope === "device" ? "active" : ""}
              onClick={() => setNoteScope("device")}>This device ({store.notes.length})</button>
          </div>}
          {user && noteScope === "cloud" ? <PrivateNotes onCountChange={setCloudNoteCount} /> : <div className="rr-notes">
          <div className="rr-side-head"><strong>Your Notes</strong><button type="button" onClick={addNote}>＋ New note</button></div>
          <label className="rr-note-find"><span className="rr-screen-reader">Search local notes</span>
            <input type="search" value={noteSearch} onChange={e => setNoteSearch(e.target.value)}
              placeholder="Find notes by title or text…" /></label>
          <div className="rr-note-picker">{matchingNotes.map(note => <button key={note.id} type="button"
            className={notesActive?.id === note.id ? "active" : ""} onClick={() => setFocusedNote(note.id)}>{note.title}</button>)}</div>
          {notesActive ? <div className="rr-note-editor">
            <input aria-label="Note title" value={notesActive.title} onChange={e => updateNote(notesActive.id, { title: e.target.value })} />
            <textarea aria-label="Note text" rows={7} value={notesActive.body}
              onChange={e => updateNote(notesActive.id, { body: e.target.value })} placeholder="Write down your brightest thoughts..." />
            <div className="rr-note-footer"><span>Saved automatically on this device</span>
              <button type="button" onClick={() => { if(window.confirm("Delete this note?")) {setStore(prev => ({...prev, notes:prev.notes.filter(n => n.id !== notesActive.id)})); setFocusedNote(null);}}}>Delete note</button></div>
          </div> : <p className="rr-empty">A fresh page, waiting for an excellent idea.</p>}
        </div>}
        </>}

        {section === "goals" && <div className="rr-goals">
          <h3>Goals</h3>
          <form className="rr-inline-add" onSubmit={addGoal}><input aria-label="New goal" placeholder="A goal worth pursuing" value={goalInput} onChange={e => setGoalInput(e.target.value)} maxLength={140}/><button type="submit" className="rr-art-add"><img className="rr-action-art" src="/rosieverse/reminders/approved-art/add-art.webp" alt="" draggable="false" /><span className="rr-screen-reader">Add</span></button></form>
          {store.goals.map(goal => <div className="rr-goal" key={goal.id}>
            <strong>{goal.title}</strong><span>{goal.progress}%</span>
            <label className="rr-goal-slider"><span className="rr-screen-reader">Progress for {goal.title}</span>
              <input type="range" min="0" max="100" step="5" value={goal.progress}
                onChange={e => setStore(prev => ({...prev,goals:prev.goals.map(g => g.id === goal.id ?
                  {...g,progress:Number(e.target.value)} : g)}))}/></label>
            <div className="rr-progress" role="progressbar" aria-valuenow={goal.progress} aria-valuemin={0} aria-valuemax={100}><i style={{width:goal.progress+"%"}}/></div>
            <button type="button" onClick={() => setStore(prev => ({...prev, goals:prev.goals.map(g => g.id === goal.id ? {...g,progress:Math.min(100,g.progress+25)}:g)}))}>＋ 25%</button>
            <button type="button" onClick={() => setStore(prev => ({...prev, goals:prev.goals.filter(g=>g.id !== goal.id)}))} aria-label={"Remove goal "+goal.title}>Remove</button>
          </div>)}
          <h3>Gratitude Journal</h3>
          <form className="rr-inline-add" onSubmit={addGratitude}><input aria-label="Gratitude entry" placeholder="Something good about today…" value={gratitudeInput} onChange={e=>setGratitudeInput(e.target.value)} maxLength={300}/><button type="submit" className="rr-art-add"><img className="rr-action-art" src="/rosieverse/reminders/approved-art/add-art.webp" alt="" draggable="false" /><span className="rr-screen-reader">Add</span></button></form>
          {store.gratitude.map(g => <div className="rr-gratitude" key={g.id}><span><b>{pretty(g.date,{month:"short",day:"numeric"})}</b> {g.text}</span><button type="button" aria-label="Remove gratitude entry" onClick={() => setStore(prev=>({...prev,gratitude:prev.gratitude.filter(x=>x.id!==g.id)}))}>×</button></div>)}
          {!store.gratitude.length && !store.goals.length && <p className="rr-empty">A brighter day begins with one small step.</p>}
        </div>}
        <div className="rr-backup-tools" aria-label="Save or restore your organizer">
          <div className="rr-backup-actions">
            <button type="button" onClick={exportData}>↓ Download backup</button>
            <button type="button" onClick={() => importRef.current?.click()}>↑ Restore backup</button>
            <input ref={importRef} type="file" accept=".json,application/json"
              className="rr-screen-reader" onChange={importData}
              aria-label="Select Rosie Reminders backup" tabIndex={-1} />
          </div>
          <small>Reminders, shopping, goals and device notes save locally. Backups can move them to another device; signed-in cloud notes are separate.</small>
        </div>
      </section>}
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
            <option value="none">Never</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
          </select></label><label>Priority<select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
            <option value="normal">Normal</option><option value="high">High</option>
          </select></label></div>
          {form.id && form.date && <button type="button" className="rr-export-event"
            onClick={() => exportCalendar([form])}>↓ Add to calendar</button>}
          <div className="rr-modal-actions">{form.id && <button type="button" className="rr-danger" onClick={()=>removeItem(form.id)}>Delete</button>}
            <button type="button" onClick={()=>setEditorOpen(false)}>Cancel</button><button className="rr-save rr-art-save" type="submit"><img className="rr-action-art" src="/rosieverse/reminders/approved-art/save-art.webp" alt="" draggable="false" /><span className="rr-screen-reader">Save Reminder</span></button></div>
        </form>
      </section>
    </div>}
  </main>;
}
