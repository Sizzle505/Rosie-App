import React, { useEffect, useMemo, useState } from "react";
import { formatHaiku, localDayKey, poemForDay, poemForTopic, ROSIE_HAIKU_MOODS } from "./haikuEngine.js";
import "./RosieHaikuGarden.css";
import RosieHaikuScene, { HAIKU_SCENES, readSelectedScene } from "./RosieHaikuScene.jsx";
import RosieZenMeditation from "./RosieZenMeditation.jsx";

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
const HAIKU_POSTCARD_SCENES = {
  field: "/rosieverse/haiku/field-sunrise.webp",
  zen: "/rosieverse/haiku/zen-sunrise.webp",
  temple: "/rosieverse/haiku/temple-sunrise.webp"
};
const HAIKU_POSTCARD_ROSIE = "/rosieverse/haiku/rosie-meditating-paws-up.webp";
const HAIKU_POSTCARD_SCROLL = "/rosieverse/haiku/scroll-mobile.webp";
const HAIKU_POSTCARD_MOODS = {
  zen: HAIKU_POSTCARD_ROSIE,
  savage: "/rosieverse/haiku/rosie-smug.webp",
  sweet: "/rosieverse/haiku/rosie-affectionate.webp",
  existential: "/rosieverse/haiku/rosie-existential.webp"
};
function drawImageCover(ctx, image, targetWidth, targetHeight) {
  const scale = Math.max(targetWidth / image.width, targetHeight / image.height);
  const sourceWidth = targetWidth / scale;
  const sourceHeight = targetHeight / scale;
  ctx.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
}
async function renderPostcard(poem, sceneId = "field") {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const gradient = ctx.createLinearGradient(0, 0, 0, 1600);
  gradient.addColorStop(0, "#eda0a7");
  gradient.addColorStop(.45, "#b97f80");
  gradient.addColorStop(1, "#433047");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1600);
  const background = HAIKU_POSTCARD_SCENES[sceneId] || HAIKU_POSTCARD_SCENES.field;
  try { drawImageCover(ctx, await loadImage(background), 1200, 1600); }
  catch {
    try { drawImageCover(ctx, await loadImage(HERO), 1200, 1600); }
    catch { /* preserve the sunset gradient offline */ }
  }
  ctx.fillStyle = "rgba(29, 23, 39, .2)";
  ctx.fillRect(0, 0, 1200, 1600);

  // Both the photographically rich background and Rosie are individually placed.
  // Only the poem words are generated dynamically; none are baked into the asset.
  try {
    const rosie = await loadImage(HAIKU_POSTCARD_MOODS[poem.mood] || HAIKU_POSTCARD_ROSIE);
    const height = 790;
    const width = height * (rosie.width / rosie.height);
    ctx.drawImage(rosie, 1200 - width - 35, -40, width, height);
  } catch { /* keep the selected scenery if Rosie fails to load */ }

  let hasArtScroll = false;
  try {
    ctx.drawImage(await loadImage(HAIKU_POSTCARD_SCROLL), 95, 530, 1010, 1053);
    hasArtScroll = true;
  } catch {
    ctx.fillStyle = "#fff1dc";
    ctx.fillRect(130, 640, 940, 805);
    ctx.strokeStyle = "#aa7958";
    ctx.lineWidth = 8;
    ctx.strokeRect(140, 650, 920, 785);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#6c413b";
  ctx.font = "600 24px Georgia, serif";
  ctx.fillText("HAIKU ZEN GARDEN", 600, hasArtScroll ? 849 : 765);
  ctx.fillStyle = "#493330";
  ctx.font = "500 43px Georgia, serif";
  let nextY = hasArtScroll ? 947 : 855;
  for (const line of poem.lines) {
    const advance = paintCenteredText(ctx, line, 600, nextY, 750, 57);
    nextY += Math.max(73, advance + 24);
  }
  ctx.fillStyle = "#966b55";
  ctx.font = "italic 29px Georgia, serif";
  paintCenteredText(ctx, clip(poem.title, 100), 600, hasArtScroll ? 1285 : 1190, 760, 38);
  ctx.font = "italic 36px Georgia, serif";
  ctx.fillText("Rosie  ✿", 600, hasArtScroll ? 1392 : 1305);
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
  const [scene, setScene] = useState(readSelectedScene);
  const [backgroundUnavailable, setBackgroundUnavailable] = useState({});
  const selectedBackground = HAIKU_SCENES.find((item) => item.id === scene) || HAIKU_SCENES[0];
  const [mood, setMood] = useState("zen");
  const [topic, setTopic] = useState("");
  const [variation, setVariation] = useState(0);
  const [journal, setJournal] = useState(readJournal);
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState(false);
  const [reaction, setReaction] = useState(null);
  useEffect(() => {
    if (!reaction) return undefined;
    const timeout = window.setTimeout(() => setReaction(null), 1900);
    return () => window.clearTimeout(timeout);
  }, [reaction]);
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
    setReaction({ type: "inspired" });
  }
  function toggleSave() {
    if (saved) {
      saveEntries(journal.filter((entry) => poemKey(entry) !== poemKey(poem)));
      announce("Removed from the poetry journal.");
    } else {
      const entry = { id: poem.id, mood: poem.mood, season: poem.season, lines: [...poem.lines], title: poem.title, version: poem.version ?? 0, savedAt: new Date().toISOString(), source: poem.source };
      saveEntries([entry, ...journal].slice(0, 60));
      announce("Saved in Rosie's poetry journal.");
      setReaction({ type: "triumphant" });
    }
  }
  async function sharePoem() {
    const text = (poem.title ? poem.title + "\n\n" : "") + formatHaiku(poem);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Haiku Zen Garden", text });
        setReaction({ type: "bestowing" });
      }
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        announce("Poem copied to clipboard.");
        setReaction({ type: "bestowing" });
      } else announce("Sharing is not supported in this browser.");
    } catch (error) {
      if (error?.name !== "AbortError") announce("Could not share this poem.");
    }
  }
  async function postcard() {
    if (working) return;
    setWorking(true);
    try {
      const blob = await renderPostcard(poem, scene);
      const file = new File([blob], "rosie-haiku.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        try { await navigator.share({ files: [file], title: "Haiku Zen Garden" }); }
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
    <main className="haiku-page" aria-label="Haiku Zen Garden">
      <div className="haiku-scene" aria-hidden="true">
        <img
          key={selectedBackground.src}
          className="haiku-page-landscape"
          src={backgroundUnavailable[scene] ? HERO : selectedBackground.src}
          alt=""
          onError={(event) => {
            if (event.currentTarget.src.endsWith("/hero.webp")) return;
            setBackgroundUnavailable((current) => ({ ...current, [scene]: true }));
          }}
        />
        <div className="haiku-scene-fog" />
      </div>
      <div className="haiku-petal haiku-petal-one" aria-hidden="true" />
      <div className="haiku-petal haiku-petal-two" aria-hidden="true" />
      <div className="haiku-petal haiku-petal-three" aria-hidden="true" />
      <div className="haiku-shell">
        <header className="haiku-header">
          <button className="haiku-back" type="button" onClick={() => onNavigate("home")} aria-label="Back to RosieVerse">← <span>RosieVerse</span></button>
          <div className="haiku-heading"><div className="haiku-overline">ROSIE'S GARDEN OF SMALL WISDOM</div><h1>Haiku Zen Garden</h1><p>Small poems. Deep breaths. Grand opinions.</p></div>
          <div className="haiku-header-mark" aria-hidden="true">✿</div>
        </header>
        <RosieHaikuScene scene={scene} onSceneChange={setScene} mode={mode} mood={mood} poem={poem} reaction={reaction} />
        <section className="haiku-content">
          <div className="haiku-scroll-column">
            <div className="haiku-scroll" key={poemKey(poem)}>
              <div className="haiku-scroll-inner">
                <span className="haiku-scroll-caption">{mode === "daily" ? "TODAY IN THE GARDEN" : mode === "journal" ? "FROM THE POETRY JOURNAL" : "A ROSIE ORIGINAL"}</span>
                <span className="haiku-ornament" aria-hidden="true">❀</span>
                <div className="haiku-verse" aria-label="Haiku poem">{poem.lines.map((line, index) => <p key={index} style={{ "--line-order": index }}>{line}</p>)}</div>
                <span className="haiku-metre">5 · 7 · 5</span>
                <div className="haiku-scroll-signature">— Rosie <span aria-hidden="true">✿</span></div>
                {mode !== "daily" && <p className="haiku-dedication">{poem.title}</p>}
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
              <button type="button" className={mode === "meditate" ? "selected" : ""} onClick={() => { setMode("meditate"); setReaction(null); }}>Meditate</button>
              <button type="button" className={mode === "journal" ? "selected" : ""} onClick={() => setMode("journal")}>Journal <span>{journal.length}</span></button>
            </nav>
            {mode === "daily" ? (
              <div className="haiku-panel">
                <div className="haiku-section-label">A MOMENT WITH ROSIE</div>
                <h2>Today's little wisdom</h2>
                <p>One new verse each day, chosen from Rosie's own collection. A quiet moment, with just a hint of Shiba judgment.</p>
                <div className="haiku-date">{localDayKey()} <span> · </span> {["winter","winter","spring","spring","spring","summer","summer","summer","autumn","autumn","autumn","winter"][new Date().getMonth()]} in the garden</div>
                <button type="button" className="haiku-primary" onClick={() => setMode("meditate")}>Meditate with Rosie</button>
                <button type="button" className="haiku-secondary-entry" onClick={() => setMode("compose")}>Or ask her to compose a haiku</button>
              </div>
            ) : mode === "compose" ? (
              <form className="haiku-panel haiku-compose" onSubmit={compose}>
                <div className="haiku-section-label">ROSIE'S POETRY DESK</div>
                <img className="haiku-desk-art" src="/rosieverse/haiku/calligraphy-desk.webp" alt="" aria-hidden="true" loading="lazy" />
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
            ) : mode === "meditate" ? (
              <RosieZenMeditation scene={scene} />
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
