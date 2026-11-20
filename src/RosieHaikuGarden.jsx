import React, { useMemo, useState } from "react";
import { formatHaiku, localDayKey, poemForDay, poemForTopic, ROSIE_HAIKU_MOODS } from "./haikuEngine.js";
import "./RosieHaikuGarden.css";
import RosieHaikuScene from "./RosieHaikuScene.jsx";

const JOURNAL_KEY = "rosieHaikuGardenJournalV1";
const HERO = "/rosieverse/hero.webp";
const readJournal = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(JOURNAL_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((p) => p && Array.isArray(p.lines) && p.lines.length === 3).slice(0, 60) : [];
  } catch { return []; }
};
const poemKey = (poem) => [poem.id, poem.title, poem.version ?? 0].join(":");
const clip = (value, limit) => String(value || "").slice(0, limit);
function paintCenteredText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let row = "";
  for (const word of words) {
    const candidate = row ? row + " " + word : word;
    if (row && ctx.measureText(candidate).width > maxWidth) {
      lines.push(row);
      row = word;
    } else row = candidate;
  }
  if (row) lines.push(row);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return lines.length * lineHeight;
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
async function renderPostcard(poem) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const gradient = ctx.createLinearGradient(0, 0, 0, 1600);
  gradient.addColorStop(0, "#374152");
  gradient.addColorStop(0.5, "#875e65");
  gradient.addColorStop(1, "#392934");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1600);
  try {
    const image = await loadImage(HERO);
    const scale = Math.max(1200 / image.width, 1600 / image.height);
    const cropW = 1200 / scale;
    const cropH = 1600 / scale;
    ctx.drawImage(image, (image.width - cropW) / 2, (image.height - cropH) / 2, cropW, cropH, 0, 0, 1200, 1600);
  } catch { /* A beautifully rendered offline postcard is still possible. */ }
  ctx.fillStyle = "rgba(26, 21, 32, .23)";
  ctx.fillRect(0, 0, 1200, 1600);
  ctx.fillStyle = "rgba(252, 243, 219, .94)";
  ctx.fillRect(96, 320, 1008, 955);
  ctx.strokeStyle = "#967044";
  ctx.lineWidth = 5;
  ctx.strokeRect(112, 336, 976, 923);
  ctx.strokeStyle = "rgba(151,111,64,.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(127, 351, 946, 893);
  ctx.textAlign = "center";
  ctx.fillStyle = "#7e4d40";
  ctx.font = "600 24px Georgia, serif";
  ctx.fillText("ROSIE'S HAIKU GARDEN", 600, 425);
  ctx.fillStyle = "#aa8052";
  ctx.font = "38px Georgia, serif";
  ctx.fillText("✦", 600, 499);
  ctx.fillStyle = "#44342d";
  ctx.font = "500 47px Georgia, serif";
  let lineTop = 660;
  for (const line of poem.lines) {
    lineTop += paintCenteredText(ctx, line, 600, lineTop, 850, 68) + 46;
  }
  ctx.fillStyle = "#785745";
  ctx.font = "italic 32px Georgia, serif";
  paintCenteredText(ctx, clip(poem.title, 100), 600, 1110, 840, 45);
  ctx.fillStyle = "#7d5949";
  ctx.font = "bold 55px Georgia, serif";
  ctx.fillText("◈", 600, 1195);
  ctx.fillStyle = "#fff7e8";
  ctx.font = "bold 38px Georgia, serif";
  ctx.fillText("A LITTLE WISDOM FROM ROSIE", 600, 1430);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Unable to create PNG");
  return blob;
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export default function RosieHaikuGarden({ onNavigate }) {
  const [today, setToday] = useState(() => poemForDay());
  const [poem, setPoem] = useState(() => poemForDay());
  const [mode, setMode] = useState("daily");
  const [mood, setMood] = useState("zen");
  const [topic, setTopic] = useState("");
  const [variation, setVariation] = useState(0);
  const [journal, setJournal] = useState(readJournal);
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState(false);
  const saved = useMemo(() => journal.some((entry) => poemKey(entry) === poemKey(poem)), [journal, poem]);
  const announce = (message) => setNotice(message);
  const saveEntries = (next) => {
    setJournal(next);
    try { window.localStorage.setItem(JOURNAL_KEY, JSON.stringify(next)); }
    catch { announce("Your browser could not save the journal."); }
  };
  function openDaily() {
    const refreshed = poemForDay();
    setToday(refreshed);
    setPoem(refreshed);
    setMode("daily");
    setNotice("");
  }
  function compose(event) {
    event?.preventDefault();
    const nextVariation = mode === "compose" ? variation + 1 : 0;
    setVariation(nextVariation);
    setPoem(poemForTopic(topic, mood, nextVariation));
    setMode("compose");
    announce("From Rosie's hand-curated poetry collection.");
  }
  function toggleSave() {
    if (saved) {
      saveEntries(journal.filter((entry) => poemKey(entry) !== poemKey(poem)));
      announce("Removed from the poetry journal.");
    } else {
      const entry = { id: poem.id, mood: poem.mood, season: poem.season, lines: [...poem.lines], title: poem.title, version: poem.version ?? 0, savedAt: new Date().toISOString(), source: poem.source };
      saveEntries([entry, ...journal].slice(0, 60));
      announce("Saved in Rosie's poetry journal.");
    }
  }
  async function sharePoem() {
    const text = (poem.title ? poem.title + "\n\n" : "") + formatHaiku(poem);
    try {
      if (navigator.share) await navigator.share({ title: "Rosie's Haiku Garden", text });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        announce("Poem copied to clipboard.");
      } else announce("Sharing is not supported in this browser.");
    } catch (error) {
      if (error?.name !== "AbortError") announce("Could not share this poem.");
    }
  }
  async function postcard() {
    if (working) return;
    setWorking(true);
    try {
      const blob = await renderPostcard(poem);
      const file = new File([blob], "rosie-haiku.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        try { await navigator.share({ files: [file], title: "Rosie's Haiku Garden" }); }
        catch (error) { if (error?.name !== "AbortError") downloadBlob(blob, "rosie-haiku.png"); }
      } else downloadBlob(blob, "rosie-haiku.png");
      announce("Your poetry postcard is ready.");
    } catch {
      announce("Could not make the postcard. Try sharing the text instead.");
    } finally { setWorking(false); }
  }
  function openJournalEntry(entry) {
    setPoem(entry);
    setMode("journal");
    announce("");
  }
  return (
    <main className="haiku-page" aria-label="Rosie's Haiku Garden">
      <div className="haiku-scene" aria-hidden="true"><div className="haiku-scene-fog" /></div>
      <div className="haiku-petal haiku-petal-one" aria-hidden="true" />
      <div className="haiku-petal haiku-petal-two" aria-hidden="true" />
      <div className="haiku-petal haiku-petal-three" aria-hidden="true" />
      <div className="haiku-shell">
        <header className="haiku-header">
          <button className="haiku-back" type="button" onClick={() => onNavigate("home")} aria-label="Back to RosieVerse">← <span>RosieVerse</span></button>
          <div className="haiku-heading"><div className="haiku-overline">THE LITTLE BOOK OF ROSIE</div><h1>Rosie's Haiku Garden</h1><p>Small poems. Grand opinions.</p></div>
          <div className="haiku-header-mark" aria-hidden="true">✿</div>
        </header>
        <RosieHaikuScene />
        <section className="haiku-content">
          <div className="haiku-scroll-column">
            <div className="haiku-scroll" key={poemKey(poem)}>
              <div className="haiku-scroll-inner">
                <span className="haiku-scroll-caption">{mode === "daily" ? "TODAY IN THE GARDEN" : mode === "journal" ? "FROM THE POETRY JOURNAL" : "A ROSIE ORIGINAL"}</span>
                <span className="haiku-ornament" aria-hidden="true">❀</span>
                <div className="haiku-verse" aria-label="Haiku poem">{poem.lines.map((line, index) => <p key={index} style={{ "--line-order": index }}>{line}</p>)}</div>
                <span className="haiku-metre">5 · 7 · 5</span>
                <div className="haiku-scroll-signature">— Rosie <span aria-hidden="true">✿</span></div>
                <p className="haiku-dedication">{poem.title}</p>
              </div>
            </div>
            <div className="haiku-verse-actions">
              <button type="button" onClick={toggleSave}>{saved ? "♥ Saved" : "♡ Save"}</button>
              <button type="button" onClick={sharePoem}>Share Verse</button>
              <button type="button" onClick={postcard} disabled={working}>{working ? "Painting…" : "Picture Postcard"}</button>
            </div>
            <p role="status" aria-live="polite" className="haiku-status">{notice || "Each verse is composed in the traditional three-line, 5-7-5 form."}</p>
          </div>
          <aside className="haiku-workbench" aria-label="Poetry studio">
            <nav className="haiku-tabs" aria-label="Haiku activities">
              <button type="button" className={mode === "daily" ? "selected" : ""} onClick={openDaily}>Daily</button>
              <button type="button" className={mode === "compose" ? "selected" : ""} onClick={() => setMode("compose")}>Compose</button>
              <button type="button" className={mode === "journal" ? "selected" : ""} onClick={() => setMode("journal")}>Journal <span>{journal.length}</span></button>
            </nav>
            {mode === "daily" ? (
              <div className="haiku-panel">
                <div className="haiku-section-label">A MOMENT WITH ROSIE</div>
                <h2>Today's little wisdom</h2>
                <p>One new verse each day, chosen from Rosie's own collection. A quiet moment, with just a hint of Shiba judgment.</p>
                <div className="haiku-date">{localDayKey()} <span> · </span> {today.season} in the garden</div>
                <button type="button" className="haiku-primary" onClick={() => setMode("compose")}>Ask Rosie to Compose</button>
              </div>
            ) : mode === "compose" ? (
              <form className="haiku-panel haiku-compose" onSubmit={compose}>
                <div className="haiku-section-label">ROSIE'S POETRY DESK</div>
                <h2>A poem for anything</h2>
                <label htmlFor="haiku-topic">Your subject or dedication</label>
                <input id="haiku-topic" maxLength={100} value={topic} onChange={(event) => { setTopic(event.target.value); setVariation(0); }} placeholder="Cheese, birthdays, the vacuum…" />
                <label>Rosie's disposition</label>
                <div className="haiku-moods" role="group" aria-label="Choose mood">
                  {ROSIE_HAIKU_MOODS.map((option) => <button type="button" key={option.id} className={mood === option.id ? "selected" : ""} aria-pressed={mood === option.id} onClick={() => { setMood(option.id); setVariation(0); }}>{option.label}</button>)}
                </div>
                <button type="submit" className="haiku-primary">Unfurl a New Haiku</button>
                <p className="haiku-small-note">Rosie draws from her hand-crafted verse collection. Familiar subjects get a special verse; other dedications receive a poem in your chosen mood.</p>
              </form>
            ) : (
              <div className="haiku-panel haiku-journal">
                <div className="haiku-section-label">THE BOOK OF SMALL WISDOM</div>
                <h2>Saved favorites</h2>
                {journal.length === 0 ? (
                  <><p>Your little poetry book is empty. Save a favorite verse to begin your collection.</p><button className="haiku-primary" type="button" onClick={openDaily}>Read Today's Haiku</button></>
                ) : (
                  <div className="haiku-journal-list">
                    {journal.map((entry, index) => <button type="button" key={poemKey(entry) + "-" + index} className={poemKey(entry) === poemKey(poem) ? "selected" : ""} onClick={() => openJournalEntry(entry)}><span>{entry.lines[0]}</span><small>{entry.title}</small></button>)}
                  </div>
                )}
              </div>
            )}
            <div className="haiku-workbench-footer">A Shiba's perspective on an extraordinarily human world.</div>
          </aside>
        </section>
      </div>
    </main>
  );
}
