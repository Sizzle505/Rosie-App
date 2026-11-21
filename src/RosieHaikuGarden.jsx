import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatHaiku, localDayKey, poemForDay, poemForTopic, ROSIE_HAIKU_MOODS } from "./haikuEngine.js";
import { generateRosieText } from "./rosieAI.js";
import "./RosieHaikuGarden.css";
import RosieHaikuScene, { RosieHaikuWisdom, HAIKU_SCENES, readSelectedScene } from "./RosieHaikuScene.jsx";
import RosieZenMeditation from "./RosieZenMeditation.jsx";
import {imperialScrollWithoutChecker} from "./haikuScrollMatte.js";
import { ROSIE_HAIKU_OUTFIT_KEY, readRosieHaikuOutfit } from "./rosieHaikuOutfits.js";
import "./RosieHaikuAtmosphere.css";
import "./RosieHaikuArchiveArt.css";
import "./RosieHaikuMasthead.css";
import "./RosieHaikuConceptLayout.css";
import "./RosieHaikuNewArt.css";
import "./RosieHaikuPolishHold.css";
import "./RosieHaikuIphoneRefinement.css";
import "./RosieHaikuMobileFinal.css";
import "./RosieHaikuReviewFinal.css";
import "./RosieHaikuReleasePolish.css";
import "./RosieHaikuIphoneNov21.css";
import "./RosieHaikuPoetryPolish.css";

const JOURNAL_KEY = "rosieHaikuGardenJournalV1";
const SCROLL_KEY = "rosieHaikuScrollDesignV1";
export const HAIKU_SCROLL_STYLES = Object.freeze([
  {id:"sakura",label:"Sakura Scroll"},
  {id:"imperial",label:"Imperial Scroll"},
  {id:"grand",label:"Grand Scroll"}
]);
function readScrollStyle(){
  try{
    const saved=window.localStorage.getItem(SCROLL_KEY);
    return HAIKU_SCROLL_STYLES.some(style=>style.id===saved)?saved:"sakura";
  }catch{return "sakura";}
}
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
  const scrollDisplayRef = useRef(null);
  const poemScrollRef = useRef(null);
  const lastComposeKeyRef = useRef("");
  const workbenchRef = useRef(null);
  const scrollMobileTo = (element, placement = "center") => {
    if (!element || !window.matchMedia("(max-width: 600px)").matches) return;
    const rect = element.getBoundingClientRect();
    const nav = document.querySelector(".bottom-nav");
    const navTop = nav?.getBoundingClientRect().top ?? window.innerHeight - 86;
    const usableHeight = Math.max(250, navTop);
    const offset = placement === "top" ? 16 : Math.max(12, (usableHeight - rect.height) / 2);
    window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - offset), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  function jumpToPanel(nextMode) {
    setMode(nextMode);
    window.requestAnimationFrame(() => scrollMobileTo(workbenchRef.current, "top"));
  }
  function openComposePanel() { jumpToPanel("compose"); }
  function openMeditationPanel() { jumpToPanel("meditate"); }
  function openJournalPanel() { jumpToPanel("journal"); }
  const [scene, setScene] = useState(readSelectedScene);
  const [outfitId,setOutfitId] = useState(readRosieHaikuOutfit);
  const [scrollStyle,setScrollStyle]=useState(readScrollStyle);
  const [cleanImperialScroll,setCleanImperialScroll]=useState(null);
  useEffect(()=>{
    if(scrollStyle!=="imperial"||cleanImperialScroll)return;
    let alive=true;
    imperialScrollWithoutChecker().then(url=>{if(alive&&url)setCleanImperialScroll(url);});
    return()=>{alive=false;};
  },[scrollStyle,cleanImperialScroll]);
  const cycleScroll=step=>{
    const index=HAIKU_SCROLL_STYLES.findIndex(style=>style.id===scrollStyle);
    setScrollStyle(HAIKU_SCROLL_STYLES[(index+step+HAIKU_SCROLL_STYLES.length)%HAIKU_SCROLL_STYLES.length].id);
  };
  useEffect(()=>{try{window.localStorage.setItem(SCROLL_KEY,scrollStyle)}catch{}},[scrollStyle]);
  useEffect(()=>{try{window.localStorage.setItem(ROSIE_HAIKU_OUTFIT_KEY,outfitId);}catch{}},[outfitId]);
  const [backgroundUnavailable, setBackgroundUnavailable] = useState({});
  const selectedBackground = HAIKU_SCENES.find((item) => item.id === scene) || HAIKU_SCENES[0];
  const [mood, setMood] = useState("zen");
  const [topic, setTopic] = useState("");
  const [variation, setVariation] = useState(0);
  const [isComposing, setIsComposing] = useState(false);
  const [composeError, setComposeError] = useState("");
  const composeSequenceRef = useRef(0);
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
  const canRegenerate = mode === "compose" && poem.source === "ai" &&
    poem.topic === topic.trim() && poem.mood === mood;

  // The three painted scrolls have different aspect ratios and distinct text
  // footprints. Fit the actual rendered lines, preserving legibility and the
  // attribution space on every device instead of using character-count guesses.
  useLayoutEffect(() => {
    const scroll = poemScrollRef.current;
    if (!scroll) return undefined;
    const inner = scroll.querySelector(".haiku-scroll-inner");
    const verse = scroll.querySelector(".haiku-verse");
    const line = verse?.querySelector("p");
    if (!inner || !verse || !line) return undefined;
    let frame = 0;
    const fit = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        scroll.style.removeProperty("--haiku-fit-size");
        const baseline = Number.parseFloat(getComputedStyle(line).fontSize);
        if (!Number.isFinite(baseline)) return;
        let size = baseline;
        const available = inner.clientHeight * (scrollStyle === "grand" ? .55 : .57);
        const minSize = scrollStyle === "grand" ? 11.5 : 12;
        const lines = [...verse.querySelectorAll("p")];
        for (let step = 0; step < 27 && size > minSize; step++) {
          const tooTall = verse.scrollHeight > available;
          const tooWide = lines.some(row => row.scrollWidth > row.clientWidth + 1);
          if (!tooTall && !tooWide) break;
          size = Math.max(minSize, size - .65);
          scroll.style.setProperty("--haiku-fit-size", size + "px");
        }
      });
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    observer?.observe(inner);
    window.addEventListener("resize", fit);
    fit();
    document.fonts?.ready?.then(fit).catch(() => {});
    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
    };
  }, [poem, scrollStyle]);
  const announce = (message) => setNotice(message);
  const saveEntries = (next) => {
    setJournal(next);
    try { window.localStorage.setItem(JOURNAL_KEY, JSON.stringify(next)); }
    catch { announce("Your browser could not save the journal."); }
  };
  function openDaily() {
    composeSequenceRef.current += 1;
    setIsComposing(false);
    setComposeError("");
    const refreshed = poemForDay();
    setToday(refreshed);
    setPoem(refreshed);
    setMode("daily");
    setNotice("");
    window.requestAnimationFrame(() => scrollMobileTo(workbenchRef.current, "top"));
  }
  async function compose(event, regenerate = false) {
    event?.preventDefault();
    if (isComposing) return;
    const subject = topic.trim();
    if (!subject) {
      setComposeError("Give Rosie a subject to write about first.");
      announce("Enter a subject to request a new poem.");
      return;
    }
    const composeKey = JSON.stringify([subject, mood]);
    const nextVariation = lastComposeKeyRef.current === composeKey ? variation + 1 : 0;
    lastComposeKeyRef.current = composeKey;
    const metadata = poemForTopic(subject, mood, nextVariation);
    const sequence = ++composeSequenceRef.current;
    setVariation(nextVariation);
    setMode("compose");
    setComposeError("");
    setIsComposing(true);
    announce("Rosie is composing a new haiku about your subject…");
    try {
      const created = await generateRosieText(
        { feature: "haiku", topic: subject, mood, variation: nextVariation },
        27000
      );
      if (sequence !== composeSequenceRef.current) return;
      if (!Array.isArray(created.lines) || created.lines.length !== 3 ||
          created.lines.some(line => typeof line !== "string" || !line.trim())) {
        throw new Error("invalid_poem");
      }
      setPoem({
        ...metadata, id: created.id || `ai-${Date.now()}`,
        lines: created.lines, title: `On ${subject}`, source: "ai",
        metre: created.metre || "approximate", syllableCounts: created.counts || []
      });
      announce(created.revised ? "Rosie refined a new poem for your subject." : "A new original haiku about your subject.");
      setReaction({ type: "inspired" });
      window.requestAnimationFrame(() => scrollMobileTo(scrollDisplayRef.current));
    } catch {
      if (sequence !== composeSequenceRef.current) return;
      // Never masquerade a catalogue poem as the original the user requested.
      setComposeError("Rosie couldn't compose a new verse this time. The previous poem is unchanged. Please try again.");
      announce("No new haiku was generated; your previous poem is unchanged.");
    } finally {
      if (sequence === composeSequenceRef.current) setIsComposing(false);
    }
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
    composeSequenceRef.current += 1;
    setIsComposing(false);
    setComposeError("");
    setPoem(entry);
    setMode("journal");
    announce("");
  }
  return (
    <main className="haiku-page" data-haiku-mode={mode} aria-label="Haiku Zen Garden">
      <div className={`haiku-scene haiku-scene--${scene}`} aria-hidden="true">
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
        <div className="haiku-scene-atmosphere" />
        <div className="haiku-scene-canopy" />
        <div className="haiku-scene-fog" />
        {scene === "field" && <div className="haiku-archive-sunbeams" />}
        {(scene === "field" || scene === "temple") && <div className="haiku-archive-pollen" />}
        {scene === "zen" && <div className="haiku-archive-zen-sand" />}
        {scene === "temple" && <div className="haiku-archive-temple-lantern" />}
        <div className="haiku-archive-petals">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} className="haiku-archive-petal" style={{
              left: `${3 + (index * 23) % 94}%`,
              "--petal-delay": `${-(index * 2.7)}s`,
              "--petal-duration": `${14 + (index % 5) * 2.7}s`,
              backgroundImage: `url(/rosieverse/haiku/living-garden/petal-${String(index + 1).padStart(2, "0")}.webp)`
            }} />
          ))}
        </div>
      </div>

      <div className="haiku-shell">
        <header className="haiku-header">
          <picture className="haiku-masthead-art" aria-hidden="true">
            <source media="(max-width: 600px)" srcSet="/rosieverse/haiku/ornaments/masthead-compact.webp" />
            <img src="/rosieverse/haiku/ornaments/masthead-grand.webp" alt="" decoding="async" />
          </picture>
          <div className="haiku-heading">
            <div className="haiku-overline">ROSIE'S GARDEN OF SMALL WISDOM</div>
            <h1>Haiku Zen Garden</h1>
          </div>
          {/* The garden tagline lives beneath the poem, not across the sky. */}
        </header>
        <RosieHaikuScene scene={scene} onSceneChange={setScene} mode={mode} mood={mood} poem={poem} reaction={reaction} outfitId={outfitId} onOutfitChange={setOutfitId} />
        <section className="haiku-content">
          <div className="haiku-scroll-column">
            <div className="haiku-scroll-display" ref={scrollDisplayRef}>
            <div className="haiku-scroll" ref={poemScrollRef} data-scroll-style={scrollStyle} data-ink-state={poem.source==="ai"?"fresh":"still"} data-verse-density={poem.lines.some(line=>line.length>38)?"dense":poem.lines.some(line=>line.length>28)?"long":"normal"} key={poemKey(poem)+"-"+scrollStyle}
              style={scrollStyle==="imperial"&&cleanImperialScroll?{backgroundImage:`url("${cleanImperialScroll}")`}:undefined}>
              <div className="haiku-scroll-inner">
                <span className="haiku-scroll-caption">{mode === "daily" ? "TODAY IN THE GARDEN" : mode === "journal" ? "FROM THE POETRY JOURNAL" : "A ROSIE ORIGINAL"}</span>
                <span className="haiku-ornament" aria-hidden="true">❀</span>
                <span className="haiku-ink-ripple" aria-hidden="true" />
                <div className="haiku-verse" aria-label="Haiku poem">{poem.lines.map((line, index) => <p key={index} style={{ "--line-order": index }}>{line}</p>)}</div>
                <div className="haiku-scroll-meta" aria-label="Five seven five. Rosie.">
                  <span className="haiku-metre">{poem.source === "ai" && poem.metre !== "verified" ? "ROSIE’S VERSE" : "5 · 7 · 5"}</span>
                  <div className="haiku-scroll-signature">— Rosie <span aria-hidden="true">✿</span></div>
                </div>
                {mode !== "daily" && <p className="haiku-dedication" title={poem.title}>{poem.title?.length > 46 ? poem.title.slice(0,43) + "…" : poem.title}</p>}
              </div>
              <div className="haiku-scroll-cycle" role="group" aria-label="Change poetry scroll artwork">
                <button type="button" onClick={()=>cycleScroll(-1)} aria-label="Previous poetry scroll" title="Previous scroll">‹</button>
                <button type="button" onClick={()=>cycleScroll(1)} aria-label="Next poetry scroll" title="Next scroll">›</button>
              </div>
            </div>
            </div>
            {canRegenerate && (
              <button type="button" className="haiku-regenerate" onClick={() => compose(undefined, true)} disabled={isComposing} aria-label="Regenerate a fresh haiku about the same subject in the same style">
                <span aria-hidden="true">↻</span> Another verse · Same subject &amp; style
              </button>
            )}
            <p role="status" aria-live="polite" className="haiku-status">{notice || "Small poems. Deep breaths. Grand opinions."}</p>
            <div className="haiku-verse-actions">
              <button type="button" onClick={toggleSave} className={saved?"haiku-action-saved":""} aria-label={saved?"Remove verse from favorites":"Save verse"} title={saved?"Saved - remove":"Save verse"}>
                <img src="/rosieverse/haiku/new/ui/save-scroll.webp" alt="" aria-hidden="true" loading="lazy"/>
                {saved&&<span className="haiku-action-flourish" aria-hidden="true"/>}
              </button>
              <button type="button" onClick={sharePoem} aria-label="Share Verse" title="Share Verse">
                <img src="/rosieverse/haiku/new/ui/share-verse.webp" alt="" aria-hidden="true" loading="lazy"/>
              </button>
              <button type="button" onClick={postcard} disabled={working} aria-label={working?"Painting postcard":"Picture Postcard"} title="Picture Postcard">
                <img src="/rosieverse/haiku/new/ui/postcard.webp" alt="" aria-hidden="true" loading="lazy"/>
              </button>
            </div>
          </div>
          <aside className="haiku-workbench" ref={workbenchRef} aria-label="Poetry studio">
            <nav className="haiku-tabs" aria-label="Haiku activities">
              <button type="button" className={mode === "daily" ? "selected" : ""} onClick={openDaily}><img src="/rosieverse/haiku/ornaments/tab-daily.webp" alt="" aria-hidden="true" loading="lazy" /><span className="haiku-tab-label">Daily</span></button>
              <button type="button" className={mode === "compose" ? "selected" : ""} onClick={openComposePanel}><img src="/rosieverse/haiku/ornaments/tab-compose.webp" alt="" aria-hidden="true" loading="lazy" /><span className="haiku-tab-label">Compose</span></button>
              <button type="button" className={mode === "meditate" ? "selected" : ""} onClick={() => { openMeditationPanel(); setReaction(null); }}><img src="/rosieverse/haiku/ornaments/tab-meditate.webp" alt="" aria-hidden="true" loading="lazy" /><span className="haiku-tab-label">Meditate</span></button>
              <button type="button" className={mode === "journal" ? "selected" : ""} onClick={openJournalPanel}><img src="/rosieverse/haiku/ornaments/tab-journal.webp" alt="" aria-hidden="true" loading="lazy" /><span className="haiku-tab-label haiku-tab-journal-text">Journal</span></button>
            </nav>
            <div className="haiku-workbench-body">
            {mode === "daily" ? (
              <div className="haiku-panel">
                <div className="haiku-section-label">A MOMENT WITH ROSIE</div>
                <h2>Today's little wisdom</h2>
                <p>One new verse each day, chosen from Rosie's own collection. A quiet moment, with just a hint of Shiba judgment.</p>
                <div className="haiku-date">{localDayKey()} <span> · </span> {["winter","winter","spring","spring","spring","summer","summer","summer","autumn","autumn","autumn","winter"][new Date().getMonth()]} in the garden</div>
                <button type="button" className="haiku-primary" onClick={openMeditationPanel}>Meditate with Rosie</button>
                <button type="button" className="haiku-secondary-entry" onClick={openComposePanel}>Or ask her to compose a haiku</button>
              </div>
            ) : mode === "compose" ? (
              <form className="haiku-panel haiku-compose" onSubmit={compose}>
                <div className="haiku-section-label">ROSIE'S POETRY DESK</div>
                <div className="haiku-desk-feature">
                  <img className="haiku-desk-art" src="/rosieverse/haiku/calligraphy-desk.webp" alt="" aria-hidden="true" loading="lazy" />
                  <h2>A Poem for Everything</h2>
                </div>
                <label htmlFor="haiku-topic">What should Rosie write about?</label>
                <input id="haiku-topic" maxLength={100} value={topic} onChange={(event) => { setTopic(event.target.value); setVariation(0); setComposeError(""); }} placeholder="A thunderstorm, a rival cat, an ordinary Tuesday…" />
                <label>Rosie's disposition</label>
                <div className="haiku-moods" role="group" aria-label="Choose mood">
                  {ROSIE_HAIKU_MOODS.map((option) => <button type="button" key={option.id} className={mood === option.id ? "selected" : ""} aria-pressed={mood === option.id} onClick={() => { setMood(option.id); setVariation(0); }}>{option.label}</button>)}
                </div>
                <button type="submit" className="haiku-primary" disabled={isComposing}>{isComposing ? "Rosie is composing…" : composeError ? "Try Composing Again" : "Unfurl a New Haiku"}</button>
                {composeError && <p className="haiku-small-note" role="alert">{composeError}</p>}
                <p className="haiku-small-note">Every new verse is about your subject and written in Rosie's selected disposition. Her curated daily collection remains available separately.</p>
              </form>
            ) : mode === "meditate" ? (
              <RosieZenMeditation scene={scene} poem={poem} outfitId={outfitId} onOutfitChange={setOutfitId} />
            ) : (
              <div className="haiku-panel haiku-journal">
                <div className="haiku-section-label">THE BOOK OF SMALL WISDOM</div>
                <h2>Saved favorites</h2>
                {journal.length === 0 ? (
                  <>
                    <img className="haiku-journal-art haiku-journal-art--closed"
                      src="/rosieverse/haiku/final/journal-cover.webp" alt="" aria-hidden="true" loading="lazy"/>
                    <p>Your little poetry book is empty. Save a favorite verse to begin your collection.</p>
                    <button className="haiku-primary" type="button" onClick={openDaily}>Read Today's Haiku</button>
                  </>
                ) : (
                  <>
                    <img className="haiku-journal-art haiku-journal-art--open"
                      src="/rosieverse/haiku/final/journal-open.webp" alt="" aria-hidden="true" loading="lazy"/>
                    <div className="haiku-journal-list">
                    {journal.map((entry, index) => <button type="button" key={poemKey(entry) + "-" + index} className={poemKey(entry) === poemKey(poem) ? "selected" : ""} onClick={() => openJournalEntry(entry)}><span>{entry.lines[0]}</span><small>{entry.title}</small></button>)}
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="haiku-workbench-footer">A Shiba's perspective on an extraordinarily human world.</div>
            </div>
          </aside>
        </section>
        <RosieHaikuWisdom mode={mode} mood={mood} poem={poem} />
      </div>
    </main>
  );
}
