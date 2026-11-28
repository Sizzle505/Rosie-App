import React, { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import "./styles.css";
import "./fortune-effects.css";
import "./visual-rebuild.css";
import "./fortune-desktop.css";
import "./cheese-left-panel.css";
import "./captain-refresh.css";
import "./cosmic-odyssey-portal.css";
import "./captain-arcade-backgrounds.css";
import "./captain-scene.css";
import "./captain-motion.css";
import "./responsive-polish.css";
import "./barkbridge-reference.css";
import "./captain-immersive.css";
import "./fortune-barkbridge-atmosphere.css";
import "./captain-levels.css";
import "./captain-cinematic-refinement.css";
import "./barkbridge-assets.css";
import "./aesthetic-polish.css";
import "./requested-polish.css";
import "./barkbridge-premium-crests.css";
import "./barkbridge-option-one.css";
import "./cheese-honeywood.css";
import "./cheese-sprint.css";
import "./ipad-polish.css";
import "./desktop-nov18.css";
import "./yachtDashExpansion.css";
import "./yacht-console.css";
import "./ipad-composition.css";
import "./ipad-fortune-cheese.css";
import { CHEESE_PREVIEW_MS, CHEESE_SPRINT_MS, secondsUntilDeadline, beforeDeadline } from "./cheeseSprint.js";
import Captain2Game from "./captain2.jsx";
import AxisJoystick from "./AxisJoystick.jsx";
import EmberTunnelDrill from "./EmberTunnelDrill.jsx";
import CaptainPauseMenu from "./CaptainPauseMenu.jsx";
import CaptainCinematicEnvironment from "./CaptainCinematicEnvironment.jsx";
import CaptainLevelScenery from "./CaptainLevelScenery.jsx";
import { CaptainScenicPainting, useCaptainSceneryTransition } from "./CaptainSceneryTransition.jsx";
import CaptainLotusGust from "./CaptainLotusGust.jsx";
import { CAPTAIN_LEVELS, shuffleCaptainLevelOrder } from "./captainLevels.js";
import { YACHT_CHAPTERS, YACHT_CHAPTER_GOALS, YACHT_CHAPTER_PHASES, YACHT_PLAYTEST_ALL_LEVELS, yachtPlayableLimit, yachtSceneFor, yachtRunSeconds, yachtSceneSeconds, yachtSceneIndex, yachtMovementMultiplier, yachtWaveFor, yachtPacedWaveFor, yachtFollowUpRewardLane, yachtUnlockedLevel, yachtNextUnlocked, yachtMedalsFor, yachtNextMedalHint, parseYachtRecords, updateYachtRecords, isYachtHazard, yachtTouchesHazard, yachtNearMiss, yachtCatchStart, yachtApproachAt, yachtPickupApproachAt, yachtBonusTreatLane, yachtSakuraDelivery, yachtSpawnInterval, yachtObjectSpeed, yachtAssetScale, yachtRivalSpriteFor, yachtRivalAttackLane, YACHT_EXTRA_TREAT_MS, yachtExtraTreatMs, YACHT_CLEAN_PASS_POINTS, YACHT_CLEAN_PASS_TURBO, yachtClampLane, yachtSwipeSteps, yachtThreatForecast, yachtCanTakeHit, YACHT_IMPACT_GRACE_MS } from "./yachtDashExpansion.js";
import { ARENA, ARENA_BACKGROUNDS, ARENA_SPRITES, ARENA_FURNITURE, arenaInitial, arenaFinaleStart, arenaStep, arenaFacing, arenaPhaseGoal, arenaBackgroundIndex, arenaSpriteNormStyle } from "./yachtArenaBoss.js";
import { ArenaJoystickInput, arenaJoystickKnobOffset, arenaJoystickVector,
  arenaJoystickZoneContains } from "./yachtArenaTouchInput.js";
import KuroiFireworksCanvas from "./KuroiFireworksCanvas.jsx";
import CaptainOuterAtmosphere from "./CaptainOuterAtmosphere.jsx";
import RosieCardVault from "./RosieCardVault.jsx";
import RosieRandomizers from "./RosieRandomizers.jsx";
import RosieHome from "./RosieHome.jsx";
import RosieHaikuGarden from "./RosieHaikuGarden.jsx";
import { generateRosieText } from "./rosieAI.js";
import RosieMusicPlayer from "./RosieMusicPlayer.jsx";
import RosieReminders from "./RosieReminders.jsx";
import RosieCalculations from "./RosieCalculations.jsx";
import RosieTimekeeper from "./RosieTimekeeper.jsx";
import RosieResources from "./RosieResources.jsx";
import RosieQrAtelier from "./RosieQrAtelier.jsx";
import RosieRecipes from "./RosieRecipes.jsx";
import RosieReviews from "./RosieReviews.jsx";
import LayoutPlayground, { LayoutPreviewBridge } from "./LayoutPlayground.jsx";
import SecretLayoutStudio from "./SecretLayoutStudio.jsx";
import { LAYOUT_UNLOCK_KEY } from "./layoutStudioScope.js";
import { AccountProvider } from "./private/AccountContext.jsx";
import AccountPortal from "./private/AccountPortal.jsx";
import captainWindSprite from "./captainWindSprite.js";
// Load last to preserve approved desktop compositions across monitor ratios.
import "./desktop-design-preservation.css";
import "./fortune-verse-scroll.css";
import "./royal-navigation.css";
import "./captain-phone-layout.css";
import "./captain-control-surfaces.css";
import "./fortune-layered.css";


const capitalizeFirst = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

// The utility pages and their landing hub share the Resources navigation family.
const RESOURCE_PAGE_IDS = new Set(["resources", "reminders", "qr-atelier", "calculations", "recipes", "timekeeper", "reviews"]);

const NAV_ART = "/rosieverse/ui/royal-nav/";
function RoyalNavArt({ name, className = "rosie-nav-icon" }) {
  // The version query keeps phones from serving a stale cached copy of the
  // current nav art (Mitchell, 2026-11-26: the iPhone must use the newest
  // Home and Resources buttons by the nav bar). Bump when the art changes. (Bumped 2026-11-26 r2: Mitchell still saw stale Home/Resources art on iPhone after the first bust.)
  return <img className={className} src={NAV_ART + name + (name === "zen" ? ".svg" : ".webp") + "?v=20261126-2"} alt="" aria-hidden="true" draggable="false" decoding="async" />;
}
function ResourceNavIcon({ type }) {
  const name = ({ "qr-atelier": "qr", timekeeper: "timekeepers" })[type] || type;
  return <RoyalNavArt name={name} />;
}
function RosieNavIcon({ type }) {
  return <RoyalNavArt name={type} />;
}

const RESPONSES = {
  positive: [
    "Absolutely. My ears perked up for this one.",
    "Yes. Proceed with unreasonable confidence.",
    "The treats align in your favor.",
    "Rosie says yes. Rosie is rarely wrong.",
    "Do it. Then act like it was obvious.",
    "A very strong yes - tail-wag strong.",
    "You already know the answer. It's yes.",
    "Fortune favors the well-snacked.",
    "Yes. I would bet someone else's treats on it.",
    "The paw has spoken: proceed."
  ],
  uncertain: [
    "Maybe. Sniff around a little longer.",
    "The scent is promising, but unclear.",
    "Ask again after a snack.",
    "Possible. I'm giving it one ear up.",
    "The universe is being suspiciously vague.",
    "Not yet. Circle the idea three times first.",
    "I need more information. Preferably cheese.",
    "Could go either way. Keep your leash loose.",
    "There is something here. Continue investigating.",
    "The answer is hiding under the couch."
  ],
  negative: [
    "No. And I will not be taking questions.",
    "Absolutely not. Back away from the vacuum.",
    "My instincts say no. My instincts are excellent.",
    "Do not chase this squirrel.",
    "Nope. Wrong tree.",
    "I wouldn't. And I have eaten things off the floor.",
    "Hard no. Deploy the judgmental stare.",
    "Retreat gracefully and demand compensation.",
    "The treats do not support this decision.",
    "No. Go lie in the sun and reconsider."
  ]
};

const FORTUNES = Object.entries(RESPONSES).flatMap(([tone, values]) =>
  values.map((text, index) => ({ id: `${tone}-${index}`, tone, text }))
);

const QUICK_QUESTIONS = [
  "Would this problem improve after a walk and a snack?",
  "Should I say yes, then become mysteriously unavailable?",
  "Is it brave to order dessert first?",
  "Would a ceremonial cheese plate clarify the situation?",
  "Should I accept the invitation if there is a dog there?",
  "Would a nap count as a tactical reset?",
  "Should I make the responsible choice or the charming one?",
  "Is this person worthy of my best cheese?",
  "Should I follow this squirrel of an idea?",
  "Would Rosie consider this elegant mischief?",
  "Should I solve this now, or appoint Future Me as minister?",
  "Is today a good day for a glorious, unnecessary entrance?",
  "Should I bring a snack in case destiny is poorly catered?",
  "Would saying no be more powerful in a dramatic coat?",
  "Should I choose cozy, chaos, or both?",
  "Should I answer now, or preserve the mystique until morning?",
  "Would this be easier after I put on a better outfit?",
  "Would Rosie approve of the level of drama here?",
  "Should I go, provided there are appetizers?",
  "Would a walk around the block improve my perspective?",
  "Is the plan elegant enough to survive daylight?",
  "Should I ask the question everyone is politely avoiding?",
  "Would one small treat improve everyone's judgment?",
  "Would tomorrow-me thank me for doing this tonight?",
  "Is there a graceful way to make this somebody else's problem?",
  "Is this a moment for poise, snacks, or both?",
  "Is this worth my energy, or just a very shiny distraction?",
  "Should I follow the sensible route, or the one with better snacks?"
];

const OMENS = {
  treat: ["cheddar", "peanut butter", "salmon", "chicken", "sweet potato", "a suspicious crumb"],
  hour: ["8:08", "11:11", "2:22", "4:28", "6:06", "9:09"],
  avoid: ["vacuum cleaners", "closed doors", "empty bowls", "wet grass", "squirrels with agendas", "unearned baths"]
};

function secureIndex(length) {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] % length;
}

function samplePrompts(count = 4, exclude = []) {
  const pool = QUICK_QUESTIONS.filter((prompt) => !exclude.includes(prompt));
  const chosen = [];
  while (pool.length && chosen.length < count) {
    chosen.push(pool.splice(secureIndex(pool.length), 1)[0]);
  }
  return chosen;
}

function readRecent() {
  try {
    return JSON.parse(sessionStorage.getItem("rosieRecent") || "[]");
  } catch {
    return [];
  }
}

function dayNumber() {
  const date = new Date();
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return [...key].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 0);
}


function createWhistleBlobUrl() {
  const sampleRate = 24000;
  const duration = 0.49;
  const sampleCount = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + sampleCount);
  const view = new DataView(buffer);

  const writeString = (offset, value) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + sampleCount, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeString(36, "data");
  view.setUint32(40, sampleCount, true);

  let phase = 0;
  let seed = 31847;
  const noise = () => {
    seed = (seed * 48271) % 2147483647;
    return (seed / 2147483647) * 2 - 1;
  };

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const p = time / duration;

    // A compact two-gesture recall whistle: buoyant rise, tiny dip, bright lifted finish.
    let frequency;
    if (p < 0.42) {
      const q = p / 0.42;
      frequency = 1575 + 545 * Math.sin(q * Math.PI * 0.54);
    } else if (p < 0.60) {
      const q = (p - 0.42) / 0.18;
      frequency = 2120 - 245 * Math.sin(q * Math.PI * 0.78);
    } else {
      const q = (p - 0.60) / 0.40;
      frequency = 1885 + 355 * Math.sin(q * Math.PI * 0.58);
    }

    frequency += 8 * Math.sin(time * 66);
    phase += Math.PI * 2 * frequency / sampleRate;

    const attack = Math.min(1, time / 0.024);
    const release = Math.min(1, (duration - time) / 0.058);
    const smile = 0.9 + 0.1 * Math.sin(Math.PI * p);
    const amplitude = attack * release * smile * 0.43;
    const breath = noise() * 0.012;
    const tone =
      Math.sin(phase) +
      0.06 * Math.sin(phase * 2) +
      0.018 * Math.sin(phase * 3);

    const sample = Math.max(-1, Math.min(1, (tone + breath) * amplitude));
    view.setUint8(44 + index, Math.round(128 + sample * 112));
  }

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

function FortuneLens({
  consulting,
  answer,
  revealStage,
  answerDismissed,
  onDismiss
}) {
  const manifesting = revealStage === "manifesting";
  const dismissing = revealStage === "dismissing";
  const showAnswer = Boolean(answer && !answerDismissed);
  const interactive = showAnswer && revealStage === "revealed";
  const verseViewportRef = useRef(null);
  const verseContentRef = useRef(null);
  const [verseTravel, setVerseTravel] = useState(0);

  // Measure wrapped text, not character counts, to preserve the original glass.
  useLayoutEffect(() => {
    if (!showAnswer) { setVerseTravel(0); return undefined; }
    const viewport = verseViewportRef.current;
    const content = verseContentRef.current;
    if (!viewport || !content) return undefined;
    let frame = 0;
    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const distance = Math.max(0, Math.ceil(content.scrollHeight - viewport.clientHeight + 2));
        setVerseTravel(previous => Math.abs(previous - distance) > 2 ? distance : previous);
      });
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(viewport);
    observer?.observe(content);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [showAnswer, answer?.id]);

  const state = [
    consulting ? "is-consulting" : "",
    manifesting ? "is-manifesting" : "",
    dismissing ? "is-dismissing" : "",
    showAnswer ? `has-answer tone-${answer.tone}` : "",
    verseTravel > 3 ? "is-long-verse" : ""
  ].filter(Boolean).join(" ");

  function handleKeyDown(event) {
    if (!interactive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onDismiss?.();
    }
  }

  return (
    <div
      className={`fortune-lens ${state}`}
      aria-live="polite"
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? "Dismiss Rosie's answer with magic" : undefined}
      onPointerUp={interactive ? (event) => {
        if (verseTravel > 3 && window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
            event.target.closest?.(".lens-verse-window")) return;
        onDismiss?.();
      } : undefined}
      onClick={interactive ? (event) => {
        if (event.detail === 0) onDismiss?.();
      } : undefined}
      onKeyDown={handleKeyDown}
    >
      {consulting && (
        <div className="lens-consulting">
          <div className="consulting-runes" aria-hidden="true">
            <i>✦</i><i>☾</i><i>◆</i><i>✧</i>
          </div>
          <small>ROSIE IS LISTENING</small>
          <em>The signs are gathering…</em>
        </div>
      )}

      {showAnswer && (
        <div className="lens-answer" key={answer.id} style={{
          "--oracle-verse-travel": `${verseTravel}px`,
          "--oracle-verse-duration": `${Math.min(19, Math.max(9, 7 + verseTravel * .11))}s`
        }}>
          <span className="answer-spark-field" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i />
          </span>
          <span className="answer-sigil" aria-hidden="true">✦</span>
          <span className="answer-kicker">THE PAW HAS SPOKEN</span>
          <div className="lens-verse-window" ref={verseViewportRef}>
            <strong className="lens-verse-text" ref={verseContentRef}>{answer.text}</strong>
          </div>
          <small>Madame Rosie’s ruling is final.</small>
        </div>
      )}

      {dismissing && (
        <div className="answer-dismiss-sparkles" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
        </div>
      )}
    </div>
  );
}

function CrystalEnergy({ consulting, answer, revealStage }) {
  const tone = answer ? `tone-${answer.tone}` : "";
  const manifesting = revealStage === "manifesting";
  return (
    <div
      className={`crystal-energy ${consulting ? "is-consulting" : ""} ${manifesting ? "is-manifesting" : ""} ${answer ? "has-answer" : ""} ${tone}`}
      aria-hidden="true"
    >
      <span className="energy-halo" />
      <span className="energy-vortex" />
      <span className="energy-mist" />
      <span className="energy-ribbon energy-ribbon-a" />
      <span className="energy-ribbon energy-ribbon-b" />
      <span className="energy-ring energy-ring-a" />
      <span className="energy-ring energy-ring-b" />
      <span className="energy-ring energy-ring-c" />
      <span className="energy-paw-core">🐾</span>
      <span className="energy-stars">
        <i /><i /><i /><i /><i /><i /><i /><i />
      </span>
      <span className="energy-flare" />
    </div>
  );
}

const FORTUNE_POSES = [
  { image: "rosie-oracle", facing: "left" },
  { image: "rosie-mysterious", facing: "left" },
  { image: "rosie-mysterious", facing: "right" },
  { image: "rosie-wise", facing: "left" },
  { image: "rosie-curious", facing: "left" },
  { image: "rosie-knowing", facing: "left" },
  { image: "rosie-revelation", facing: "left" },
];

const FORTUNE_STARS = [
  [19, 14, 0], [35, 8, 1.7], [68, 16, 3.2], [84, 9, .8],
  [13, 37, 2.6], [38, 33, 4.2], [87, 39, 1.3], [67, 45, 3.6],
  [10, 65, 4.9], [89, 68, 2.1], [24, 76, .6], [78, 80, 3.8],
  [47, 12, 2.2], [57, 29, .35], [29, 49, 1.15], [74, 55, 3.1],
  [15, 53, 2.85], [85, 58, 4.55], [32, 68, .95], [69, 72, 3.95],
];

function FortuneMachine({ consulting, answer, revealStage, answerDismissed, onDismissAnswer, flipped, turning, flipBurst, poseIndex }) {
  const manifesting = revealStage === "manifesting";
  const stageRef = useRef(null);
  const ballRef = useRef(null);
  const pose = FORTUNE_POSES[poseIndex] || FORTUNE_POSES[0];

  useEffect(() => {
    const images = [...new Set(FORTUNE_POSES.map(({ image }) => image))].map((name) => {
      const image = new Image();
      image.src = `/fortune-layers/${name}.webp`;
      return image;
    });
    return () => { images.length = 0; };
  }, []);

  // Register the answer to the separate glass layer at any viewport size.
  useEffect(() => {
    const stage = stageRef.current;
    const ball = ballRef.current;
    if (!stage || !ball) return undefined;
    function registerBall() {
      const stageBox = stage.getBoundingClientRect();
      const box = ball.getBoundingClientRect();
      if (!stageBox.width || !box.width) return;
      const glassWidth = box.width * .79;
      const glassHeight = box.height * .73;
      stage.style.setProperty("--oracle-ball-x", `${box.left - stageBox.left + box.width * .5}px`);
      stage.style.setProperty("--oracle-ball-y", `${box.top - stageBox.top + box.height * .42}px`);
      stage.style.setProperty("--oracle-ball-w", `${glassWidth}px`);
      stage.style.setProperty("--oracle-ball-h", `${glassHeight}px`);
      stage.style.setProperty("--oracle-ball-rx", `${glassWidth * .5}px`);
      stage.style.setProperty("--oracle-ball-ry", `${glassHeight * .5}px`);
    }
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(registerBall) : null;
    observer?.observe(stage);
    observer?.observe(ball);
    ball.addEventListener("load", registerBall);
    window.addEventListener("resize", registerBall);
    registerBall();
    return () => {
      observer?.disconnect();
      ball.removeEventListener("load", registerBall);
      window.removeEventListener("resize", registerBall);
    };
  }, []);
  return (
    <section
      className={`machine ${consulting ? "machine-consulting" : ""} ${manifesting ? "machine-manifesting" : ""}`}
      aria-label="Madame Rosie fortune teller"
    >
      <div className="booth">

        <div className="sign">
          <div className="sign-paw">🐾</div>
          <span className="sign-glint sign-glint-a" />
          <span className="sign-glint sign-glint-b" />
          <h1>MADAME ROSIE</h1>
          <p>SEER OF TREATS · KNOWER OF THINGS</p>
        </div>

        <div ref={stageRef} className={`stage ${flipped ? "stage-flipped" : ""} ${turning ? "stage-turning" : ""} ${manifesting ? "stage-manifesting" : ""}`}>
          <div className="fortune-layer-scene" aria-label="Rosie dressed as a jeweled fortune teller at her crystal ball">
            <img className="fortune-scene-back" src="/fortune-layers/stage.webp" alt="" />
            <span className="fortune-scene-stars" aria-hidden="true">
              {FORTUNE_STARS.map(([x, y, delay], index) => (
                <i key={index} style={{ "--star-x": `${x}%`, "--star-y": `${y}%`, "--star-delay": `${delay}s` }} />
              ))}
            </span>
            <span className="fortune-scene-lanterns" aria-hidden="true"><i /><i /></span>
            <img
              className={`fortune-scene-rosie ${consulting ? "is-consulting" : ""} ${pose.facing === "right" ? "faces-right" : ""} ${turning ? "is-turning" : ""}`}
              src={`/fortune-layers/${pose.image}.webp`}
              alt=""
            />
            <img ref={ballRef} className="fortune-scene-ball" src="/fortune-layers/crystal-ball.webp" alt="" />
            <img className="fortune-scene-curtains fortune-curtain-left" src="/fortune-layers/curtains.webp" alt="" />
            <img className="fortune-scene-curtains fortune-curtain-right" src="/fortune-layers/curtains.webp" alt="" />
            <img className="fortune-scene-side-rails" src="/fortune-layers/side-rails.webp" alt="" />
          </div>

          <div className="fortune-books" aria-hidden="true">
            <i><span>OMENS &amp; SNACKS</span></i>
            <i><span>GOOD GIRL MOON LORE</span></i>
            <i><span>CANINE ARCANA</span></i>
            <i><span>CHEESE &amp; DESTINY</span></i>
          </div>

          <div className={`stage-glow ${answer ? `tone-${answer.tone}` : ""}`} aria-hidden="true" />
          <div className="star-dust" aria-hidden="true">
            <i /><i /><i /><i /><i /><i />
          </div>

          {flipBurst > 0 && (
            <div className="flip-magic" aria-hidden="true" key={flipBurst}>
              <span className="turn-veil" />
              <span className="turn-lower-smoke" />
              <span className="turn-ball-haze" />
              <span className="turn-orbit turn-orbit-a" />
              <span className="turn-orbit turn-orbit-b" />
              <span className="smoke-wisp smoke-wisp-a" />
              <span className="smoke-wisp smoke-wisp-b" />
              <span className="smoke-wisp smoke-wisp-c" />
              <span className="smoke-wisp smoke-wisp-d" />
              <span className="smoke-wisp smoke-wisp-e" />
              <span className="smoke-wisp smoke-wisp-f" />
              <span className="smoke-wisp smoke-wisp-g" />
              <span className="smoke-wisp smoke-wisp-h" />
              <span className="smoke-wisp smoke-wisp-i" />
              <span className="smoke-wisp smoke-wisp-j" />
              <span className="flip-flash" />
              <span className="flip-sparkles">
                <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
              </span>
            </div>
          )}

          <div className={`crystal-chamber ${answer && !answerDismissed ? "oracle-expanded" : ""}`}>
            <CrystalEnergy consulting={consulting} answer={answer} revealStage={revealStage} />
            <FortuneLens
              consulting={consulting}
              answer={answer}
              revealStage={revealStage}
              answerDismissed={answerDismissed}
              onDismiss={onDismissAnswer}
            />
          </div>

          {flipBurst > 0 && turning && (
            <div className="turn-foreground-smoke" aria-hidden="true" key={`foreground-${flipBurst}`}>
              <span className="foreground-plume foreground-plume-a" />
              <span className="foreground-plume foreground-plume-b" />
              <span className="foreground-plume foreground-plume-c" />
              <span className="foreground-plume foreground-plume-d" />
              <span className="foreground-plume foreground-plume-e" />
              <span className="foreground-glitter">
                <i /><i /><i /><i /><i /><i /><i /><i />
              </span>
            </div>
          )}
          {flipBurst > 0 && (
            <div className="turn-gold-sparks" aria-hidden="true" key={`gilded-${flipBurst}`}>
              {Array.from({ length: 24 }, (_, index) => <i key={index} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
const CHEESES = [
  {
    id: "brie",
    name: "Brie",
    note: "Soft-ripened royalty",
    image: "/rosieverse/cheese/cards/brie.webp",
    objectPosition: "50% 52%"
  },
  {
    id: "swiss",
    name: "Swiss",
    note: "The hole truth",
    image: "/rosieverse/cheese/cards/swiss.webp",
    objectPosition: "50% 50%"
  },
  {
    id: "cheddar",
    name: "Cheddar",
    note: "Sharp and distinguished",
    image: "/rosieverse/cheese/cards/cheddar.webp",
    objectPosition: "52% 52%"
  },
  {
    id: "blue",
    name: "Blue",
    note: "Veined with greatness",
    image: "/rosieverse/cheese/cards/blue.webp",
    objectPosition: "50% 50%"
  },
  {
    id: "gouda",
    name: "Gouda",
    note: "Wheel of good decisions",
    image: "/rosieverse/cheese/cards/gouda.webp",
    objectPosition: "55% 48%"
  },
  {
    id: "parmesan",
    name: "Parmesan",
    note: "Aged with authority",
    image: "/rosieverse/cheese/cards/parmesan.webp",
    objectPosition: "54% 48%"
  },
  {
    id: "mozzarella",
    name: "Mozzarella",
    note: "Fresh little clouds",
    image: "/rosieverse/cheese/cards/mozzarella.webp",
    objectPosition: "48% 50%"
  },
  {
    id: "goat",
    name: "Goat Cheese",
    note: "Tangy academic excellence",
    image: "/rosieverse/cheese/cards/goat.webp",
    objectPosition: "50% 50%"
  }
];

function shuffleCheeseDeck() {
  const deck = CHEESES.flatMap((cheese) => [
    { ...cheese, cardId: cheese.id + "-a" },
    { ...cheese, cardId: cheese.id + "-b" }
  ]);

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = secureIndex(index + 1);
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

function CheesePhoto({ cheese }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="cheese-photo-fallback" role="img" aria-label={cheese.name}>
        🧀
      </span>
    );
  }

  return (
    <img
      src={cheese.image}
      alt={cheese.name}
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      style={{ objectPosition: cheese.objectPosition }}
      onError={() => setFailed(true)}
    />
  );
}

function formatGameTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes + ":" + String(remaining).padStart(2, "0");
}

const ROSIE_REACTIONS = {
  watching: { image: "/rosie-reaction-watching.webp", label: "WATCHING", alt: "Doctor Rosie watching attentively", icon: "◌" },
  intrigued: { image: "/rosie-reaction-intrigued.webp", label: "INTRIGUED", alt: "Doctor Rosie looking intrigued", icon: "?" },
  pleased: { image: "/rosie-reaction-pleased.webp", label: "PLEASED", alt: "Doctor Rosie looking pleased", icon: "✦" },
  concerned: { image: "/rosie-reaction-concerned.webp", label: "CONCERNED", alt: "Doctor Rosie looking concerned", icon: "!" },
  triumphant: { image: "/rosie-reaction-triumphant.webp", label: "TRIUMPHANT", alt: "Doctor Rosie celebrating triumphantly", icon: "✦" },
  amused: { image: "/rosie-reaction-amused.webp", label: "AMUSED", alt: "Doctor Rosie looking knowingly amused", icon: "♡" },
  focused: { image: "/rosie-reaction-focused.webp", label: "FOCUSED", alt: "Doctor Rosie thinking carefully", icon: "⌕" },
  unimpressed: { image: "/rosie-reaction-unimpressed.webp", label: "UNIMPRESSED", alt: "Doctor Rosie looking deeply unimpressed", icon: "!" },
  proud: { image: "/rosie-reaction-proud.webp", label: "PROUD", alt: "Doctor Rosie looking proud", icon: "✦" },
  elated: { image: "/rosie-reaction-elated.webp", label: "ELATED", alt: "Doctor Rosie delighted by the result", icon: "✦" }
};


function BarkbridgeSeal({ className = "" }) {
  return (
    <img
      className={className}
      src="/barkbridge-premium-cap.webp"
      alt=""
      aria-hidden="true"
    />
  );
}

function BarkbridgeCapEmblem() {
  return (
    <div className="barkbridge-cap-emblem" aria-hidden="true">
      <img src="/barkbridge-premium-seal.webp" alt="" width="640" height="640" decoding="async" />
    </div>
  );
}

function GraduateRosie() {
  return (
    <figure className="graduate-rosie" aria-label="Doctor Rosie celebrating graduation">
      <img
        src="/rosie-barkbridge-graduate.webp"
        alt="Rosie celebrating in her graduation cap"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />
      <figcaption>DOCTOR ROSIE, Che.D.</figcaption>
      <span className="graduate-spark graduate-spark-one" aria-hidden="true">✦</span>
      <span className="graduate-spark graduate-spark-two" aria-hidden="true">✧</span>
    </figure>
  );
}

function BarkbridgeDiploma({ recipient, awardDate }) {
  return (
    <article className="barkbridge-diploma" aria-label="University of Barkbridge Doctor of Cheese diploma">
      <span className="barkbridge-gold-gleam" aria-hidden="true"><i /><i /><i /></span>
      <div className="diploma-inner-border">
        <span className="diploma-photo-crest" aria-label="Academic crest featuring the Shiba Inu" role="img" />
        <h1>UNIVERSITY OF BARKBRIDGE</h1>
        <h2>FACULTY OF GASTRONOMIC SCIENCES</h2>
        <p className="diploma-intro">Upon recommendation of the Faculty hereby confers upon</p>
        <strong className="diploma-exam-name" style={{ "--recipient-font": `clamp(16px, ${Math.min(8.7, 170 / Math.max(12, recipient.length))}cqw, 68px)` }}>{recipient || "Cheez Whiz"}</strong>
        <p className="diploma-confers">the degree of</p>
        <h3>Doctor of Cheese (Che.D.)</h3>
        <p className="diploma-dissertation">“Fetch the Fromage: A Shiba Inu’s Paw-Validated Flavor Index for Mapping the Terroirs of Regional Curds”</p>
        <p className="diploma-date">{awardDate}</p>
        <div className="diploma-signatures">
          <div>
            <span>Prof. Manchego P. Curdwell</span>
            <small>Dissertation Supervisor</small>
          </div>
          <div className="diploma-wax-seal" aria-hidden="true">
            <svg viewBox="0 0 100 100" focusable="false" aria-hidden="true">
              <circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="50" cy="50" r="31" fill="none" stroke="currentColor" strokeWidth=".85" />
              <ellipse cx="50" cy="61" rx="17" ry="13" transform="rotate(-6 50 61)" fill="currentColor" />
              <ellipse cx="27" cy="39" rx="7" ry="10" transform="rotate(-20 27 39)" fill="currentColor" />
              <ellipse cx="42" cy="29" rx="7" ry="10" transform="rotate(-6 42 29)" fill="currentColor" />
              <ellipse cx="59" cy="29" rx="7" ry="10" transform="rotate(10 59 29)" fill="currentColor" />
              <ellipse cx="74" cy="42" rx="7" ry="10" transform="rotate(20 74 42)" fill="currentColor" />
            </svg>
          </div>
          <div>
            <span>Dr. Brie de Bloom</span>
            <small>Dean</small>
          </div>
        </div>
      </div>
    </article>
  );
}

function BarkbridgeGraduation({ moves, elapsed, onReplay }) {
  const diplomaDialogRef = useRef(null);
  const efficiency = moves ? Math.min(100, Math.round((CHEESES.length / moves) * 100)) : 100;
  // Doctor of Cheese honorifics, ranked from a perfect exam to a leisurely finish.
  // Each score requirement is 5% easier than before (ceil to whole-percent display).
  const defaultDiplomaName = efficiency >= Math.ceil(90 * 0.95) ? "The Grate Gatsby"
    : efficiency >= Math.ceil(75 * 0.95) ? "Sharp as Cheddar"
    : efficiency >= Math.ceil(60 * 0.95) ? "Cheez Whiz"
    : efficiency >= Math.ceil(45 * 0.95) ? "Provolone Ranger"
    : "Feta Late Than Never";
  const [graduateName, setGraduateName] = useState(() => {
    try {
      const saved = localStorage.getItem("barkbridgeGraduateName")?.trim() || "";
      // Names from older releases were automatic defaults, not player customizations.
      return !saved || saved.toLowerCase() === "the graduate"
        || ["The Grate Gatsby", "Sharp as Cheddar", "Cheez Whiz",
            "Provolone Ranger", "Feta Late Than Never",
            "Gouda Laude", "Brie-ly Passed"].includes(saved) ? "" : saved;
    } catch { return ""; }
  });
  const awardDate = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    []
  );
  const recipient = graduateName.trim() || defaultDiplomaName;
  function personalizeDiploma(value) {
    const next = value.slice(0, 42);
    setGraduateName(next);
    try {
      if (next.trim()) localStorage.setItem("barkbridgeGraduateName", next);
      else localStorage.removeItem("barkbridgeGraduateName");
    } catch {}
  }
  const confetti = Array.from({ length: 34 }, (_, index) => {
    const left = (index * 37 + 11) % 98;
    const delay = ((index * 17) % 16) / 100;
    const drift = ((index % 7) - 3) * 11;
    const turn = 160 + ((index * 53) % 420);
    return (
      <i
        key={index}
        style={{
          "--confetti-left": left + "%",
          "--confetti-delay": delay + "s",
          "--confetti-drift": drift + "px",
          "--confetti-turn": turn + "deg"
        }}
      />
    );
  });

  return (
    <section className="barkbridge-graduation" aria-live="polite">
      <div className="barkbridge-confetti" aria-hidden="true">{confetti}</div>
      <div className="graduation-stage">
        <div className="barkbridge-certificate-and-reward">
          <BarkbridgeDiploma recipient={recipient} awardDate={awardDate} />
          <figure className="barkbridge-cheese-reward barkbridge-cheese-reward-desktop" aria-label="Celebratory gourmet cheese platter">
            <span className="barkbridge-cheese-halo" aria-hidden="true" />
            <img src="/barkbridge/diploma/gourmet-cheese-platter-v2.png" alt="A golden platter of gourmet cheeses, fruit and honey" loading="eager" decoding="async" />
            <span className="barkbridge-cheese-sparkles" aria-hidden="true"><i /><i /><i /><i /></span>
          </figure>
        </div>
        <GraduateRosie />
        <figure className="barkbridge-cheese-reward barkbridge-cheese-reward-mobile" aria-label="Celebratory gourmet cheese platter">
          <span className="barkbridge-cheese-halo" aria-hidden="true" />
          <img src="/barkbridge/diploma/gourmet-cheese-platter-v2.png" alt="A golden platter of gourmet cheeses, fruit and honey" loading="eager" decoding="async" />
          <span className="barkbridge-cheese-sparkles" aria-hidden="true"><i /><i /><i /><i /></span>
        </figure>
      </div>

      <div className="diploma-aftercare">
        <div className="barkbridge-side-celebration" aria-hidden="true">
          <GraduateRosie />
          <figure className="barkbridge-cheese-reward barkbridge-side-tray">
            <img src="/barkbridge/diploma/gourmet-cheese-platter-v2.png" alt="" loading="eager" decoding="async" />
          </figure>
        </div>
        <div className="diploma-results-strip" aria-label="Examination results">
          <span className="diploma-results-heading">EXAMINATION RESULTS</span>
          <div className="diploma-stats">
            <div><span>MOVES</span><strong>{moves}</strong></div>
            <div><span>TIME</span><strong>{formatGameTime(elapsed)}</strong></div>
            <div><span>MATCH EFFICIENCY</span><strong>{efficiency}%</strong></div>
          </div>
        </div>

        <label className="diploma-recipient-editor">
          <span>NAME ON DIPLOMA</span>
          <input
            className="diploma-recipient-input"
            type="text"
            autoComplete="name"
            maxLength={42}
            aria-label="Name on diploma"
            placeholder="Enter the graduate's name"
            value={graduateName || defaultDiplomaName}
            onFocus={(event) => { if (!graduateName) event.target.select(); }}
            onChange={(event) => personalizeDiploma(event.target.value)}
          />
          <small>Your name appears on both the diploma and its enlarged view.</small>
        </label>
        <button type="button" className="diploma-enlarge-button" onClick={() => diplomaDialogRef.current?.showModal()}>
          <span aria-hidden="true">↗</span> View diploma at full size
        </button>

      </div>

      <dialog ref={diplomaDialogRef} className="barkbridge-zoom-dialog" aria-label="Enlarged University of Barkbridge diploma">
        <div className="barkbridge-zoom-toolbar">
          <span>UNIVERSITY OF BARKBRIDGE · OFFICIAL DIPLOMA</span>
          <button type="button" onClick={() => diplomaDialogRef.current?.close()}>Close ×</button>
        </div>
        <div className="barkbridge-zoom-scroll" tabIndex={0}>
          <BarkbridgeDiploma recipient={recipient} awardDate={awardDate} />
        </div>
      </dialog>

      <button type="button" className="barkbridge-replay" onClick={onReplay}>
        <span aria-hidden="true">↻</span> EXAMINE AGAIN
      </button>
    </section>
  );
}

// Allow each cheese to turn visibly before scoring, without making players wait.
const CHEESE_MATCH_REVEAL_MS = 360;
const CHEESE_MISS_REVEAL_MS = 760;
const CHEESE_GRADUATION_PAUSE_MS = 400;

function CheeseMemoryGame({ requestGameFullscreen } = {}) {
  const [deck, setDeck] = useState(() => shuffleCheeseDeck());
  const [openCards, setOpenCards] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState("Doctor Rosie is ready. Show her what you remember.");
  const [rosieMood, setRosieMood] = useState("watching");
  const [totalMisses, setTotalMisses] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [previousResolvedResult, setPreviousResolvedResult] = useState(null);
  const [reactionHistory, setReactionHistory] = useState(["watching"]);
  const [ceremonyVisible, setCeremonyVisible] = useState(false);
  const [gameMode, setGameMode] = useState("classic");
  const [challengePhase, setChallengePhase] = useState("ready");
  const [previewSeconds, setPreviewSeconds] = useState(3);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const previewDeadlineRef = useRef(0);
  const challengeDeadlineRef = useRef(0);
  const challengeStartedRef = useRef(0);
  const challengeFinishingRef = useRef(false);
  const pendingFlipRef = useRef(null);
  const graduationTimerRef = useRef(null);
  const testWinTapsRef = useRef(0);
  const gridRef = useRef(null);
  const examinerRef = useRef(null);
  const [boardFocusRequest, setBoardFocusRequest] = useState(0);
  const boardFocusTimersRef = useRef([]);

  const complete = matched.length === CHEESES.length;
  const graduationMusicRef = useRef(false);
  useEffect(() => {
    if(!ceremonyVisible){graduationMusicRef.current=false;return;}
    if(!graduationMusicRef.current){
      graduationMusicRef.current=true;
      window.dispatchEvent(new CustomEvent("rosieverse:music:achievement",{detail:{kind:"cheese-graduation"}}));
    }
  },[ceremonyVisible]);
  const hasBegun = started || (gameMode === "sprint" && challengePhase !== "ready");
  const currentReaction = ROSIE_REACTIONS[rosieMood];
  // Accuracy is based on resolved two-card attempts, not an unresolved flip.
  const resolvedAttempts = matched.length + totalMisses;
  const accuracyPercentage = resolvedAttempts ? Math.round((matched.length / resolvedAttempts) * 100) : null;

  useEffect(() => {
    if (gameMode !== "classic" || !started || complete) return undefined;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [gameMode, started, complete]);

  // The study phase is an actual, noninteractive reveal. Wall-clock deadlines
  // prevent background-tab throttling from gifting extra study or play time.
  useEffect(() => {
    if (gameMode !== "sprint" || challengePhase !== "preview") return undefined;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setPreviewSeconds(secondsUntilDeadline(previewDeadlineRef.current, now));
      if (now < previewDeadlineRef.current) return;
      window.clearInterval(timer);
      challengeStartedRef.current = now;
      challengeDeadlineRef.current = now + CHEESE_SPRINT_MS;
      setSecondsRemaining(30);
      setElapsed(0);
      setChallengePhase("playing");
      applyReaction("watching", "The board is hidden. Thirty seconds to earn your degree.");
    }, 50);
    return () => window.clearInterval(timer);
  }, [gameMode, challengePhase]);

  // The sprint clock is independent of card-flip animation and stops on a
  // completed last pair, rather than penalizing the 360ms reveal animation.
  useEffect(() => {
    if (gameMode !== "sprint" || challengePhase !== "playing") return undefined;
    const tick = () => {
      if (challengeFinishingRef.current) return;
      const now = Date.now();
      setSecondsRemaining(secondsUntilDeadline(challengeDeadlineRef.current, now));
      setElapsed(Math.min(30, Math.floor((now - challengeStartedRef.current) / 1000)));
      if (!beforeDeadline(challengeDeadlineRef.current, now)) expireChallenge();
    };
    const timer = window.setInterval(tick, 80);
    tick();
    return () => window.clearInterval(timer);
  }, [gameMode, challengePhase]);

  useEffect(() => () => {
    window.clearTimeout(pendingFlipRef.current);
    window.clearTimeout(graduationTimerRef.current);
    boardFocusTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    boardFocusTimersRef.current = [];
    previewDeadlineRef.current = 0;
    challengeDeadlineRef.current = 0;
  }, []);

  // Completing the board replaces a tall scrolled layout. Reset both document
  // scrollers so the ceremony begins centered at the top on iPhone Safari.
  useEffect(() => {
    if (!ceremonyVisible) return undefined;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [ceremonyVisible]);

  // Align to the live height of Doctor Rosie and the raised navigation.
  // A direct post-click call is needed on iOS WebKit: moving a focused mode
  // button can otherwise restore the old scroll offset after layout effects.
  function alignBoardForPhone() {
    const board = gridRef.current;
    const examiner = examinerRef.current;
    if (!board || !examiner || window.innerWidth > 720) return;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const nav = document.querySelector(".bottom-nav");
    const navTop = nav ? nav.getBoundingClientRect().top : viewportHeight - 90;
    const examinerHeight = examiner.getBoundingClientRect().height;
    const stickyOffset = Math.max(6, parseFloat(window.getComputedStyle(examiner).top) || 6);
    const boardTop = stickyOffset + examinerHeight + 10;
    const availableHeight = Math.max(140, Math.floor(navTop - boardTop - 12));
    board.style.setProperty("--flash-board-cap", `${availableHeight}px`);
    board.style.scrollMarginTop = `${boardTop}px`;
    board.scrollIntoView({ block: "start", behavior: "auto" });
    const offset = window.scrollY + board.getBoundingClientRect().top - boardTop;
    window.scrollTo({ top: Math.max(0, offset), behavior: "auto" });
  }

  function scheduleBoardFocus() {
    boardFocusTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    setBoardFocusRequest((request) => request + 1);
    boardFocusTimersRef.current = [
      window.setTimeout(alignBoardForPhone, 70),
      window.setTimeout(alignBoardForPhone, 180),
      window.setTimeout(alignBoardForPhone, 330)
    ];
  }

  useLayoutEffect(() => {
    if (!boardFocusRequest) return undefined;
    const frame = window.requestAnimationFrame(alignBoardForPhone);
    const handleResize = () => window.requestAnimationFrame(alignBoardForPhone);
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [boardFocusRequest, gameMode, challengePhase]);

  function recentlyUsed(reaction) {
    return reactionHistory.slice(-2).includes(reaction);
  }

  function hasUsed(reaction) {
    return reactionHistory.includes(reaction);
  }

  function leastRecentlyUsed(candidates) {
    const unique = [...new Set(candidates)];
    const last = reactionHistory[reactionHistory.length - 1];
    const pool = unique.length > 1 ? unique.filter((item) => item !== last) : unique;
    const ranked = (pool.length ? pool : unique).map((item) => ({
      item,
      index: reactionHistory.lastIndexOf(item)
    }));
    ranked.sort((a, b) => a.index - b.index);
    return ranked[0]?.item || unique[0] || "watching";
  }

  function applyReaction(reaction, copy) {
    setRosieMood(reaction);
    setMessage(copy);
    setReactionHistory((history) => {
      if (history[history.length - 1] === reaction) return history;
      return [...history, reaction].slice(-24);
    });
  }

  function reactionCopy(reaction) {
    return {
      watching: "Doctor Rosie is ready. Show her what you remember.",
      intrigued: "Not a match. Rosie files that away for later.",
      concerned: "Another miss. The examiner is beginning to question the methodology.",
      focused: "Rosie is reviewing the evidence very carefully.",
      unimpressed: "This is now being entered into the permanent academic record.",
      pleased: "Correct. Rosie gives one small, serious nod.",
      amused: "A recovery. Rosie will graciously overlook the earlier lapse.",
      proud: "Now we're getting somewhere. The faculty is taking notice.",
      triumphant: "Excellent. Rosie believes the examination is essentially decided.",
      elated: "Examination passed. Doctor Rosie is absolutely delighted."
    }[reaction];
  }

  function selectBoardMode(mode) {
    resetGame(mode);
    scheduleBoardFocus();
  }

  function startOrResetSelectedBoard() {
    // Mitchell's rule (2026-11-25): every game goes fullscreen when played.
    requestGameFullscreen?.();
    if (gameMode === "sprint") {
      startSprint();
      return;
    }
    // A Classic examination must actually start before any card is playable.
    // A conspicuous change in Rosie's field notes confirms the button worked.
    resetGame("classic");
    setStarted(true);
    applyReaction("intrigued", "The exam is underway! Match eight pairs to impress Doctor Rosie.");
    scheduleBoardFocus();
  }

  function resetGame(requestedMode) {
    const nextMode = typeof requestedMode === "string" ? requestedMode : gameMode;
    window.clearTimeout(pendingFlipRef.current);
    window.clearTimeout(graduationTimerRef.current);
    pendingFlipRef.current = null;
    graduationTimerRef.current = null;
    previewDeadlineRef.current = 0;
    challengeDeadlineRef.current = 0;
    challengeStartedRef.current = 0;
    challengeFinishingRef.current = false;
    setGameMode(nextMode);
    setChallengePhase("ready");
    setPreviewSeconds(3);
    setSecondsRemaining(30);
    setDeck(shuffleCheeseDeck());
    setOpenCards([]);
    setMatched([]);
    setMoves(0);
    setElapsed(0);
    setStarted(false);
    setLocked(false);
    setTotalMisses(0);
    setConsecutiveMisses(0);
    setPreviousResolvedResult(null);
    setReactionHistory(["watching"]);
    setCeremonyVisible(false);
    setRosieMood("watching");
    setMessage("Doctor Rosie is ready. Show her what you remember.");
    testWinTapsRef.current = 0;
  }

  function startSprint() {
    // An explicit start gives the player time to be ready before memorization.
    resetGame("sprint");
    previewDeadlineRef.current = Date.now() + CHEESE_PREVIEW_MS;
    setChallengePhase("preview");
    applyReaction("focused", "Study the entire board. You have three seconds.");
    scheduleBoardFocus();
  }

  function expireChallenge() {
    if (challengeFinishingRef.current || !challengeDeadlineRef.current) return;
    challengeDeadlineRef.current = 0;
    window.clearTimeout(pendingFlipRef.current);
    window.clearTimeout(graduationTimerRef.current);
    pendingFlipRef.current = null;
    setOpenCards([]);
    setLocked(true);
    setSecondsRemaining(0);
    setElapsed(30);
    setChallengePhase("expired");
    applyReaction("unimpressed", "Time! Doctor Rosie recommends more focused cheese scholarship.");
  }

  function chooseMatchReaction(progress, finishing) {
    if (finishing) return "elated";
    if (progress >= 0.70 && !hasUsed("triumphant")) return "triumphant";
    if (progress >= 0.40 && !hasUsed("proud")) return "proud";
    if (previousResolvedResult === "miss" && hasUsed("pleased") && !recentlyUsed("amused")) return "amused";
    if (!hasUsed("pleased")) return "pleased";

    const candidates = ["pleased", "amused"];
    if (progress >= 0.35) candidates.push("proud");
    if (progress >= 0.65) candidates.push("triumphant");
    return leastRecentlyUsed(candidates);
  }

  function chooseMissReaction(nextTotalMisses, nextConsecutiveMisses, completedMove) {
    const progress = matched.length / CHEESES.length;
    if (nextTotalMisses === 1) return "intrigued";
    if (nextConsecutiveMisses === 2) return "concerned";
    if (nextTotalMisses >= 3 && completedMove <= 6 && !recentlyUsed("focused")) return "focused";
    if (nextTotalMisses >= 5 && progress < 0.75 && !recentlyUsed("unimpressed")) return "unimpressed";

    const candidates = ["intrigued", "concerned", "focused"];
    if (nextTotalMisses >= 4 && progress < 0.85) candidates.push("unimpressed");
    return leastRecentlyUsed(candidates);
  }

  function chooseCard(index) {
    // The first card tap starts Classic and reveals that very card.
    if (gameMode === "classic" && !started) {
      setStarted(true);
      applyReaction("intrigued", "The exam is underway! Match eight pairs to impress Doctor Rosie.");
      scheduleBoardFocus();
    }
    // Preview cards cannot be selected; the clock always begins after the reveal.
    if (gameMode === "sprint") {
      if (challengePhase !== "playing") return;
      if (!beforeDeadline(challengeDeadlineRef.current)) {
        expireChallenge();
        return;
      }
    }
    // Preserve the legacy ceremony preview shortcut in standard mode only.
    if (gameMode === "classic" && index === deck.length - 2) {
      testWinTapsRef.current += 1;
      if (testWinTapsRef.current >= 5) {
        window.clearTimeout(pendingFlipRef.current);
        setStarted(true);
        setLocked(true);
        setOpenCards([]);
        setMatched(CHEESES.map((cheese) => cheese.id));
        setMoves((value) => Math.max(value, CHEESES.length));
        setConsecutiveMisses(0);
        setPreviousResolvedResult("match");
        applyReaction("elated", "Testing complete. Doctor Rosie has awarded full distinction.");
        window.navigator.vibrate?.([18, 24, 18, 24, 36]);
        window.clearTimeout(graduationTimerRef.current);
        graduationTimerRef.current = window.setTimeout(() => setCeremonyVisible(true), 180);
        testWinTapsRef.current = 0;
        return;
      }
    } else {
      testWinTapsRef.current = 0;
    }
    if (locked || complete || openCards.includes(index) || matched.includes(deck[index].id)) return;
    if (!started) setStarted(true);

    if (openCards.length === 0) {
      // First-card flips never change Rosie's resolved reaction.
      setOpenCards([index]);
      return;
    }

    const firstIndex = openCards[0];
    const nextOpen = [firstIndex, index];
    setOpenCards(nextOpen);
    setMoves((value) => value + 1);
    setLocked(true);

    const first = deck[firstIndex];
    const second = deck[index];

    if (first.id === second.id) {
      // A correctly selected final pair before the deadline wins immediately,
      // although its card animation and diploma transition still finish.
      if (gameMode === "sprint" && matched.length + 1 === CHEESES.length) {
        challengeFinishingRef.current = true;
        setChallengePhase("won");
        setSecondsRemaining(secondsUntilDeadline(challengeDeadlineRef.current));
        setElapsed(Math.min(30, Math.ceil((Date.now() - challengeStartedRef.current) / 1000)));
      }
      pendingFlipRef.current = window.setTimeout(() => {
        const nextPairsFound = matched.length + 1;
        const progress = nextPairsFound / CHEESES.length;
        const finishing = nextPairsFound === CHEESES.length;
        const nextReaction = chooseMatchReaction(progress, finishing);

        setMatched((items) => [...items, first.id]);
        setOpenCards([]);
        setLocked(false);
        setConsecutiveMisses(0);
        setPreviousResolvedResult("match");
        applyReaction(nextReaction, reactionCopy(nextReaction));
        window.navigator.vibrate?.([18, 26, 18]);

        if (finishing) {
          window.clearTimeout(graduationTimerRef.current);
          graduationTimerRef.current = window.setTimeout(() => setCeremonyVisible(true), CHEESE_GRADUATION_PAUSE_MS);
        }
      }, CHEESE_MATCH_REVEAL_MS);
    } else {
      pendingFlipRef.current = window.setTimeout(() => {
        const nextTotalMisses = totalMisses + 1;
        const nextConsecutiveMisses = consecutiveMisses + 1;
        const completedMove = moves + 1;
        const nextReaction = chooseMissReaction(nextTotalMisses, nextConsecutiveMisses, completedMove);

        setOpenCards([]);
        setLocked(false);
        setTotalMisses(nextTotalMisses);
        setConsecutiveMisses(nextConsecutiveMisses);
        setPreviousResolvedResult("miss");
        applyReaction(nextReaction, reactionCopy(nextReaction));
      }, CHEESE_MISS_REVEAL_MS);
    }
  }

  if (ceremonyVisible) {
    return (
      <main className="cheese-game-page cheese-graduation-page">
        <BarkbridgeGraduation moves={moves} elapsed={elapsed} onReplay={resetGame} />
      </main>
    );
  }

  return (
    <main className={"cheese-game-page" + (gameMode === "sprint" ? " is-flash-fromage" : "") + (boardFocusRequest ? " is-board-active" : "")}>
      <section className="cheese-desktop-layout">
        <aside className="cheese-left-rail">
          <section className="cheese-exam-header" aria-labelledby="cheese-exam-title">
            <div className="barkbridge-ident">
              <BarkbridgeSeal className="barkbridge-ident-seal" />
              <div>
                <strong>UNIVERSITY OF BARKBRIDGE</strong>
                <small>FACULTY OF GASTRONOMIC SCIENCES</small>
              </div>
            </div>

            <div className="cheese-exam-portrait">
              <picture>
                <source media="(min-width: 721px)" srcSet="/barkbridge-cheese-exam-still-life-20261113.webp" />
                <img src="/rosie-doctor-cheese-hero.webp" alt="Cheese examination still life on desktop; Doctor Rosie on mobile" />
              </picture>
              <span>DOCTOR ROSIE · EXAMINER</span>
            </div>

            <div className="cheese-exam-title">
              <BarkbridgeCapEmblem />
              <div className="cheese-eyebrow">PRACTICAL BOARD EXAMINATION</div>
              <h1 id="cheese-exam-title">ROSIE'S CHEESE BOARD EXAM</h1>
              <p>A memory examination for serious cheese scholars.</p>

              <div className="cheese-exam-actions" role="group" aria-label="Cheese exam controls">
                <button type="button" aria-pressed={gameMode === "classic"} className={gameMode === "classic" ? "is-selected" : ""} onClick={(event) => { event.currentTarget.blur(); selectBoardMode("classic"); }}>CLASSIC EXAM</button>
                <button type="button" aria-pressed={gameMode === "sprint"} className={gameMode === "sprint" ? "is-selected" : ""} onClick={(event) => { event.currentTarget.blur(); selectBoardMode("sprint"); }}>FLASH FROMAGE</button>
                <button type="button" className={"cheese-action-reset" + (!hasBegun ? " is-ready" : "")} onClick={(event) => { event.currentTarget.blur(); startOrResetSelectedBoard(); }}>
                  <svg className="cheese-action-symbol" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    {hasBegun
                      ? <path d="M20.4 6.8V2.9l-2.2 2.2A9 9 0 1 0 21 12h-2.3a6.7 6.7 0 1 1-2-4.8l-2.7 2.7h6.4V6.8z" />
                      : <path d="M8.1 4.5c0-.9 1-1.4 1.7-.9l10 7.4a1.2 1.2 0 0 1 0 2l-10 7.4c-.7.5-1.7 0-1.7-.9v-15z" />}
                  </svg>
                  <span>{hasBegun ? "RESET" : "START"}</span>
                </button>
              </div>

              <div className="cheese-header-status" aria-label="Current exam status">
                <div><span>PAIRS</span><strong>{matched.length}/{CHEESES.length}</strong></div>
                <div><span>MOVES</span><strong>{moves}</strong></div>
                <div><span>{gameMode === "sprint" ? "LEFT" : "TIME"}</span><strong>{gameMode === "sprint" ? `0:${String(secondsRemaining).padStart(2, "0")}` : formatGameTime(elapsed)}</strong></div>
                <div title="Matched pairs divided by completed attempts"><span>ACCURACY</span><strong>{accuracyPercentage === null ? "—" : `${accuracyPercentage}%`}</strong></div>
              </div>
            </div>

          </section>
        </aside>

        <section className="cheese-game-frame" aria-label="Cheese matching board">
          <div className="cheese-game-heading">
            <div>
              <span>{gameMode === "sprint" ? "FLASH FROMAGE · MEMORY CHALLENGE" : "BOARD ONE · PRACTICAL MEMORY"}</span>
              <h2>{gameMode === "sprint" ? "Flash Fromage" : "Pair the Fromage"}</h2>
            </div>
            <p>{gameMode === "sprint" ? "Study all sixteen cards for 3 seconds. Then match eight pairs within 30 seconds." : "Eight cheeses. Sixteen cards. Doctor Rosie is recording the results."}</p>
          </div>
          <div className="cheese-grid" ref={gridRef}>
            {deck.map((cheese, index) => {
              const faceUp = (gameMode === "sprint" && challengePhase === "preview") || openCards.includes(index) || matched.includes(cheese.id);
              const isMatched = matched.includes(cheese.id);
              return (
                <button
                  type="button"
                  className={"cheese-card" + (faceUp ? " is-flipped" : "") + (isMatched ? " is-matched" : "")}
                  key={cheese.cardId}
                  onClick={() => chooseCard(index)}
                  disabled={gameMode === "sprint" && challengePhase !== "playing"}
                  aria-label={faceUp ? cheese.name : "Face-down cheese card"}
                >
                  <span className="cheese-card-inner">
                    <span className="cheese-card-back cheese-card-back-approved">
                      <img
                        className="cheese-card-back-art"
                        src="/cheese-card-back-approved.webp"
                        alt=""
                        aria-hidden="true"
                      />
                    </span>
                    <span className="cheese-card-front">
                      <span className="cheese-art"><CheesePhoto cheese={cheese} /></span>
                      <span className="cheese-card-ribbon" aria-hidden="true">FROMAGE {String((index % 8) + 1).padStart(2, "0")}</span>
                      <strong>{cheese.name}</strong>
                      <small>{cheese.note}</small>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="cheese-examiner-rail" ref={examinerRef} aria-label="Doctor Rosie's live reaction">
          <div className={"rosie-reaction mood-" + rosieMood} aria-live="polite">
            <div className="reaction-effects" aria-hidden="true"><b /><b /><b /><b /><b /></div>
            <div className="rosie-reaction-portrait">
              <img
                key={rosieMood}
                src={currentReaction.image}
                alt={currentReaction.alt}
              />
            </div>
            <div className="reaction-copy">
              <span className="reaction-status-pill">
                {gameMode === "sprint"
                  ? challengePhase === "preview" ? "STUDYING"
                    : challengePhase === "expired" ? "TIME"
                      : challengePhase === "won" ? "COMPLETE" : "FLASH FROMAGE"
                  : currentReaction.label}
              </span>
              <strong>{message}</strong>
              <span className="reaction-subcopy">
                {gameMode !== "sprint" ? "DOCTOR ROSIE'S FIELD NOTES"
                  : challengePhase === "ready" ? "Three seconds to study. Thirty seconds to finish."
                    : challengePhase === "preview" ? "Memorize every cheese."
                      : challengePhase === "playing" ? "Match all eight pairs before time expires."
                        : challengePhase === "expired" ? `${matched.length} of eight pairs. Rosie permits another attempt.`
                          : "Rosie is preparing your diploma."}
              </span>
              {(!hasBegun || (gameMode === "sprint" && challengePhase === "expired")) && (
                <button type="button" className="reaction-start-button" onClick={startOrResetSelectedBoard}>
                  {gameMode === "sprint"
                    ? challengePhase === "expired" ? "TRY FLASH FROMAGE AGAIN" : "START FLASH FROMAGE"
                    : "START CLASSIC EXAM"}
                </button>
              )}
              {gameMode === "sprint" && (challengePhase === "preview" || challengePhase === "playing") && (
                <output className="reaction-timer" aria-label={challengePhase === "preview" ? "Study seconds remaining" : "Challenge seconds remaining"}>
                  {challengePhase === "preview" ? previewSeconds : `0:${String(secondsRemaining).padStart(2, "0")}`}
                </output>
              )}
            </div>
            <i aria-hidden="true">{currentReaction.icon}</i>
          </div>
        </aside>
      </section>
    </main>
  );
}

const CAPTAIN_PICKUPS = [
  { kind: "ball", icon: "🎾", label: "Tennis ball", points: 10, turbo: 6 },
  { kind: "treat", icon: "🦴", label: "Captain's treat", points: 20, turbo: 9 },
  { kind: "cheese", icon: "", label: "Golden Cheese", points: 40, turbo: 15 },
  { kind: "buoy", icon: "◆", label: "Navigation buoy", points: 0, turbo: 0 }
];

const CAPTAIN_PHASES = {
  harbor: {
    eyebrow: "DEPARTING PORT ROSIE",
    name: "Golden Harbor",
    copy: "Warm water, easy traffic. Find your sea legs."
  },
  riviera: {
    eyebrow: "THE RIVIERA RUN",
    name: "Azure Passage",
    copy: "The lanes tighten and the cargo comes faster."
  },
  sunset: {
    eyebrow: "FINAL APPROACH",
    name: "Sunset Sprint",
    copy: "Last light. Full concentration. Bring her home."
  }
};

function captainRank(score) {
  if (score >= 1500) return { title: "Admiral of Treats", mark: "S", copy: "A voyage worthy of the House of Rosie." };
  if (score >= 1080) return { title: "Commodore", mark: "A", copy: "Impeccable yachtcraft. Rosie is visibly impressed." };
  if (score >= 720) return { title: "First Officer", mark: "B", copy: "A highly respectable command performance." };
  if (score >= 420) return { title: "Able Seadog", mark: "C", copy: "Solid seamanship. More treats would help." };
  return { title: "Junior Deckhand", mark: "D", copy: "Rosie has scheduled remedial yacht time." };
}

function RosiePawCrest({ className = "" }) {
  return (
    <svg className={"rosie-paw-crest " + className} viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="10" cy="13" r="5" />
      <circle cx="22" cy="8.5" r="5" />
      <circle cx="34" cy="13" r="5" />
      <path d="M9.5 29.5C9.5 21.8 15.1 17 22 17s12.5 4.8 12.5 12.5c0 5.6-4.4 8-12.5 8s-12.5-2.4-12.5-8Z" />
    </svg>
  );
}

function GoldenCheeseIcon({ compact = false }) {
  return (
    <span className={"golden-cheese-icon" + (compact ? " is-compact" : "")} aria-hidden="true">
      <span className="golden-cheese-wedge"><i /><i /><i /></span>
    </span>
  );
}

function YachtGoldenCheeseIcon() {
  return <img className="yacht-golden-cheese-art" src="/yacht-dash/pickups/sakura-golden-cheese.png"
    alt="" aria-hidden="true" draggable="false" />;
}

function CaptainPickupIcon({ kind }) {
  const images = {
    ball: "/captain-pickup-tennis.webp",
    treat: "/captain-pickup-bone.webp",
    buoy: "/captain-pickup-buoy.webp"
  };
  return <img className={"pickup-art pickup-art-" + kind}
    src={images[kind] || images.ball}
    alt="" aria-hidden="true" draggable="false" />;
}

function YachtHazardArt({ item }) {
  const source = item.kind === "rival" ? yachtRivalSpriteFor(item)
    : item.asset || "/yacht-dash/obstacles/storm-buoy.webp";
  return <img
    className="pickup-art yacht-hazard-art" src={source}
    alt="" aria-hidden="true" draggable="false" decoding="async"
    onError={(event) => {
      // Preserve the obstacle's silhouette and footprint if an asset fails
      // to decode instead of showing an invisible horizontal remnant.
      const img = event.currentTarget;
      img.onerror = null;
      img.src = item.footprint === "arch" ? "/yacht-dash/kuroi/torii-passage.webp"
        : item.footprint === "wide" ? "/yacht-dash/obstacles/reef-rocks.webp"
        : item.kind === "rival" ? "/yacht-dash/kuroi/kuroi-charge.webp"
        : item.kind === "supply" ? "/yacht-dash/obstacles/cargo-crate.webp"
        : "/yacht-dash/obstacles/storm-buoy.webp";
    }} />;
}

function CaptainRosieIllustration({ className = "" }) {
  return (
    <img
      className={"captain-rosie-illustration " + className}
      src="/captain-rosie-illustrated.webp"
      alt="Stylized Captain Rosie"
      draggable="false"
    />
  );
}

function RivieraCourseArt() {
  return (
    <svg className="riviera-course-art japanese-course-art" viewBox="0 0 1000 760" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="jpSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--jp-sky-top)" />
          <stop offset=".58" stopColor="var(--jp-sky-mid)" />
          <stop offset="1" stopColor="var(--jp-sky-horizon)" />
        </linearGradient>
        <linearGradient id="jpSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--jp-sea-top)" />
          <stop offset=".47" stopColor="var(--jp-sea-mid)" />
          <stop offset="1" stopColor="var(--jp-sea-bottom)" />
        </linearGradient>
        <linearGradient id="jpCliff" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--jp-cliff-lit)" />
          <stop offset=".52" stopColor="var(--jp-cliff-mid)" />
          <stop offset="1" stopColor="var(--jp-cliff-dark)" />
        </linearGradient>
        <linearGradient id="jpPine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--jp-pine-lit)" />
          <stop offset="1" stopColor="var(--jp-pine-dark)" />
        </linearGradient>
        <radialGradient id="jpSunGlow">
          <stop offset="0" stopColor="var(--jp-sun-glow)" stopOpacity=".9" />
          <stop offset=".36" stopColor="var(--jp-sun-glow)" stopOpacity=".34" />
          <stop offset="1" stopColor="var(--jp-sun-glow)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="jpGoldReflection" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--jp-reflection)" stopOpacity=".35" />
          <stop offset="1" stopColor="var(--jp-reflection)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1000" height="330" fill="url(#jpSky)" />
      <g className="japan-sun">
        <circle cx="782" cy="116" r="128" fill="url(#jpSunGlow)" />
        <circle className="japan-sun-disc" cx="782" cy="116" r="34" fill="var(--jp-sun)" />
      </g>

      <g className="japan-clouds" fill="none" stroke="var(--jp-cloud)" strokeLinecap="round">
        <path d="M52 107c45-23 92-23 142 0 29 13 64 13 105 0" strokeWidth="12" strokeOpacity=".22" />
        <path d="M82 92c30-17 64-18 102-2 17 7 35 9 55 6" strokeWidth="5" strokeOpacity=".46" />
        <path d="M544 82c30-18 61-19 93-3 29 15 63 16 101 4" strokeWidth="8" strokeOpacity=".26" />
        <path d="M706 194c42-20 83-18 122 6 25 15 55 17 91 6" strokeWidth="6" strokeOpacity=".28" />
        <path d="M368 150c18-10 40-11 66-2 19 7 40 7 62 0" strokeWidth="4" strokeOpacity=".2" />
      </g>

      <g className="japan-far-mountains">
        <path d="M-30 296C70 244 135 236 207 259c52-62 112-90 180-68 39-55 87-75 143-56 58 20 95 69 145 87 76-55 154-49 224 17 54-21 98-20 131-2v91H-30Z" fill="var(--jp-mountain-far)" opacity=".5" />
        <path d="M-20 312c83-48 157-54 225-18 69-39 137-43 205-9 52-47 112-53 181-16 76-40 153-35 230 15 68-31 131-27 199 12v39H-20Z" fill="var(--jp-mountain-far-2)" opacity=".55" />
      </g>

      <g className="japan-mid-mountains">
        <path d="M-25 321c84-42 157-48 220-17 49-33 94-40 137-22 48 20 71 61 111 75H-25Z" fill="var(--jp-mountain-mid)" opacity=".88" />
        <path d="M1000 311c-92-37-166-36-223 4-35-26-72-30-111-12-43 20-72 57-110 72h444Z" fill="var(--jp-mountain-mid-2)" opacity=".9" />
        <path d="M302 318c52-28 95-31 131-10 38-26 81-29 129-8 27 12 53 31 77 57H247c18-18 36-31 55-39Z" fill="var(--jp-mountain-mid-soft)" opacity=".5" />
      </g>

      <path className="japan-horizon-mist" d="M0 304c176-18 331-10 465 8 158 21 335 17 535-14v58H0Z" fill="var(--jp-haze)" opacity=".54" />

      <rect y="315" width="1000" height="445" fill="url(#jpSea)" />
      <path d="M0 319c165 8 321 4 467-10 178-17 356-15 533 6" fill="none" stroke="var(--jp-horizon-line)" strokeWidth="4" strokeOpacity=".62" />

      <g className="japan-sun-reflection" opacity=".75">
        <path d="M716 316c38 67 62 145 72 235 6 60 4 125-8 196H639c44-97 62-186 55-267-5-58 2-113 22-164Z" fill="url(#jpGoldReflection)" />
        <path d="M708 354c31 12 58 13 83 3M691 418c39 15 76 16 110 2M673 501c50 17 96 16 137-3M651 594c62 18 117 17 165-5" fill="none" stroke="var(--jp-reflection)" strokeWidth="8" strokeLinecap="round" strokeOpacity=".18" />
      </g>

      <g className="japan-near-coast japan-near-coast-left">
        <path d="M0 314c88 8 150 35 205 84 38 34 78 58 132 75-21 51-50 93-91 128-85-18-168-29-246-20Z" fill="url(#jpCliff)" />
        <path d="M0 306c81 4 150 29 213 76 27 20 52 34 76 43-63-11-119-6-170 17-41-25-81-40-119-45Z" fill="url(#jpPine)" />
        <path d="M0 485c73-7 142 4 207 34 28 13 54 30 77 49-37 35-71 69-102 103-68-19-129-26-182-20Z" fill="var(--jp-rock-shadow)" opacity=".72" />
        <g className="japan-pines" stroke="var(--jp-pine-trunk)" strokeWidth="6" strokeLinecap="round">
          <path d="M86 383c4-46 13-81 28-107m-28 107c-26-24-47-32-64-25m65 22c21-31 46-45 74-42m-67 18c-4-30-1-55 11-75" fill="none" />
          <path d="M180 407c3-36 11-65 24-88m-22 86c-20-17-37-23-52-18m52 17c18-23 37-34 59-31" fill="none" strokeWidth="5" />
        </g>
        <g className="japan-coast-house" transform="translate(39 352)">
          <path d="M0 36h83v46H0Z" fill="var(--jp-house)" stroke="var(--jp-house-line)" strokeWidth="2" />
          <path d="M-9 38 42 6l51 32Z" fill="var(--jp-roof)" stroke="var(--jp-house-line)" strokeWidth="2" />
          <path d="M17 50h17v17H17Zm50 0h-17v17h17Z" fill="var(--jp-window)" opacity=".75" />
        </g>
      </g>

      <g className="japan-near-coast japan-near-coast-right">
        <path d="M1000 305c-91 7-163 37-220 91-36 34-77 60-132 78 23 55 55 99 98 133 87-24 172-32 254-23Z" fill="url(#jpCliff)" />
        <path d="M1000 295c-88 5-160 32-220 80-25 20-50 34-77 44 63-12 122-6 177 18 40-25 80-40 120-45Z" fill="url(#jpPine)" />
        <path d="M1000 480c-80-8-152 5-217 38-25 13-48 29-70 49 39 36 75 70 107 102 68-18 128-24 180-18Z" fill="var(--jp-rock-shadow)" opacity=".72" />
        <g className="japan-pines" stroke="var(--jp-pine-trunk)" strokeWidth="6" strokeLinecap="round">
          <path d="M913 378c-4-45-12-80-26-105m26 105c25-22 46-30 63-24m-64 21c-22-30-47-44-75-41m68 18c4-29 1-54-11-74" fill="none" />
          <path d="M823 405c-2-35-10-63-22-86m21 84c19-16 36-22 50-17m-49 16c-18-23-37-33-58-30" fill="none" strokeWidth="5" />
        </g>
        <g className="japan-lighthouse" transform="translate(885 309)">
          <path d="M20 101 29 26h28l10 75Z" fill="var(--jp-lighthouse)" stroke="var(--jp-house-line)" strokeWidth="2" />
          <path d="M26 67h36" stroke="var(--jp-roof)" strokeWidth="10" />
          <rect x="25" y="15" width="37" height="17" rx="3" fill="var(--jp-lighthouse-top)" stroke="var(--jp-house-line)" strokeWidth="2" />
          <path d="M20 16 44 1l24 15Z" fill="var(--jp-roof)" />
          <circle cx="44" cy="23" r="5.5" fill="var(--jp-sun)" />
        </g>
      </g>

      <g className="japan-water-far" fill="none" stroke="var(--jp-wave-far)" strokeLinecap="round">
        <path d="M42 354c53-20 108-20 164 0s111 20 166 0 110-20 166 0 111 20 166 0 111-20 167 0 94 18 129 5" strokeWidth="4" strokeOpacity=".2" />
        <path d="M5 401c48-17 97-17 148 0s101 17 151 0 99-17 150 0 101 17 152 0 101-17 151 0 101 17 152 0 94 17 141 2" strokeWidth="3" strokeOpacity=".16" />
        <path d="M-18 449c52-17 105-17 158 0s106 17 159 0 105-17 158 0 106 17 159 0 105-17 158 0 107 17 161 0 97-17 143-4" strokeWidth="3" strokeOpacity=".15" />
        <path d="M13 497c41-14 83-14 126 0s86 14 129 0 86-14 129 0 86 14 129 0 86-14 129 0 86 14 129 0 87-14 130 0 79 13 106 5" strokeWidth="3" strokeOpacity=".14" />
      </g>

      <g className="japan-current-channels" fill="none" stroke="var(--jp-current)" strokeLinecap="round">
        <path d="M468 326C445 423 405 553 339 760" strokeWidth="18" strokeOpacity=".05" />
        <path d="M532 326C555 423 595 553 661 760" strokeWidth="18" strokeOpacity=".05" />
        <path d="M468 326C445 423 405 553 339 760" strokeWidth="2.5" strokeOpacity=".16" strokeDasharray="8 30" />
        <path d="M532 326C555 423 595 553 661 760" strokeWidth="2.5" strokeOpacity=".16" strokeDasharray="8 30" />
      </g>

      <g className="japan-water-near" fill="none" stroke="var(--jp-wave-near)" strokeLinecap="round">
        <path d="M-40 523c68-28 136-28 205 0s137 28 205 0 137-28 205 0 137 28 205 0 137-28 205 0 104 24 155 9" strokeWidth="8" strokeOpacity=".14" />
        <path d="M18 584c54-24 109-24 165 0s111 24 166 0 110-24 166 0 111 24 166 0 111-24 166 0 105 22 153 7" strokeWidth="6" strokeOpacity=".2" />
        <path d="M-32 648c66-29 132-29 199 0s133 29 199 0 133-29 200 0 133 29 199 0 133-29 199 0 101 23 136 12" strokeWidth="9" strokeOpacity=".18" />
        <path d="M8 716c55-26 111-26 168 0s113 26 169 0 113-26 169 0 113 26 169 0 113-26 169 0 104 22 148 6" strokeWidth="7" strokeOpacity=".24" />
        <path d="M-28 782c67-30 134-30 201 0s134 30 201 0 134-30 201 0 134 30 201 0 134-30 201 0 99 23 123 15" strokeWidth="10" strokeOpacity=".2" />
      </g>

      <g className="japan-foam-flecks" fill="none" stroke="var(--jp-foam)" strokeLinecap="round">
        <path d="M100 535c24-11 49-11 74 0M771 555c27-12 54-12 82 0M259 610c32-14 64-14 96 0M586 665c38-16 77-16 115 0M79 711c27-12 54-12 82 0M780 735c32-14 64-14 96 0" strokeWidth="5" strokeOpacity=".56" />
        <path d="M162 570c8-4 16-4 24 0m453 28c10-5 20-5 30 0M406 698c12-5 24-5 36 0" strokeWidth="3" strokeOpacity=".42" />
      </g>

      <g className="japan-sparkles" fill="var(--jp-sparkle)">
        <circle cx="123" cy="458" r="2.5" opacity=".5" />
        <circle cx="305" cy="548" r="2" opacity=".42" />
        <circle cx="693" cy="468" r="3" opacity=".48" />
        <circle cx="837" cy="627" r="2.5" opacity=".44" />
        <path d="m526 539 4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" opacity=".38" />
        <path d="m220 676 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" opacity=".34" />
      </g>
    </svg>
  );
}

function CaptainYachtArt({ boost }) {
  return (
    <div className="yacht-illustration captain-painted-ship" aria-label="Rosie commanding her lantern-lit Japanese sailing ship">
      <div className="captain-painted-shadow" aria-hidden="true" />
      <div className="captain-painted-spray" aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
      </div>
      {boost && <div className="captain-wind-gust" aria-hidden="true"><i /><i /><i /></div>}
      <img
        className="captain-painted-sprite"
        src={boost ? captainWindSprite : "/captain-rosie-ship.webp"}
        alt=""
        draggable="false"
        decoding="async"
      />
      {/* Actual Captain Rosie portrait, extracted from the existing artwork.
          No generated substitute; the stern remains the original painting. */}
      {!boost && <img
          className="captain-painted-rosie"
          src="/captain-rosie-deck.webp"
          alt=""
          aria-hidden="true"
          draggable="false"
          decoding="async"
        />}
      <span className="captain-painted-lantern captain-painted-lantern-port" aria-hidden="true" />
      <span className="captain-painted-lantern captain-painted-lantern-starboard" aria-hidden="true" />
      <div className="yacht-wake-stack" aria-hidden="true"><i /><i /><i /></div>
      {boost && <div className="golden-wake" aria-hidden="true" />}
    </div>
  );
}

function CaptainCourseMotion({ phaseKey, underway, boost }) {
  return (
    <div
      className={`captain-course-motion phase-${phaseKey}${underway ? " is-underway" : ""}${boost ? " is-boosting" : ""}`}
      aria-hidden="true"
    >
      <div className="course-wind course-wind-a"><i /><i /><i /></div>
      <div className="course-wind course-wind-b"><i /><i /></div>
      <div className="course-flying-spray"><i /><i /><i /><i /><i /><i /></div>
      <svg className="course-rush-lines" viewBox="0 0 1000 760" preserveAspectRatio="none">
        <g fill="none" strokeLinecap="round">
          <path d="M-90 755C133 677 305 670 497 760M278 760C480 655 649 652 1070 735" />
          <path d="M-75 704C161 642 316 649 477 727M545 731C698 651 839 650 1070 704" />
          <path d="M-30 642C127 606 254 614 396 677M614 677C751 614 883 610 1035 646" />
        </g>
      </svg>
      <div className="course-vignette" />
      <div className="course-compass-rose"><span>N</span><i>✦</i><b>R</b></div>
    </div>
  );
}

/** Error boundary for the Captain yacht game (round 6). The app had NO
 * error boundary anywhere: any throw in a render or effect unmounted
 * the entire React root, leaving the near-black page background — the
 * "cuts to black" Mitchell hit at the barge impact and the empty black
 * pages the round-4 live check recorded. Whatever the trigger (a seam
 * throw in a browser-only path, a renderer hiccup under the eruption's
 * paint load), the failure is now contained: the rest of RosieVerse
 * stays alive and the player gets a panel that remounts the game
 * fresh, instead of a dead page that only a reload escapes. */
class CaptainGameBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, resets: 0, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { failed: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Captain game error boundary caught:", error);
    // Round 8 (Defect 1): the catch must REPORT ITSELF on screen. The
    // live finale crash could not be diagnosed from outside — the
    // browser operator has no DevTools access, so a console.error and
    // a sessionStorage copy are both unreadable where it matters.
    // The fallback panel therefore renders the error's name, message
    // and first stack lines as visible small print (see render), and
    // a copy is kept in sessionStorage for any session that can read
    // it. Any future live catch now names itself on the player's own
    // screen.
    this.setState({ errorInfo });
    try {
      window.sessionStorage?.setItem("captainBoundaryError", JSON.stringify({
        at: new Date().toISOString(),
        name: error?.name || "Error",
        message: error?.message || String(error),
        stack: String(error?.stack || "").split("\n").slice(0, 8).join("\n"),
        componentStack: String(errorInfo?.componentStack || "").split("\n").slice(0, 8).join("\n")
      }));
    } catch { /* storage is a bonus copy; the panel is the report */ }
  }
  render() {
    if (this.state.failed) {
      const error = this.state.error;
      const stackLines = String(error?.stack || "").split("\n").slice(0, 6);
      const componentLines = String(this.state.errorInfo?.componentStack || "")
        .split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 4);
      return (
        <div className="yacht-game-error-panel" role="alert">
          <strong>THE GAME HIT A SNAG</strong>
          <p>Something in the voyage broke mid-sail. The rest of RosieVerse
            is untouched — restart this game to cast off again.</p>
          <button type="button"
            onClick={() => this.setState((state) => ({ failed: false, resets: state.resets + 1, error: null, errorInfo: null }))}>
            RESTART THE GAME
          </button>
          {error && (
            <pre className="captain-boundary-error" aria-label="Error details">
              {`${error.name || "Error"}: ${error.message || String(error)}`}
              {stackLines.length > 1 ? `\n${stackLines.slice(1).join("\n")}` : ""}
              {componentLines.length ? `\n${componentLines.join("\n")}` : ""}
            </pre>
          )}
        </div>
      );
    }
    // The fullscreen frame clones THIS boundary with its game props; they
    // must be forwarded to the game or auto-fullscreen and the fullscreen
    // exit sequence never reach it.
    const child = React.isValidElement(this.props.children)
      ? React.cloneElement(this.props.children, {
          requestGameFullscreen: this.props.requestGameFullscreen,
          exitGameFullscreen: this.props.exitGameFullscreen,
          fullscreenExitSequence: this.props.fullscreenExitSequence,
        })
      : this.props.children;
    return <Fragment key={this.state.resets}>{child}</Fragment>;
  }
}

// Exported for the boundary regression test (round 8): the fallback
// panel must render the caught error's message + stack on screen.
export { CaptainGameBoundary };

/** Finale test hook: ?finale=1 in the page query (…/?finale=1#captain)
 * or in the hash query (…/#captain?finale=1) starts the boss chapter in
 * its finale-armed state. Once seen, the hook sticks for the tab
 * session (sessionStorage): the round-4 live check lost it on reload
 * and in fresh tabs and could not get the finale back, which is how a
 * verification hook defeats its own purpose. It is only ever SET by
 * the parameter itself — a session that never passes it is untouched,
 * and normal play, scoring, records and the picker never read it. */
function finaleHookRequested() {
  try {
    const fromPage = new URLSearchParams(window.location.search).get("finale") === "1";
    const hash = window.location.hash || "";
    const queryAt = hash.indexOf("?");
    const fromHash = queryAt >= 0 &&
      new URLSearchParams(hash.slice(queryAt + 1)).get("finale") === "1";
    if (fromPage || fromHash) {
      try { window.sessionStorage.setItem("rosieFinaleHook", "1"); } catch {}
      return true;
    }
    try { return window.sessionStorage.getItem("rosieFinaleHook") === "1"; } catch {}
  } catch {}
  return false;
}

/** Offset variant of the finale hook (round 9): &offset=1 alongside
 * finale=1 (same two places — page query or hash query) starts the
 * hook state with Rosie pinned to the left wall at the barge's
 * height, so the first finale charge misses her and runs into the
 * barge with zero input. Live verification of the dodge → barge-
 * impact path kept depending on operator steering, which two checker
 * runs proved unreliable; this makes the path deterministic. Unlike
 * the finale hook itself the offset is NOT sticky — it is read only
 * from the live URL, so it can never leak into a later plain
 * finale=1 run in the same tab. Inert for normal play. */
function finaleOffsetRequested() {
  try {
    if (new URLSearchParams(window.location.search).get("offset") === "1") return true;
    const hash = window.location.hash || "";
    const queryAt = hash.indexOf("?");
    if (queryAt >= 0 &&
      new URLSearchParams(hash.slice(queryAt + 1)).get("offset") === "1") return true;
  } catch {}
  return false;
}

function CaptainRosieGame({ soundOn, requestGameFullscreen, fullscreenExitSequence = 0 }) {
  const [wideConsole,setWideConsole] = useState(()=>window.matchMedia("(min-width:1100px) and (min-height:650px) and (orientation:landscape)").matches);
  useEffect(()=>{
    const media=window.matchMedia("(min-width:1100px) and (min-height:650px) and (orientation:landscape)");
    const sync=()=>setWideConsole(media.matches);
    media.addEventListener("change",sync);return()=>media.removeEventListener("change",sync);
  },[]);
  const gamepadRoot=useRef(null),gamepadHandler=useRef(null),gamepadLane=useRef({value:0,next:0});
  const [steerMode,setSteerMode]=useState(()=>{try{return localStorage.getItem("yachtSteeringMode")==="joystick"?"joystick":"buttons"}catch{return "buttons"}});
  const toggleSteerMode=()=>setSteerMode(current=>{const next=current==="joystick"?"buttons":"joystick";try{localStorage.setItem("yachtSteeringMode",next)}catch{}return next});
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [restartConfirm, setRestartConfirm] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(() => yachtRunSeconds(0));
  const [levelOrder, setLevelOrder] = useState(shuffleCaptainLevelOrder);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [unlockedChapter, setUnlockedChapter] = useState(() => {
    try { return yachtUnlockedLevel(localStorage.getItem("yachtDashUnlockedChapter")); }
    catch { return 0; }
  });
  const [completed, setCompleted] = useState(false);
  const [showVictoryArt, setShowVictoryArt] = useState(false);
  // Kuroi finale cinematic (Mitchell, 2026-11-25): when the boss
  // chapter is won, the full canvas fireworks eruption plays first
  // (the arena machine's eruption state, ARENA.eruptionMs), and the
  // moment the machine ends it this flag mounts the cohesive finale
  // video — automatically, fullscreen — which hands off to the
  // victory art when it finishes. No button anywhere: the video
  // starts on its own after the fireworks, and the victory screen
  // follows on its own after the video. Other chapters keep the
  // direct victory-art path; a defeat never shows the video.
  const [showFinaleVideo, setShowFinaleVideo] = useState(false);
  const finaleVideoRef = useRef(null);
  // Autoplay assurance: the win happens minutes after the player's
  // last tap, so some browsers (iOS especially) may refuse unmuted
  // autoplay. Try with sound first; if the browser refuses, play
  // muted rather than sit on a frozen first frame — the cinematic
  // must start on its own, with no tap required.
  useEffect(() => {
    if (!showFinaleVideo) return undefined;
    const video = finaleVideoRef.current;
    if (!video) return undefined;
    let cancelled = false;
    const attempt = async () => {
      try { await video.play(); }
      catch {
        if (cancelled) return;
        try { video.muted = true; await video.play(); } catch { /* onError/end handoff still guards */ }
      }
    };
    attempt();
    return () => { cancelled = true; };
  }, [showFinaleVideo]);
  useEffect(() => {
    if (!showVictoryArt) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        setShowVictoryArt(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape, true);
    return () => document.removeEventListener("keydown", closeOnEscape, true);
  }, [showVictoryArt]);
  const [nearMisses, setNearMisses] = useState(0);
  const [rivalsPassed, setRivalsPassed] = useState(0);
  const [suppliesCollected, setSuppliesCollected] = useState(0);
  const [hullRecovering, setHullRecovering] = useState(false);
  const [chapterRecords, setChapterRecords] = useState(() => {
    try { return parseYachtRecords(localStorage.getItem("yachtDashRecordsV1")); }
    catch { return {}; }
  });
  const [lane, setLane] = useState(1);
  const [items, setItems] = useState([]);
  const [catches, setCatches] = useState({ ball: 0, treat: 0, cheese: 0 });
  const [message, setMessage] = useState("Captain Rosie is on the bridge. The coastal passage is clear and the treats are somewhere ahead.");
  const [best, setBest] = useState(() => {
    try {
      const value = Number(localStorage.getItem("captainRosieBest") || 0);
      return Number.isFinite(value) ? value : 0;
    } catch { return 0; }
  });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [combo, setCombo] = useState(1);
  const [turbo, setTurbo] = useState(0);
  const [boost, setBoost] = useState(false);
  const [cheeses, setCheeses] = useState(0);
  const [eventPulse, setEventPulse] = useState(0);
  const [eventKind, setEventKind] = useState("ball");
  const [ramImpact, setRamImpact] = useState(null);
  const [phaseNotice, setPhaseNotice] = useState("");
  const [ended, setEnded] = useState(false);
  // Kuroi EPIC ARENA state. The machine itself lives in a ref (tick-driven);
  // arenaView mirrors it for the HUD, the arena layer and the results.
  const [arenaView, setArenaView] = useState(() => arenaInitial());
  const [bossElapsed, setBossElapsed] = useState(0);
  const [arenaCrashFx, setArenaCrashFx] = useState(null);
  // Round 5: weapon bursts (bomb detonations, rocket landings) drawn
  // from machine events — a short-lived list pruned on a clock, the
  // same pattern as the crash splash.
  const [arenaBoomFx, setArenaBoomFx] = useState([]);
  // The ONE text overlay the arena keeps (Mitchell, round 3): a brief
  // callout when the fireworks barge arrives. Everything else that used
  // to shout over the fight — banner pill, phase notices, helm hint —
  // is gone; the barge callout dismisses itself.
  const [bargeCallout, setBargeCallout] = useState(null);
  // Touch arena controls (Mitchell's spec): a FIXED virtual joystick
  // in the arena's bottom-right, beside the DASH pill. The cluster
  // renders only for touch players — this state turns true when the
  // device reports a coarse pointer, or on the first touch inside the
  // arena — so a mouse/keyboard player never sees it. React state
  // only mounts the cluster; the knob's position is written to its
  // DOM node directly from the animation-frame sampler (no render
  // churn).
  const [arenaTouchUi, setArenaTouchUi] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches);

  // Game soundtrack state belongs to the single RosieVerse music player.
  // Existing yacht pickup/impact SFX remain entirely independent.
  useEffect(() => {
    if (!running && !ended) return;
    const state=ended?(completed?"victory":"ended"):paused?"paused":"playing";
    window.dispatchEvent(new CustomEvent("rosieverse:music:scene",{
      detail:{scene:"yacht",state,chapter:chapterIndex}
    }));
  },[running,paused,ended,completed,chapterIndex]);

  const laneRef = useRef(1);
  const courseFocusRef = useRef(null);
  const livesRef = useRef(3);
  const hullGraceRemainingRef = useRef(0);
  const itemsRef = useRef([]);
  const spawnClockRef = useRef(0);
  const bonusTreatClockRef = useRef(0);
  const spawnSequenceRef = useRef(0);
  const lastWaveRef = useRef([]);
  const itemIdRef = useRef(0);
  const finishedRef = useRef(false);
  const boostRef = useRef(false);
  const boostDrainTimerRef = useRef(0);
  const phaseNoticeTimerRef = useRef(0);
  const boostRemainingRef = useRef(0);
  const streakRef = useRef(0);
  const comboRef = useRef(1);
  const touchStartRef = useRef(null);
  const audioRef = useRef(null);
  const lastPhaseRef = useRef("harbor");
  const arenaRef = useRef(arenaInitial());
  const arenaKeysRef = useRef({});
  const arenaDashRef = useRef(false);
  const arenaPointerRef = useRef(null);
  const arenaJoystickInputRef = useRef(null);
  if (arenaJoystickInputRef.current === null) {
    arenaJoystickInputRef.current = new ArenaJoystickInput();
  }
  const arenaTouchDashRef = useRef(null);
  const arenaJoystickRef = useRef(null);
  const arenaJoystickKnobRef = useRef(null);
  const arenaStickVectorRef = useRef(null);
  const arenaTouchElementRef = useRef(null);
  const arenaTouchRafRef = useRef(null);
  const arenaRunRef = useRef(0);

  function stopArenaTouchSampling() {
    if (arenaTouchRafRef.current !== null) {
      window.cancelAnimationFrame(arenaTouchRafRef.current);
      arenaTouchRafRef.current = null;
    }
  }

  function resetArenaJoystickKnob() {
    if (arenaJoystickKnobRef.current) {
      arenaJoystickKnobRef.current.style.transform = "translate(-50%, -50%)";
    }
  }

  function clearArenaTouchInput(clearPendingDash = true) {
    arenaJoystickInputRef.current?.clear();
    if (clearPendingDash) arenaTouchDashRef.current = null;
    stopArenaTouchSampling();
    arenaStickVectorRef.current = null;
    resetArenaJoystickKnob();
  }

  const runSeconds = yachtRunSeconds(chapterIndex);
  const chapter = YACHT_CHAPTERS[chapterIndex];
  const isBoss = chapter.mode === "boss";
  // Boss mode has no countdown: TIME counts up from the run start, and the
  // course phase follows the arena fight's phase (0/1/2), not the clock.
  const elapsed = isBoss ? bossElapsed : Math.max(0, runSeconds - timeLeft);
  const phaseKey = isBoss
    ? ["harbor", "riviera", "sunset"][arenaView.phase]
    : timeLeft > runSeconds * 2 / 3 ? "harbor" : timeLeft > runSeconds / 3 ? "riviera" : "sunset";
  const phase = YACHT_CHAPTER_PHASES[chapter.id]?.[phaseKey] || CAPTAIN_PHASES[phaseKey];
  const levelNumber = yachtSceneIndex(chapterIndex, elapsed);
  const level = yachtSceneFor(chapterIndex, elapsed, levelOrder);
  const scenery = useCaptainSceneryTransition(level, true, !running && !ended);
  // Fetch only the NEXT painting in advance; no mounting or accumulating five layers.
  const nextLevel = levelNumber < 4
    ? yachtSceneFor(chapterIndex, (levelNumber + 1) * yachtSceneSeconds(chapterIndex), levelOrder) : null;
  useEffect(() => {
    if (!nextLevel) return undefined;
    const image = new Image();
    image.decoding = "async";
    image.src = nextLevel.background;
    return () => { image.onload = null; };
  }, [nextLevel?.background]);
  const routeProgress = isBoss
    ? Math.round(arenaView.totalCrashes / ARENA.totalCrashes * 100)
    : Math.min(100, Math.round(elapsed / runSeconds * 100));
  const missionProgress = Math.min(100, Math.round(score / YACHT_CHAPTER_GOALS[chapter.id].score * 100));
  const chapterMedals = yachtMedalsFor(chapter.id, { completed, score, lives, nearMisses, rivalsPassed });
  const collectedTotal = catches.ball + catches.treat + catches.cheese + suppliesCollected;
  const threatForecast = yachtThreatForecast(items, laneRef.current);
  const rank = captainRank(score);

  function audioContext() {
    if (!soundOn) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioRef.current) audioRef.current = new AudioContext();
    audioRef.current.resume?.();
    return audioRef.current;
  }

  function captainTone(kind) {
    const context = audioContext();
    if (!context) return;
    const now = context.currentTime;
    const map = {
      ball: [660, 880],
      treat: [523, 784, 1046],
      cheese: [659, 988, 1318],
      buoy: [164, 123],
      boost: [440, 660, 880, 1174],
      finish: [392, 523, 659, 784]
    };
    const tones = map[kind] || map.ball;
    tones.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = kind === "buoy" ? "sawtooth" : "sine";
      oscillator.frequency.setValueAtTime(frequency, now + index * .055);
      gain.gain.setValueAtTime(.0001, now + index * .055);
      gain.gain.exponentialRampToValueAtTime(kind === "buoy" ? .035 : .028, now + index * .055 + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, now + index * .055 + .24);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + index * .055);
      oscillator.stop(now + index * .055 + .26);
    });
  }

  function pulse(kind) {
    setEventKind(kind);
    setEventPulse((value) => value + 1);
  }

  function announcePhase(text) {
    window.clearTimeout(phaseNoticeTimerRef.current);
    setPhaseNotice(text);
    phaseNoticeTimerRef.current = window.setTimeout(() => setPhaseNotice(""), 1500);
  }

  useEffect(() => () => window.clearTimeout(phaseNoticeTimerRef.current), []);
  useEffect(() => {
    if (!ramImpact) return undefined;
    const timer = window.setTimeout(() => setRamImpact(null), 1400);
    return () => window.clearTimeout(timer);
  }, [ramImpact]);

  useEffect(() => {
    if (!arenaCrashFx) return undefined;
    const timer = window.setTimeout(() => setArenaCrashFx(null), 1500);
    return () => window.clearTimeout(timer);
  }, [arenaCrashFx]);

  useEffect(() => {
    if (!arenaBoomFx.length) return undefined;
    const timer = window.setTimeout(() => setArenaBoomFx([]), 520);
    return () => window.clearTimeout(timer);
  }, [arenaBoomFx]);

  useEffect(() => {
    if (!bargeCallout) return undefined;
    const timer = window.setTimeout(() => setBargeCallout(null), 2400);
    return () => window.clearTimeout(timer);
  }, [bargeCallout]);

  function moveCaptain(direction) {
    if (!running || paused) return;
    // The collision loop reads laneRef synchronously. Waiting for React to
    // commit an updater can incorrectly score a hit on iPhone.
    const next = yachtClampLane(laneRef.current, direction);
    laneRef.current = next;
    setLane(next);
  }

  function steerTo(nextLane) {
    if (!running || paused) return;
    const safeLane = Math.max(0, Math.min(2, nextLane));
    laneRef.current = safeLane;
    setLane(safeLane);
  }

  function finishGame(reason, success = false) {
    if (finishedRef.current) return;
    setCompleted(success);
    // Mitchell (2026-11-25): the victory screen is the reward for
    // beating the level — it opens on its own the moment the run is
    // won, no button press; and there is no way to view it without
    // the win (the old VIEW VICTORY / VIEW VICTORY ART buttons are
    // gone). Its own actions lead back to the captain's log.
    finishedRef.current = true;
    boostRef.current = false;
    boostRemainingRef.current = 0;
    window.clearInterval(boostDrainTimerRef.current);
    setBoost(false);
    setHullRecovering(false);
    hullGraceRemainingRef.current = 0;
    setPaused(false);
    setRestartConfirm(false);
    setRunning(false);
    window.clearTimeout(phaseNoticeTimerRef.current);
    setPhaseNotice("");
    arenaKeysRef.current = {};
    arenaPointerRef.current = null;
    arenaDashRef.current = false;
    clearArenaTouchInput();
    setEnded(true);
    setMessage(reason);
    if (success) {
      captainTone("finish"); // A failed voyage never gets victory fanfare.
      if (YACHT_CHAPTERS[chapterIndex]?.mode === "boss") {
        // The eruption has just finished (the arena machine emits
        // victory only after ARENA.eruptionMs of full fireworks):
        // start the finale cinematic now, fullscreen, and let its
        // end open the victory art (see finishFinaleVideo).
        setShowVictoryArt(false);
        setShowFinaleVideo(true);
        requestGameFullscreen?.();
      } else {
        setShowVictoryArt(true);
      }
    }
  }

  // The finale video's handoff: whether it played through or could
  // not play at all, the player lands on the victory art they won —
  // automatically, exactly as every other chapter's win does.
  function finishFinaleVideo() {
    setShowFinaleVideo(false);
    setShowVictoryArt(true);
  }

  // Choosing a level resets the run HUD to that chapter's fresh state.
  // The picker used to only setChapterIndex, so the previous run's score,
  // time, hull and cargo stayed on screen (and the route bar could even
  // show phantom progress from the old run's remaining time).
  function selectChapter(index) {
    const chosen = Math.max(0, Math.min(YACHT_CHAPTERS.length - 1, index));
    setChapterIndex(chosen);
    setScore(0);
    setLives(3);
    setTimeLeft(yachtRunSeconds(chosen));
    setCatches({ ball: 0, treat: 0, cheese: 0 });
    setStreak(0);
    setBestStreak(0);
    setCombo(1);
    setTurbo(0);
    setBoost(false);
    setCheeses(0);
    setNearMisses(0);
    setRivalsPassed(0);
    setSuppliesCollected(0);
    setCompleted(false);
    setEnded(false);
    setShowVictoryArt(false);
    setShowFinaleVideo(false);
    setMessage(YACHT_CHAPTERS[chosen].description);
    arenaRef.current = arenaInitial();
    setArenaView(arenaRef.current);
    clearArenaTouchInput();
    setBossElapsed(0);
    setArenaCrashFx(null);
    setArenaBoomFx([]);
    setBargeCallout(null);
  }

  function startGame(targetChapter = chapterIndex) {
    // Mitchell's rule (2026-11-25): every game goes fullscreen when played.
    requestGameFullscreen?.();
    audioContext();
    const chosen = typeof targetChapter === "number"
      ? Math.max(0, Math.min(yachtPlayableLimit(unlockedChapter), targetChapter)) : chapterIndex;
    if (chosen !== chapterIndex) setChapterIndex(chosen);
    if (ended) setLevelOrder(shuffleCaptainLevelOrder());
    finishedRef.current = false;
    boostRef.current = false;
    boostRemainingRef.current = 0;
    window.clearInterval(boostDrainTimerRef.current);
    setPaused(false);
    setRestartConfirm(false);
    streakRef.current = 0;
    comboRef.current = 1;
    // First cargo arrives promptly; later intervals have breathing room.
    spawnClockRef.current = chosen === 0 ? 350 : 850;
    bonusTreatClockRef.current = 2500;
    spawnSequenceRef.current = 0;
    lastWaveRef.current = [];
    laneRef.current = 1;
    livesRef.current = 3;
    hullGraceRemainingRef.current = 0;
    setHullRecovering(false);
    setRamImpact(null);
    arenaRunRef.current += 1;
    // Finale test hook: starting the boss chapter with ?finale=1 (in the
    // page query or the hash query) begins the arena already in the
    // finale-armed state — barge in, laser sequence ready — so the
    // eruption → victory path can be verified live. Inert without the
    // parameter and for every other chapter; it only changes this one
    // run's starting state, never scoring, records or the picker.
    const hookFinale = YACHT_CHAPTERS[chosen].mode === "boss" && finaleHookRequested();
    // Round 9: &offset=1 with the hook pins Rosie to the left wall so
    // the first finale charge deterministically misses her and hits
    // the barge — the dodge path with no steering required.
    const hookOffset = hookFinale && finaleOffsetRequested();
    arenaRef.current = hookFinale
      ? arenaFinaleStart(1467 + arenaRunRef.current * 7919, { offset: hookOffset })
      : arenaInitial(1467 + arenaRunRef.current * 7919);
    setArenaView(arenaRef.current);
    arenaKeysRef.current = {};
    arenaPointerRef.current = null;
    arenaDashRef.current = false;
    clearArenaTouchInput();
    setBossElapsed(0);
    setArenaCrashFx(null);
    setArenaBoomFx([]);
    setBargeCallout(null);
    lastPhaseRef.current = "harbor";
    setLane(1);
    itemsRef.current = [];
    setItems([]);
    setCatches({ ball: 0, treat: 0, cheese: 0 });
    setScore(0);
    setLives(3);
    setTimeLeft(yachtRunSeconds(chosen));
    setStreak(0);
    setBestStreak(0);
    setCombo(1);
    setTurbo(0);
    setBoost(false);
    setCheeses(0);
    setNearMisses(0);
    setRivalsPassed(0);
    setSuppliesCollected(0);
    setCompleted(false);
    setShowVictoryArt(false);
    setShowFinaleVideo(false);
    setEnded(false);
    // Warm the finale video's cache during the boss fight so it can
    // start the instant the eruption ends instead of buffering then.
    if (YACHT_CHAPTERS[chosen].mode === "boss") {
      try {
        const warm = document.createElement("video");
        warm.preload = "auto";
        warm.src = "/yacht-dash/kuroi-arena/kuroi-finale-video.mp4";
      } catch { /* preload is an optimization only */ }
    }
    // The boss arena runs without center-screen notices (round 3); the
    // lane chapters keep their CAST OFF shout.
    if (YACHT_CHAPTERS[chosen].mode !== "boss") announcePhase("CAST OFF");
    setMessage(YACHT_CHAPTERS[chosen].description);
    if (hookFinale) {
      // The hook constructs the armed state directly, so the machine
      // never emits the "barge" event the callout hangs off in the tick
      // handler — fire it here, exactly as the natural tow-in does
      // (round 4: in the live hook check the callout never appeared).
      setBargeCallout("THE FIREWORKS BARGE!");
      setMessage("The fireworks barge is towed into the arena. Captain Rosie reaches for her laser pointer…");
    }
    setRunning(true);
  }

  useEffect(() => {
    if (!running) return undefined;
    // The Cast Off button unmounts at launch, leaving document.body focused.
    // Restore focus to this game so desktop arrow keys work immediately.
    // (No coarse-pointer carve-out: touch-capable laptops need this too.)
    const frame = window.requestAnimationFrame(() => {
      // Desktop boss chapter: compose the playing view before focusing —
      // sticky topbar, then the progress bar, then the arena filling the
      // remaining viewport. The shell's scroll-margin-top (desktop arena
      // CSS) lands its top edge fully below the topbar instead of sliding
      // underneath it; the breakpoint matches that CSS query exactly, so
      // phones and other chapters never scroll on launch.
      if (isBoss && window.matchMedia("(min-width: 900px) and (min-height: 650px) and (orientation: landscape)").matches) {
        courseFocusRef.current?.closest(".yacht-game-shell")
          ?.scrollIntoView({ block: "start", behavior: "auto" });
      }
      courseFocusRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [running]);

  function engageBoost() {
    if (!running || paused || boostRef.current || turbo < 100) return;
    boostRef.current = true;
    boostRemainingRef.current = 6000;
    setTurbo(100);
    setBoost(true);
    setMessage("FULL STEAM. Captain Rosie's golden wake doubles every score for six seconds.");
    pulse("boost");
    captainTone("boost");
    window.navigator.vibrate?.([20, 25, 20, 25, 35]);
  }

  useEffect(() => {
    if (!running || paused || !boost) return undefined;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      boostRemainingRef.current = Math.max(0, boostRemainingRef.current - (now - last));
      last = now;
      const remaining = boostRemainingRef.current;
      setTurbo(Math.ceil(remaining / 6000 * 100));
      if (remaining <= 0) {
        window.clearInterval(timer);
        boostRef.current = false;
        setBoost(false);
        setTurbo(0);
        setMessage("Boost complete. Return to elegant, responsible yacht speeds.");
      }
    }, 80);
    boostDrainTimerRef.current = timer;
    return () => window.clearInterval(timer);
  }, [running, paused, boost]);

  function toggleYachtPause() {
    if (!running || ended) return;
    setRestartConfirm(false);
    setPaused(current => !current);
  }

  function returnYachtToLevels() {
    finishedRef.current = true;
    boostRef.current = false;
    boostRemainingRef.current = 0;
    window.clearInterval(boostDrainTimerRef.current);
    setBoost(false);
    setRunning(false);
    setPaused(false);
    setRestartConfirm(false);
    setEnded(false);
    setCompleted(false);
    setShowVictoryArt(false);
    setPhaseNotice("");
    // Reset the HUD/run display state for the current chapter (score,
    // hull, clocks, arena) so the start screen does not show the
    // abandoned run's numbers.
    selectChapter(chapterIndex);
  }

  function requestYachtRestart() {
    if (!running || ended) {
      startGame();
      return;
    }
    // Do not destroy a live run from a stray touch beside the pause control.
    setPaused(true);
    setRestartConfirm(true);
  }

  useEffect(() => {
    if (fullscreenExitSequence > 0 && running) {
      setPaused(true);
      setMessage("Voyage paused when leaving full screen. Resume from the helm.");
    }
    // The sequence changes only when the player closes this specific frame.
  }, [fullscreenExitSequence]);

  function onCoursePointerDown(event) {
    touchStartRef.current = running && !paused &&
      (event.pointerType !== "mouse" || event.button === 0)
      ? { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
      : null;
  }

  function onCoursePointerUp(event) {
    const startPoint = touchStartRef.current;
    touchStartRef.current = null;
    if (!running || paused || !startPoint || startPoint.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - startPoint.x;
    const deltaY = event.clientY - startPoint.y;
    const rect = event.currentTarget.getBoundingClientRect();
    const steps = yachtSwipeSteps(deltaX, deltaY, rect.width);
    if (steps) {
      moveCaptain(steps);
      return;
    }
    // A vertical scroll or an imprecise drag is not a lane selection.
    if (Math.hypot(deltaX, deltaY) > 18) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    steerTo(ratio < .333 ? 0 : ratio > .666 ? 2 : 1);
  }

  useEffect(() => {
    if (!running || paused) return undefined;
    // A single timeout avoids firing React state updates from another state
    // updater, and pauses cleanly when an iPhone is interrupted.
    const timer = window.setTimeout(() => {
      // The boss finale has no countdown: TIME counts up, and the fight ends
      // on three crashes (fireworks timer) or a lost hull, never on the clock.
      if (isBoss) {
        setBossElapsed((current) => current + .5);
        return;
      }
      if (timeLeft <= .5) {
        setTimeLeft(0);
        finishGame(YACHT_CHAPTERS[chapterIndex].name +
          " conquered. Captain Rosie has entered the voyage in the official treat ledger.", true);
      } else {
        setTimeLeft(Math.max(0, timeLeft - .5));
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [running, paused, chapterIndex, timeLeft, bossElapsed]);

  useEffect(() => {
    if (!running) return undefined;
    // Phone calls, app-switching and browser tab changes must never consume
    // hull or timer while the game is not visible.
    const pauseWhenHidden = () => {
      if (document.hidden) {
        setPaused(true);
        touchStartRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    window.addEventListener("pagehide", pauseWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      window.removeEventListener("pagehide", pauseWhenHidden);
    };
  }, [running]);

  useEffect(() => {
    if (!running || paused) return;
    if (phaseKey === lastPhaseRef.current) return;
    lastPhaseRef.current = phaseKey;
    // The boss arena shows no center-screen phase notices (round 3);
    // its phases read off the paintings and the HUD pips instead.
    if (!isBoss) announcePhase(phase.name.toUpperCase());
    setMessage(phase.copy);
    captainTone(phaseKey === "sunset" ? "cheese" : "ball");
  }, [phaseKey, running]);

  useEffect(() => {
    if (!running || paused) return undefined;

    // A modestly longer mobile cadence substantially reduces paint pressure on
    // iPhone while preserving the same world speed and pickup timings.
    const tickMs = window.matchMedia?.("(max-width: 720px)").matches ? 84 : 70;
    const movementScale = tickMs / 70;

    const tick = window.setInterval(() => {
      // A timer victory or hull loss can finish just before an interval fires.
      // Never award post-finish cargo or apply another collision.
      if (finishedRef.current) return;
      // The boss chapter is the Kuroi EPIC ARENA: its own tick effect
      // drives the arena machine; the lane world stays out of it entirely.
      if (isBoss) return;
      if (hullGraceRemainingRef.current > 0) {
        hullGraceRemainingRef.current = Math.max(0, hullGraceRemainingRef.current - tickMs);
        if (hullGraceRemainingRef.current === 0) setHullRecovering(false);
      }
      let scoreDelta = 0;
      let turboDelta = 0;
      let lifeLoss = 0;
      let cheeseGain = 0;
      let bonusPoints = 0;
      let closePasses = 0;
      let rivalPasses = 0;
      let hitRival = false;
      let supplyCaught = false;
      let supplyRepairedHull = false;
      let supplyExtendedBoost = false;
      const pickupsCaught = { ball: 0, treat: 0, cheese: 0 };
      let lastHit = "";
      let missedGood = false;

      // Resolve collisions synchronously against the authoritative item ref.
      // React may defer a setState updater, so reading totals mutated inside
      // setItems() immediately afterward previously lost earned points.
      {
        spawnClockRef.current += tickMs;
        const phaseSpeed = (phaseKey === "harbor" ? 0 : phaseKey === "riviera" ? .35 : .75) + chapter.pace;
        const next = itemsRef.current.map((item) => {
          const moved = { ...item, y: item.y + (item.speed + phaseSpeed) * yachtMovementMultiplier(item.kind) * movementScale };
          // Kuroi aims at Rosie's current lane as his attack begins. An
          // aligned rival keeps charging straight; otherwise he commits to
          // one adjacent lane, then holds that course so a dodge is possible.
          if (moved.kind === "rival" && !moved.drifted && moved.y >= 43) {
            const targetLane = yachtRivalAttackLane(moved.lane, laneRef.current);
            moved.driftFrom = moved.lane;
            moved.driftTo = targetLane;
            moved.turned = targetLane !== moved.lane;
            moved.lane = targetLane;
            moved.drifted = true;
          } else if (moved.driftTo !== undefined && !moved.drifted && moved.y >= 43) {
            moved.lane = moved.driftTo;
            moved.drifted = true;
          }
          return moved;
        });

        const spawnEvery = yachtSpawnInterval(chapter.id, phaseKey, spawnSequenceRef.current);
        if (!isBoss && spawnClockRef.current >= spawnEvery) {
          // Keep fractional elapsed time: clearing the whole clock made phone
          // ticks accumulate measurable cadence drift across a 75-second run.
          spawnClockRef.current -= spawnEvery;
          const sequence = spawnSequenceRef.current++;
          if (chapter.id === "sakura") {
            const delivery = yachtSakuraDelivery(sequence, secureIndex);
            const template = CAPTAIN_PICKUPS.find(pickup => pickup.kind === delivery.kind);
            next.push({ ...template, id: itemIdRef.current += 1,
              lane: delivery.lane, y: -12,
              speed: yachtObjectSpeed(chapter.id, delivery.kind, secureIndex) });
          } else {
            // Preserve the chapter's set pieces, but space the hazards into
            // legible challenges followed by an intentionally safe reward.
            const wave = yachtPacedWaveFor(
              chapter.id, sequence, secureIndex, livesRef.current);
            // Launch Kuroi within a single-lane lunge of Rosie. He can never
            // teleport across two lanes in the attack animation.
            const stagedWave = wave.map(entry =>
              entry.kind === "rival" && Math.abs(entry.lane - laneRef.current) === 2
                ? { ...entry, lane: 1 } : entry);
            const followUpLane = yachtFollowUpRewardLane(
              lastWaveRef.current, laneRef.current);
            // The replacement torii uses its open architecture to communicate
            // the passage. Do not obscure the channel with instructional text.
            stagedWave.forEach((entry) => {
              const standard = CAPTAIN_PICKUPS.find((pickup) => pickup.kind === entry.kind);
              // A regular cargo wave must also avoid a fresh bonus treat or
              // an obstacle currently entering the same release corridor.
              const preferredLane = followUpLane ?? entry.lane;
              const openLane = isYachtHazard(entry.kind)
                ? -1 : yachtBonusTreatLane(next, preferredLane, laneRef.current);
              next.push({ ...(standard || { label: entry.label, points: 0, turbo: 0 }),
                ...entry, id: itemIdRef.current += 1, y: -12,
                lane: openLane >= 0 ? openLane : entry.lane,
                speed: yachtObjectSpeed(chapter.id, entry.kind, secureIndex),
                drifted: false, scoredPass: false });
            });
            lastWaveRef.current = stagedWave;
          }
        }

        // Deliver an occasional extra treat into genuinely open water. If all
        // three lanes are occupied, hold it rather than dropping unfair cargo.
        if (chapter.id !== "sakura") {
          bonusTreatClockRef.current += tickMs;
          if (bonusTreatClockRef.current >= yachtExtraTreatMs(chapter.id)) {
            // Favor Rosie's current route; move only if the water is occupied.
            const safeLane = yachtBonusTreatLane(next, laneRef.current, laneRef.current);
            if (safeLane >= 0) {
              bonusTreatClockRef.current -= yachtExtraTreatMs(chapter.id);
              const treat = CAPTAIN_PICKUPS.find((pickup) => pickup.kind === "treat");
              next.push({ ...treat, id: itemIdRef.current += 1,
                lane: safeLane, y: -12,
                speed: yachtObjectSpeed(chapter.id, "treat", secureIndex),
                bonusTreat: true });
            }
          }
        }

        const remaining = next.filter((item) => {
          const inCatchZone = item.y >= yachtCatchStart(item) && item.y <= 92;
          if (inCatchZone && (isYachtHazard(item.kind)
              ? yachtTouchesHazard(item, laneRef.current) : item.lane === laneRef.current)) {
            if (isYachtHazard(item.kind)) {
              if (yachtCanTakeHit(hullGraceRemainingRef.current, lifeLoss > 0)) {
                lifeLoss = 1;
                hitRival ||= item.kind === "rival";
                lastHit = "buoy";
                streakRef.current = 0;
                comboRef.current = 1;
              }
              // Hazards never apply repeated damage while crossing the hull,
              // including during the recovery interval.
            } else if (item.kind === "supply") {
              // Only one supply chest can spawn per chapter; never count it as a
              // regular ball/treat/cheese or penalize players for missing it.
              scoreDelta += item.points * (boostRef.current ? 2 : 1);
              turboDelta += item.turbo;
              supplyCaught = true;
              lastHit = "supply";
            } else {
              streakRef.current += 1;
              comboRef.current = Math.min(4, 1 + Math.floor(streakRef.current / 4));
              const multiplier = comboRef.current * (boostRef.current ? 2 : 1);
              scoreDelta += item.points * multiplier;
              turboDelta += item.turbo;
              lastHit = item.kind;
              if (item.kind === "cheese") cheeseGain += 1;
              pickupsCaught[item.kind] += 1;
            }
            return false;
          }
          if (isYachtHazard(item.kind) && !item.scoredPass && item.y >= 94) {
            item.scoredPass = true;
            if (yachtNearMiss(item, laneRef.current)) {
              bonusPoints += YACHT_CLEAN_PASS_POINTS;
              closePasses++;
            }
            if (item.kind === "rival" && !item.boss) {
              bonusPoints += boostRef.current ? 120 : 70;
              rivalPasses++;
            }
          }
          if (item.y >= 108) {
            if (!isYachtHazard(item.kind) && item.kind !== "supply") missedGood = true;
            return false;
          }
          return true;
        });
        itemsRef.current = remaining;
        setItems(remaining);
      }

      if (missedGood && !scoreDelta) {
        streakRef.current = 0;
        comboRef.current = 1;
        setStreak(0);
        setCombo(1);
      }

      if (scoreDelta) {
        setCatches((current) => ({
          ball: current.ball + pickupsCaught.ball,
          treat: current.treat + pickupsCaught.treat,
          cheese: current.cheese + pickupsCaught.cheese
        }));
        setScore((current) => current + scoreDelta);
        setStreak(streakRef.current);
        setCombo(comboRef.current);
        setBestStreak((current) => Math.max(current, streakRef.current));
        if (!boostRef.current) setTurbo((current) => Math.min(100, current + turboDelta));
        if (cheeseGain) setCheeses((current) => current + cheeseGain);
        if (supplyCaught) {
          setSuppliesCollected((current) => current + 1);
          supplyRepairedHull = livesRef.current < 3;
          livesRef.current = Math.min(3, livesRef.current + 1);
          setLives(livesRef.current);
          if (boostRef.current) {
            boostRemainingRef.current = Math.min(6000, boostRemainingRef.current + 2500);
            supplyExtendedBoost = true;
          }
        }
        const phrase = lastHit === "supply"
          ? "EMERGENCY SUPPLIES: +150 points, " +
            (supplyRepairedHull ? "one hull repaired" : "hull already full") + ", " +
            (supplyExtendedBoost ? "Turbo extended." : "Turbo recharged.")
          : lastHit === "cheese"
          ? "Golden Cheese aboard. Rosie has inventoried it as priceless cargo."
          : lastHit === "treat"
            ? "Premium provisions aboard. Rosie considers this excellent leadership."
            : comboRef.current > 1
              ? "Clean pickup. The captain's streak is building."
              : "Tennis ball aboard. Course maintained.";
        setMessage(phrase);
        pulse(lastHit === "supply" ? "cheese" : lastHit);
        captainTone(lastHit === "supply" ? "cheese" : lastHit);
        window.navigator.vibrate?.(lastHit === "cheese" ? [18, 24, 28] : 15);
      }

      if (bonusPoints) {
        setScore((current) => current + bonusPoints);
        if (closePasses) {
          setNearMisses((current) => current + closePasses);
          // Clean sailing helps recharge the next boost. Active boosts cannot
          // be refilled until they finish, preserving their six-second cap.
          if (!boostRef.current) setTurbo((current) =>
            Math.min(100, current + closePasses * YACHT_CLEAN_PASS_TURBO));
        }
        if (rivalPasses) setRivalsPassed((current) => current + rivalPasses);
        if (!scoreDelta && !lifeLoss) {
          setMessage(rivalPasses
            ? "Rival yacht overtaken. Rosie's regatta lead grows."
            : `CLEAN PASS: +${closePasses * YACHT_CLEAN_PASS_POINTS} points, +${closePasses * YACHT_CLEAN_PASS_TURBO} Turbo.`);
          if (closePasses) {
            pulse("ball");
            captainTone("ball");
          }
        }
      }

      if (lifeLoss) {
        if (hitRival) setRamImpact({
          lane: laneRef.current, id: itemIdRef.current += 1
        });
        setStreak(0);
        setCombo(1);
        livesRef.current = Math.max(0, livesRef.current - 1);
        setLives(livesRef.current);
        pulse("buoy");
        captainTone("buoy");
        if (livesRef.current === 0) {
          finishGame("The hull has had enough adventure. Captain Rosie is returning to port under protest.");
        } else {
          hullGraceRemainingRef.current = YACHT_IMPACT_GRACE_MS;
          setHullRecovering(true);
          setMessage(hitRival ? "RIVAL COLLISION. Temporary protective wake engaged."
            : "OBSTACLE STRIKE. Brief protective wake engaged - steer clear.");
          window.navigator.vibrate?.([55, 35, 55]);
        }
      }
    }, tickMs);

    return () => window.clearInterval(tick);
  }, [running, paused, phaseKey, chapter.id]);

  // --- Kuroi EPIC ARENA: input, tick, and event application. ---
  function readArenaInput() {
    const keys = arenaKeysRef.current;
    let x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    const pointer = arenaPointerRef.current;
    if (pointer) {
      const dx = pointer.x - arenaRef.current.rosie.x;
      const dy = pointer.y - arenaRef.current.rosie.y;
      const d = Math.hypot(dx, dy);
      if (d > 3) { x = dx / d; y = dy / d; } else { x = 0; y = 0; }
    }
    // Touch/pen arena input is the fixed joystick, sampled into a
    // unit-space vector by the animation-frame sampler. While the
    // stick is engaged it owns the movement vector (including its
    // dead-zone zero); the mouse pointer path above is untouched
    // when no stick is engaged.
    const stick = arenaStickNow();
    if (stick) {
      x = stick.x;
      y = stick.y;
    }
    let dash = arenaDashRef.current;
    arenaDashRef.current = false;
    // A touch dash carries its own direction for exactly one tick:
    // the stick's current vector, or Rosie's heading when a second
    // finger taps while the stick is centered / not engaged.
    const touchDash = arenaTouchDashRef.current;
    if (touchDash) {
      x = touchDash.x;
      y = touchDash.y;
      dash = true;
      arenaTouchDashRef.current = null;
    }
    return { x, y, dash };
  }

  function arenaPoint(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)),
      y: Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100))
    };
  }

  function isArenaTouchPointer(event) {
    return event.pointerType === "touch" || event.pointerType === "pen";
  }

  function queueArenaTouchDash(vector) {
    if (vector) {
      arenaTouchDashRef.current = { x: vector.x, y: vector.y };
      return;
    }
    // A second finger dashing while keys are held keeps the keyboard's
    // current direction, exactly like the DASH pill / Space path.
    const keys = arenaKeysRef.current;
    if (keys.left || keys.right || keys.up || keys.down) {
      arenaDashRef.current = true;
      return;
    }
    const headings = {
      up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
      left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
    };
    arenaTouchDashRef.current = headings[arenaRef.current.rosie.dir] || headings.down;
  }

  // Convert the stick's latest displacement into the unit-space input
  // vector (aspect-corrected through the arena rect) and park it
  // where the tick reads it; the knob is positioned imperatively so
  // sampling never re-renders.
  function sampleArenaStick() {
    const displacement = arenaJoystickInputRef.current?.displacement();
    const element = arenaTouchElementRef.current;
    if (!displacement || !element) {
      arenaStickVectorRef.current = null;
      return;
    }
    const vector = arenaJoystickVector(displacement.dx, displacement.dy,
      element.getBoundingClientRect());
    arenaStickVectorRef.current = vector;
    if (arenaJoystickKnobRef.current) {
      const knob = arenaJoystickKnobOffset(displacement.dx, displacement.dy);
      arenaJoystickKnobRef.current.style.transform =
        `translate(-50%, -50%) translate(${knob.x}px, ${knob.y}px)`;
    }
  }

  // Sample on animation frames, not only on pointermove delivery:
  // pointermove can arrive coalesced or late on mobile browsers, while
  // the stick's latest recorded displacement is already in the module —
  // the rAF loop turns it into a fresh vector at display rate so the
  // steering direction tracks the thumb between ticks.
  function startArenaTouchSampling() {
    stopArenaTouchSampling();
    const loop = () => {
      if (!arenaJoystickInputRef.current?.active) {
        arenaTouchRafRef.current = null;
        return;
      }
      sampleArenaStick();
      arenaTouchRafRef.current = window.requestAnimationFrame(loop);
    };
    arenaTouchRafRef.current = window.requestAnimationFrame(loop);
  }

  // The current joystick input for Rosie, or null when the stick is
  // not engaged. While engaged the vector is authoritative even at
  // zero (the dead zone) — the stick owns steering until release.
  function arenaStickNow() {
    if (!arenaJoystickInputRef.current?.active) return null;
    return arenaStickVectorRef.current || { x: 0, y: 0, magnitude: 0 };
  }

  function settleArenaStickEnd(result) {
    if (result.type !== "stick-ended") return;
    stopArenaTouchSampling();
    arenaStickVectorRef.current = null;
    resetArenaJoystickKnob();
  }

  function onArenaPointerDown(event) {
    if (isArenaTouchPointer(event)) {
      if (!running || paused) return;
      event.stopPropagation();
      // The first touch inside the arena reveals the touch controls
      // (coarse-pointer devices render them from the start); a mouse
      // player never triggers this branch and never sees them.
      setArenaTouchUi(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
      arenaTouchElementRef.current = event.currentTarget;
      const base = arenaJoystickRef.current;
      const inZone = arenaJoystickZoneContains(event.clientX, event.clientY,
        base ? base.getBoundingClientRect() : null);
      const result = arenaJoystickInputRef.current.pointerDown(
        event.pointerId, event.clientX, event.clientY, inZone);
      if (result.type === "stick") {
        sampleArenaStick();
        startArenaTouchSampling();
      } else if (result.type === "dash") {
        // A second finger dashes along the stick's current vector;
        // centered (or no direction yet) it falls back to held keys /
        // Rosie's heading, like the DASH pill.
        sampleArenaStick();
        const stick = arenaStickNow();
        queueArenaTouchDash(stick && stick.magnitude > 0
          ? { x: stick.x, y: stick.y } : null);
      }
      // "outside": a lone touch away from the stick does nothing —
      // no steering, no dash. The fixed stick is the only steering
      // surface under this model; the DASH pill is the tap dash.
      return;
    }
    if (!running || paused) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    arenaPointerRef.current = arenaPoint(event);
  }

  function onArenaPointerMove(event) {
    if (isArenaTouchPointer(event)) {
      const joystick = arenaJoystickInputRef.current;
      if (!joystick?.active && !joystick?.dashPointerIds.has(event.pointerId)) return;
      event.stopPropagation();
      joystick.pointerMove(event.pointerId, event.clientX, event.clientY);
      // The animation-frame sampler also refreshes the vector every
      // frame; this immediate sample keeps the newest displacement
      // from waiting on either it or the next tick.
      sampleArenaStick();
      return;
    }
    if (!arenaPointerRef.current) return;
    event.stopPropagation();
    arenaPointerRef.current = arenaPoint(event);
  }

  function onArenaPointerUp(event) {
    if (isArenaTouchPointer(event)) {
      event.stopPropagation();
      const result = arenaJoystickInputRef.current.pointerEnd(event.pointerId);
      settleArenaStickEnd(result);
      return;
    }
    event.stopPropagation();
    arenaPointerRef.current = null;
  }

  function onArenaPointerCancel(event) {
    if (isArenaTouchPointer(event)) {
      event.stopPropagation();
      const result = arenaJoystickInputRef.current.pointerEnd(event.pointerId);
      settleArenaStickEnd(result);
      return;
    }
    onArenaPointerUp(event);
  }

  function onArenaLostPointerCapture(event) {
    if (isArenaTouchPointer(event)) onArenaPointerCancel(event);
  }

  useEffect(() => {
    if (!isBoss) return undefined;
    const dirKeys = { arrowleft: "left", a: "left", arrowright: "right", d: "right",
      arrowup: "up", w: "up", arrowdown: "down", s: "down" };
    function onKeyUp(event) {
      const dir = dirKeys[event.key.toLowerCase()];
      if (dir) arenaKeysRef.current[dir] = false;
    }
    function onBlur() {
      arenaKeysRef.current = {};
      arenaPointerRef.current = null;
      clearArenaTouchInput();
    }
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [isBoss]);

  useEffect(() => {
    if (!running || paused || !isBoss) return undefined;
    // The arena machine is fully dt-based (arenaStep receives tickMs
    // and every speed is units/sec), so the tick rate only sets how
    // finely input is sampled and motion is stepped — never game
    // speed. Mobile used to tick at 84ms, a legacy coarse-tick
    // convention inherited from the lane loop, which sampled touch
    // input at ~12Hz and made touch steering feel unresponsive.
    // The arena is DOM sprites (the same loop desktop runs), so
    // mobile now ticks at the desktop 50ms.
    const tickMs = 50;
    const timer = window.setInterval(() => {
      if (finishedRef.current) return;
      const { state, events } = arenaStep(arenaRef.current, tickMs, readArenaInput());
      arenaRef.current = state;
      setArenaView(state);
      if (state.hull !== livesRef.current) {
        livesRef.current = state.hull;
        setLives(state.hull);
      }
      for (const event of events) {
        if (event.type === "windup") {
          // No banner, no shout (round 3): Kuroi's stopped, facing,
          // revving hull at the arena edge is the whole tell now.
          setMessage("Kuroi has stopped at the harbor's edge, turned on Rosie — watch his bow and MOVE!");
        } else if (event.type === "crash") {
          setScore((current) => current + (event.finale ? ARENA.finaleScore : ARENA.crashScore));
          setArenaCrashFx({ x: event.x, y: event.y, finale: event.finale,
            id: itemIdRef.current += 1 });
          // Animation round: the impact beat is a code-drawn starburst
          // at the wreck point (the round-5 boom system). The crash
          // cluster itself carries only splash foam — never a second
          // Kuroi figure: the dazed actor at the same point is the one
          // Kuroi on screen (the two-Kurois fix; see the render).
          setArenaBoomFx((current) => [...current.slice(-5), {
            id: itemIdRef.current += 1,
            x: event.x, y: event.y, kind: "crash"
          }]);
          pulse("cheese");
          captainTone("cheese");
          window.navigator.vibrate?.(event.finale ? [40, 40, 80] : 30);
          if (!event.finale) {
            const label = ARENA_FURNITURE.find((f) => f.kind === event.kind)?.label || "the harbor";
            setMessage(`Kuroi smashed into the ${label.toLowerCase()}! ${event.totalCrashes} of ${ARENA.totalCrashes} — one hull patched.`);
          }
        } else if (event.type === "ram") {
          pulse("buoy");
          captainTone("buoy");
          window.navigator.vibrate?.([55, 35, 55]);
          setMessage("KUROI RAMMED ROSIE — no crash. He peels away, stunned. The charge is spent.");
        } else if (event.type === "bomb-hit") {
          pulse("buoy");
          captainTone("buoy");
          window.navigator.vibrate?.([55, 35, 55]);
          setMessage("WATER-BOMB HIT! Kuroi's cannon found its mark — keep out of the rippling marks.");
        } else if (event.type === "bomb-boom" || event.type === "rocket-boom") {
          // Round 5: every weapon ends in a visible burst — the bomb
          // at its mark (hit or miss), the rocket where it lands.
          setArenaBoomFx((current) => [...current.slice(-5), {
            id: itemIdRef.current += 1,
            x: event.x, y: event.y,
            kind: event.type === "bomb-boom" ? "bomb" : "rocket"
          }]);
        } else if (event.type === "rocket-hit") {
          pulse("buoy");
          captainTone("buoy");
          window.navigator.vibrate?.([55, 35, 55]);
          setMessage("ROCKET HIT! A stray regatta rocket clipped Rosie — cross the rocket trails early.");
        } else if (event.type === "dash") {
          // Animation round: a dash leaves a wake burst at its origin —
          // an oriented foam streak from the round-5 boom system — so
          // the surge reads as motion, not a teleport. The streak runs
          // along Rosie's facing; the dash sprite's painted wake and
          // the dash speed itself carry the rest of the read.
          const dashAngle = { right: 0, down: 90, left: 180, up: 270 }[state.rosie.dir] ?? 0;
          setArenaBoomFx((current) => [...current.slice(-5), {
            id: itemIdRef.current += 1,
            x: event.x, y: event.y, kind: "dash", angle: dashAngle
          }]);
        } else if (event.type === "near-miss") {
          setScore((current) => current + ARENA.nearMissScore);
          setNearMisses((current) => current + 1);
        } else if (event.type === "barge") {
          // The one text overlay the arena keeps: the barge's arrival
          // gets a brief callout, then the screen is clear again.
          setBargeCallout("THE FIREWORKS BARGE!");
          setMessage("The fireworks barge is towed into the arena. Captain Rosie reaches for her laser pointer…");
        } else if (event.type === "laser") {
          setMessage("The laser dot dances on the barge — and Kuroi has seen it. He'll charge the dot: if you're in his path, DASH!");
        } else if (event.type === "eruption") {
          setMessage("Kuroi smashed into the fireworks barge — the sky is going up in gold and red!");
        } else if (event.type === "victory") {
          finishGame("Kuroi's fireworks barge went up in gold and red. The grand finale is won — Captain Rosie rules the regatta.", true);
        } else if (event.type === "defeat") {
          finishGame("The hull has had enough adventure. Captain Rosie is returning to port under protest.");
        }
      }
    }, tickMs);
    return () => window.clearInterval(timer);
  }, [running, paused, isBoss, chapterIndex]);

  useEffect(() => {
    function onKeyDown(event) {
      const yachtFrame = document.querySelector(".captain-fs-yacht");
      // The Captain page also mounts Tunnel and Cosmic Odyssey. A global
      // keyboard handler must never steal their arrows or Space/Turbo, but
      // it must not go dead the moment focus drifts to the page body: CAST
      // OFF unmounts its button, and a click outside the cabinet silently
      // killed steering. So only step aside for another game or an editable
      // control. Space/Enter still only starts a voyage from inside the
      // Yacht frame, or scrolling the page would launch Yacht.
      const otherGame = event.target?.closest?.(".captain-fs-tunnel, #cosmic-odyssey-arcade, .captain-fs-captain2");
      if (otherGame) return;
      if (event.target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      const inYachtFrame = yachtFrame?.contains(event.target);
      // A click on Tunnel's canvas does not move focus into the Tunnel
      // frame, so the target guard above cannot tell which game the player
      // is using: focus stays on the page body. The arcade backdrop already
      // tracks the game nearest the viewport middle — when the player has
      // scrolled to Tunnel or Cosmic, Yacht's keys step aside entirely.
      // Otherwise Space in Tunnel would resume a paused Yacht (or boost a
      // running one) while the player is digging.
      const focusedGame = document.querySelector(".captain-arcade-page-background")?.dataset?.focusedGame;
      if (focusedGame === "tunnel" || focusedGame === "cosmic") return;
      if (!running && !inYachtFrame) return;
      // Do not hijack native Enter / Space on selected chapter and result buttons.
      if (!running && (event.key === "Enter" || event.key === " ") &&
          event.target?.closest?.("button, a, [role='button']")) return;
      if ((event.key === "p" || event.key === "P") && running) {
        event.preventDefault();
        toggleYachtPause();
        return;
      }
      if (paused) {
        if ((event.key === " " || event.key === "Enter") && inYachtFrame &&
            !event.target?.closest?.("button, a, [role='button']")) {
          event.preventDefault();
          toggleYachtPause();
        }
        return;
      }
      // Kuroi EPIC ARENA: arrows/WASD are a free-sailing vector, not lanes,
      // and Space is the dash — the core dodge verb.
      if (isBoss && running) {
        const dirKeys = { arrowleft: "left", a: "left", arrowright: "right", d: "right",
          arrowup: "up", w: "up", arrowdown: "down", s: "down" };
        const dir = dirKeys[event.key.toLowerCase()];
        if (dir) {
          event.preventDefault();
          arenaKeysRef.current[dir] = true;
          return;
        }
        if (event.key === " " || event.code === "Space") {
          event.preventDefault();
          if (!event.repeat) arenaDashRef.current = true;
          return;
        }
      }
      // Direct lane keys give desktop and Tesla keyboard players the same
      // exact targeting as the clickable three-lane radar.
      if (running && /^[123]$/.test(event.key)) {
        event.preventDefault();
        if (!event.repeat) steerTo(Number(event.key) - 1);
        return;
      }
      if (event.key === "ArrowLeft" && running) {
        event.preventDefault();
        if (!event.repeat) moveCaptain(-1);
      }
      if (event.key === "ArrowRight" && running) {
        event.preventDefault();
        if (!event.repeat) moveCaptain(1);
      }
      if ((event.key === "ArrowUp" || event.key.toLowerCase() === "b") && running) {
        event.preventDefault();
        engageBoost();
      }
      if ((event.key === " " || event.key === "Enter") && !running) {
        event.preventDefault();
        startGame();
        return;
      }
      if ((event.key === " " || event.code === "Space") && running && inYachtFrame) {
        event.preventDefault();
        if (!event.repeat) engageBoost();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [running, paused, turbo, isBoss]);

  useEffect(() => {
    if (!paused) return undefined;
    // A paused Yacht leaves focus on its RESUME VOYAGE button; Space would
    // then natively click it even while the player is working in Tunnel.
    // Drop that focus the moment the player presses anywhere outside the
    // Yacht frame, so only a deliberate click inside it can resume.
    function onPointerDown(event) {
      const yachtFrame = document.querySelector(".captain-fs-yacht");
      if (!yachtFrame) return;
      if (event.target?.closest?.(".captain-fs-yacht")) return;
      const active = document.activeElement;
      if (active && yachtFrame.contains(active)) active.blur();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [paused]);

  useEffect(() => {
    if (!ended || !completed) return;
    setUnlockedChapter((current) => {
      const next = yachtNextUnlocked(current, chapterIndex);
      try { localStorage.setItem("yachtDashUnlockedChapter", String(next)); } catch {}
      return next;
    });
  }, [ended, completed, chapterIndex]);

  useEffect(() => {
    if (!ended) return;
    setChapterRecords((current) => updateYachtRecords(current, chapter.id, score, chapterMedals));
  }, [ended, score, chapter.id, chapterMedals]);

  useEffect(() => {
    try { localStorage.setItem("yachtDashRecordsV1", JSON.stringify(chapterRecords)); } catch {}
  }, [chapterRecords]);

  useEffect(() => {
    if (running || !ended) return;
    setBest((current) => Math.max(current, score));
  }, [running, ended, score]);

  useEffect(() => {
    try { localStorage.setItem("captainRosieBest", String(best)); } catch {}
  }, [best]);

  gamepadHandler.current=({pressed,x,y,previous,now})=>{
    const step=x&&x!==previous?.x?x:y&&y!==previous?.y?y:0;
    if(showVictoryArt){
      if(pressed.b)setShowVictoryArt(false);
      else if(pressed.a||pressed.start){
        if(ended&&completed&&chapterIndex+1<=yachtPlayableLimit(unlockedChapter))startGame(chapterIndex+1);
        else setShowVictoryArt(false);
      }
      return;
    }
    if(running){
      if(restartConfirm){if(pressed.a)startGame();else if(pressed.b||pressed.start)toggleYachtPause();return;}
      if(pressed.start||(paused&&pressed.a)){toggleYachtPause();return;}
      if(pressed.x){requestYachtRestart();return;}
      if(paused)return;
      const step=window.RosieGamepad.repeatAxis(gamepadLane.current,x,now);
      if(step)moveCaptain(step);
      if(pressed.a||pressed.rt)engageBoost();
      return;
    }
    if(ended){
      if(pressed.b){setEnded(false);setCompleted(false);setShowVictoryArt(false);return;}
      if(pressed.y&&completed){setShowVictoryArt(true);return;}
      if(pressed.a||pressed.start){if(completed&&chapterIndex+1<=yachtPlayableLimit(unlockedChapter))startGame(chapterIndex+1);else startGame();}
      else if(pressed.x)startGame();
      return;
    }
    if(step)setChapterIndex(index=>Math.max(0,Math.min(yachtPlayableLimit(unlockedChapter),index+step)));
    if(pressed.a||pressed.start)startGame();
  };
  useEffect(()=>window.RosieGamepad?.subscribe(gamepadRoot.current,frame=>gamepadHandler.current?.(frame),
    ()=>{gamepadLane.current={value:0,next:0};}),[]);

  const yachtActions = (<div className="yacht-console-actions" onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()}>
            <button className="ember-icon-action" type="button" onClick={toggleYachtPause} disabled={!running}
              aria-label={paused ? "Resume Yacht Dash" : "Pause Yacht Dash"} aria-pressed={paused}
              title={paused ? "Resume Yacht Dash" : "Pause Yacht Dash"}><img src="/yacht-console-v1/pause.webp" alt=""/><span>{paused ? "RESUME" : "PAUSE"}</span></button>
            <button className="ember-icon-action" type="button" onClick={requestYachtRestart}
              aria-label="Restart Yacht Dash" title="Restart Yacht Dash"><img src="/yacht-console-v1/retry.webp" alt=""/><span>RETRY</span></button>
          </div>);
  const mobileYachtActions = (<div className="captain-yacht-actions yacht-mobile-actions" onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()}>
            <button className="ember-icon-action" type="button" onClick={toggleYachtPause} disabled={!running}
              aria-label={paused ? "Resume Yacht Dash" : "Pause Yacht Dash"} aria-pressed={paused}
              title={paused ? "Resume Yacht Dash" : "Pause Yacht Dash"}><img src="/yacht-console-v1/pause.webp" alt=""/><span>{paused ? "RESUME" : "PAUSE"}</span></button>
            <button className="ember-icon-action" type="button" onClick={requestYachtRestart}
              aria-label="Restart Yacht Dash" title="Restart Yacht Dash"><img src="/yacht-console-v1/retry.webp" alt=""/><span>RETRY</span></button>
          </div>);
  const helmControls = (<div className={"captain-command-deck"+(steerMode==="joystick"?" has-axis-joystick":"")}
          onContextMenu={(event) => event.preventDefault()}
          onSelectStart={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}>
          {steerMode==="joystick" ? <AxisJoystick axis="horizontal" onDirection={moveCaptain} disabled={!running||paused} label="Yacht helm" repeatDelayMs={320} /> :
          <button type="button" className="helm-button" onClick={() => moveCaptain(-1)} disabled={!running||paused} aria-label="Steer port">
            <img src="/yacht-console-v1/steer.webp" alt=""/><small>PORT</small>
          </button>}

          <button
            type="button"
            className={"boost-control" + (turbo >= 100 ? " boost-ready" : "") + (boost ? " boost-active" : "")}
            style={{ "--turbo-fill": turbo + "%" }}
            onClick={engageBoost}
            disabled={!running || turbo < 100 || boost}
            aria-label={"Treat Turbo boost " + turbo + " percent charged"}
          >
            <img className="yacht-turbo-button-art" src="/yacht-console-v2/treat-turbo.webp" alt=""/>
            <span className="boost-copy">
              <strong>TREAT TURBO</strong>
              <b className="yacht-turbo-charge">{Math.round(turbo)}%</b>
              <span className="yacht-turbo-meter" aria-hidden="true"><i /></span>
              <small>{boost ? "DOUBLE SCORE ACTIVE" : turbo >= 100 ? "TAP FOR DOUBLE POINTS" : "COLLECT TREATS TO CHARGE"}</small>
            </span>
          </button>

          {steerMode==="buttons" && <button type="button" className="helm-button"
            onClick={() => moveCaptain(1)} disabled={!running||paused} aria-label="Steer starboard">
            <img className="yacht-steer-right" src="/yacht-console-v1/steer.webp" alt=""/><small>STARBOARD</small>
          </button>}
        </div>);
  const steeringOptions = (<div className="yacht-steering-options" role="group" aria-label="Yacht Dash steering and upcoming hazards">
          <div className={"yacht-lane-forecast" + (threatForecast ? " has-threat" : "")}
            role="group" aria-label="Select lane. Red indicates a coming hazard.">
            {[0, 1, 2].map(index => {
              const blocked = Boolean(threatForecast?.blocked.includes(index));
              const name = ["port", "center", "starboard"][index];
              return <button key={index} type="button"
                className={(blocked ? " is-blocked" : "") +
                  (lane === index ? " is-current" : "")}
                aria-label={`Steer to ${name} lane${blocked ? " - hazard ahead" : ""}`}
                aria-pressed={lane === index}
                disabled={!running || paused}
                onClick={() => steerTo(index)}>
                  {["P", "C", "S"][index]}
                </button>;
            })}
          </div>
          <button type="button" className="captain-steering-toggle"
            aria-label={steerMode === "joystick" ? "Switch to D-pad steering" : "Switch to joystick steering"}
            title={steerMode === "joystick" ? "Use D-pad" : "Use joystick"}
            onClick={toggleSteerMode}>{steerMode === "joystick" ? "D-PAD" : "JOYSTICK"}</button>
        </div>);
  return (
    <main ref={gamepadRoot} className={"captain-game-page yacht-console-upgrade captain-phase-" + phaseKey + (boost ? " captain-boosting" : "") + (paused ? " is-paused" : "") + (isBoss ? " captain-arena-chapter" : "")}>
      <section className="captain-hero">
        <div className="captain-hero-banner" role="img" aria-label="Captain Rosie at the helm of an ornate Japanese sailing ship at sunset, with islands, torii gates and waterfalls" />
        <div className="captain-title">
          <div className="captain-title-plaque">
            <span className="captain-kicker">THE HOUSE OF ROSIE · RIVIERA YACHT CLUB</span>
            <div className="captain-marquee">
              <RosiePawCrest className="marquee-crest" />
              <div>
                <h1>CAPTAIN ROSIE</h1>
                <p>Yacht Dash</p>
              </div>
              <span className="marquee-burgee">R</span>
            </div>
            <small>Command The Ikigai through a luminous coastal passage - collect prized cargo, secure the Golden Cheese and bring the captain home in style.</small>
          </div>
        </div>
        <div className="captain-best">
          <span>CAPTAIN'S RECORD</span>
          <strong>{Math.max(best, score)}</strong>
          <small>BEST VOYAGE</small>
        </div>
        <div className="captain-hero-compass" aria-hidden="true">
          <span>N</span><i>◇</i>
        </div>
      </section>

      <section className="captain-route-strip" aria-label="Voyage progress">
        <div className="route-port"><b>⚓</b><span>PORT ROSIE</span></div>
        <div className="route-line">
          <div className="route-progress" style={{ width: routeProgress + "%" }} />
          <i className="route-yacht" style={{ left: routeProgress + "%" }}>◆</i>
        </div>
        <div className="route-port route-destination"><b><RosiePawCrest className="route-paw-crest" /></b><span>{chapter.destination}</span></div>
      </section>

      <section className="captain-hud" aria-label="Yacht game status">
        <div><img className="yacht-instrument" src="/yacht-console-v1/score.webp" alt=""/><span>SCORE</span><strong>{score.toLocaleString()}</strong></div>
        <div><img className="yacht-instrument" src="/yacht-console-v1/time.webp" alt=""/><span>TIME</span><strong>{isBoss ? Math.floor(bossElapsed) : Math.ceil(timeLeft)}<small>s</small></strong></div>
        <div><img className="yacht-instrument" src="/yacht-console-v1/hull.webp" alt=""/><span>HULL</span><strong className="captain-lives" aria-label={`${lives} of 3 hull remaining`}>{lives}<small>/3</small><i className="yacht-hull-meter" aria-hidden="true">{[0,1,2].map(n=><b key={n} className={n<lives?"intact":""}/>)}</i></strong></div>
        {isBoss && <div><span>PHASE {arenaView.phase + 1} · KUROI</span><strong className="captain-lives">{Array.from({ length: arenaPhaseGoal(arenaView.phase) }, (_, index) => index < (arenaView.phase === 2 ? arenaView.crashesInPhase + (arenaView.status === "eruption" || arenaView.status === "won" ? 1 : 0) : arenaView.crashesInPhase) ? "●" : "○").join(" ")}</strong></div>}
        <div><img className="yacht-instrument" src="/yacht-console-v1/cargo.webp" alt=""/><span>CARGO</span><strong>{collectedTotal}</strong></div>
        <div className={"combo-cell" + (combo > 1 ? " is-hot" : "")}><img className="yacht-instrument" src="/yacht-console-v1/multiplier.svg" alt=""/><span>MULTIPLIER</span><strong>×{combo}{boost ? " ×2" : ""}</strong></div>
      </section>

      {wideConsole ? yachtActions : mobileYachtActions}

        <div className="gamepad-hint">LEFT STICK / D-PAD STEER · A BOOST · START PAUSE · X RETRY</div>
      {wideConsole && !isBoss && helmControls}

{!running && !ended && (
        <section className="yacht-level-select" aria-label="Choose a Yacht Dash level">
          <span>CHOOSE YOUR VOYAGE · {chapter.name}</span>
          <div className="yacht-chapter-picker" role="group" aria-label="Select Yacht Dash level">
            {YACHT_CHAPTERS.map((choice, index) => (
              <button key={choice.id} type="button"
                className={index === chapterIndex ? "is-selected" : ""}
                aria-pressed={index === chapterIndex}
                disabled={!YACHT_PLAYTEST_ALL_LEVELS && index > unlockedChapter}
                onClick={() => selectChapter(index)}>
                <b><span className="yc-num">{index + 1}</span><span className="yc-name">. {choice.name}</span></b>
                {choice.mode === "boss" && <small className="yacht-boss-badge">★ BOSS FINALE</small>}
                {!YACHT_PLAYTEST_ALL_LEVELS && index > unlockedChapter ? <small>LOCKED</small> :
                  <small className="yacht-stage-record">
                    {chapterRecords[choice.id]?.best
                      ? "BEST " + chapterRecords[choice.id].best.toLocaleString() + " · " + "★".repeat(chapterRecords[choice.id].medals || 0)
                      : "READY"}
                  </small>}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="yacht-game-shell">
        <div className="yacht-game-sign">
          <span className="captain-seal"><RosiePawCrest className="game-sign-paw" /></span>
          <div>
            <strong>{chapter.name.toUpperCase()} · {phase.name.toUpperCase()}</strong>
            <small>{message}</small>
          </div>
          {wideConsole && !isBoss && steeringOptions}
        </div>
        <div className="yacht-voyage-progress" role="progressbar"
          aria-label={chapter.name + " voyage progress"}
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={routeProgress}>
          <div className="yacht-voyage-progress-track">
            <div className="yacht-voyage-progress-fill" style={{ width: routeProgress + "%" }} />
            <div className="yacht-voyage-progress-marks" aria-hidden="true"><i /><i /><i /><i /></div>
          </div>
          <small>{isBoss ? `CRASH ${arenaView.totalCrashes}/${ARENA.totalCrashes}` : `SCENE ${levelNumber + 1}/5`}</small>
        </div>
        {isBoss ? (
        <div className="yacht-steering-options yacht-arena-controls" role="group" aria-label="Arena controls">
          <span>ARENA HELM</span>
          <p className="yacht-arena-hint">STEER — ARROW KEYS · WASD · DRAG&nbsp;&nbsp;|&nbsp;&nbsp;DASH — SPACE</p>
        </div>
        ) : (
          !wideConsole && steeringOptions
        )}

        <div
          ref={courseFocusRef}
          tabIndex={-1}
          className={`yacht-course${running && !paused ? " is-underway" : ""}${boost ? " is-boosting" : ""}`}
          data-captain-level={level.id}
          data-captain-chapter={chapter.id}
          data-captain-climate={level.climate}
          data-captain-passage={levelNumber + 1}
          style={{ "--course-pace": boost ? "1.25s" : running ? "3.1s" : "8s" }}
          aria-label="Three-lane yacht course. Swipe, tap a lane, or use the controls below to steer."
          onPointerDown={onCoursePointerDown}
          onPointerUp={onCoursePointerUp}
          onPointerCancel={() => { touchStartRef.current = null; }}
          onLostPointerCapture={() => { touchStartRef.current = null; }}
        >
          {!isBoss && <CaptainScenicPainting scene={scenery} />}
          {!isBoss && <CaptainCinematicEnvironment
            underway={running && !paused}
            boost={boost}
            streak={streak}
            timeLeft={timeLeft}
            ended={ended}
            eventPulse={eventPulse}
            eventKind={eventKind}
          />}
          {!isBoss && <CaptainLevelScenery scene={scenery} underway={running && !paused} boost={boost} />}
          {!isBoss && <CaptainLotusGust underway={running && !paused} />}
          {!isBoss && <CaptainCourseMotion phaseKey={phaseKey} underway={running && !paused} boost={boost} />}
          {isBoss && (() => {
            const view = arenaView;
            const k = view.kuroi;
            const r = view.rosie;
            const winding = k.mode === "windup";
            const locking = k.mode === "laserLock";
            const charging = k.mode === "charge" || k.mode === "finaleCharge";
            const showFurniture = (winding || charging) && k.furniture;
            const laserOn = Boolean(view.laser) && (locking || k.mode === "finaleCharge");
            const kuroiFacing = arenaFacing(Math.cos(k.heading), Math.sin(k.heading), "down");
            const volleyRecent = view.elapsedMs - view.lastVolleyAtMs < 900;
            let kuroiSprite = ARENA_SPRITES.kuroi.down;
            let kuroiFlip = false;
            if (k.mode === "dazed") kuroiSprite = ARENA_SPRITES.kuroi.dazed;
            // The firing sprite belongs to the patrol only. Phase 3
            // spawns its volley AS the windup begins, so letting it win
            // during the windup masked his turned bow — the whole tell —
            // for ~900 of the 945ms windup (round 4). While he winds up
            // (and while he stares at the laser dot) the sprite chosen
            // from his heading is what the player reads.
            else if (volleyRecent && k.mode === "circle") kuroiSprite = ARENA_SPRITES.kuroi.firing;
            else if (kuroiFacing === "up") kuroiSprite = ARENA_SPRITES.kuroi.up;
            else if (kuroiFacing === "left") { kuroiSprite = ARENA_SPRITES.kuroi.side; kuroiFlip = true; }
            else if (kuroiFacing === "right") kuroiSprite = ARENA_SPRITES.kuroi.side;
            const rosieSprite = view.status === "won" ? ARENA_SPRITES.rosie.triumphant
              : r.dashing ? ARENA_SPRITES.rosie.dash
              : r.hitAtMs >= 0 && view.elapsedMs - r.hitAtMs < 900 ? ARENA_SPRITES.rosie.braced
              : r.nearMissAtMs >= 0 && view.elapsedMs - r.nearMissAtMs < 900 ? ARENA_SPRITES.rosie.startled
              : ARENA_SPRITES.rosie[r.dir] || ARENA_SPRITES.rosie.down;
            const rosieInvuln = view.status === "fighting" && view.elapsedMs < r.invulnUntilMs;
            return (
              <div className={"yacht-arena" + (arenaTouchUi ? " has-touch-controls" : "")}
                role="application"
                aria-label="Kuroi arena. Steer Rosie with the arrow keys, WASD, or by dragging. Press Space to dash."
                onPointerDown={onArenaPointerDown} onPointerMove={onArenaPointerMove}
                onPointerUp={onArenaPointerUp} onPointerCancel={onArenaPointerCancel}
                onLostPointerCapture={onArenaLostPointerCapture}>
                <img className="yacht-arena-bg" src={ARENA_BACKGROUNDS[arenaBackgroundIndex(view)]}
                  alt="" draggable="false" />
                <svg className="yacht-arena-tells" viewBox="0 0 100 100"
                  preserveAspectRatio="none" aria-hidden="true">
                  {/* Round 3: no charge line is ever drawn — Kuroi's
                      stopped, facing, revving hull is the tell. What
                      remains in this layer is deliberately understated:
                      a soft ripple where a water-bomb will fall and a
                      faint dashed thread along a rocket's path. (The
                      laser lives in its own layer above the barge —
                      see below.) */}
                  {view.weapons.map((w) => w.kind === "bomb" && w.state === "armed" ? (
                    <circle key={w.id} cx={w.x} cy={w.y} r={ARENA.bombRadius}
                      vectorEffect="non-scaling-stroke" className="arena-bomb-ripple" />
                  ) : w.kind === "rocket" && w.state === "warn" ? (() => {
                    // Round 5 (Mitchell): the rocket gets more warning
                    // (1300ms in the machine) and its dashed thread
                    // swells in presence over the final third of the
                    // warning — still a whisper, but a growing one.
                    const warnFrac = Math.max(0, Math.min(1,
                      1 - (w.warnUntilMs - view.elapsedMs) / ARENA.rocketWarnMs));
                    const presence = warnFrac < 2 / 3 ? 0.55
                      : 0.55 + (warnFrac - 2 / 3) * 3 * 0.45;
                    return (
                      <line key={w.id} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                        vectorEffect="non-scaling-stroke" className="arena-rocket-line"
                        style={{ opacity: presence }} />
                    );
                  })() : null)}
                </svg>
                {view.barge && <img className="yacht-arena-barge" src={ARENA_SPRITES.barge}
                  alt="The fireworks barge" draggable="false"
                  style={{ left: view.barge.x + "%", top: view.barge.y + "%" }} />}
                {view.barge && <img className="yacht-arena-left-audience" src={ARENA_BACKGROUNDS[arenaBackgroundIndex(view)]}
                  alt="" aria-hidden="true" draggable="false" />}
                {showFurniture && k.furniture.kind !== "barge" && (
                  <img className="yacht-arena-furniture" src={k.furniture.asset}
                    alt={k.furniture.label} draggable="false"
                    style={{ left: k.furniture.x + "%", top: k.furniture.y + "%" }} />)}
                {view.weapons.map((w) => w.kind === "bomb" ? (() => {
                  // Round 5 (Mitchell): the bomb is LAUNCHED, not
                  // conjured — a visible projectile arcs from Kuroi's
                  // position at fire time to the mark across the fuse,
                  // and the swelling shadow at the mark is its landing
                  // read. The two agree: where the shadow completes,
                  // the arc comes down.
                  const fall = Math.max(0, Math.min(1,
                    1 - (w.fuseAtMs - view.elapsedMs) / ARENA.bombFuseMs));
                  const hasArc = w.state === "armed" && typeof w.fromX === "number";
                  const arcX = hasArc ? w.fromX + (w.x - w.fromX) * fall : w.x;
                  const arcY = hasArc ? w.fromY + (w.y - w.fromY) * fall -
                    Math.sin(fall * Math.PI) * 11 : w.y;
                  return (
                    <Fragment key={w.id}>
                      {w.state === "armed" && (
                        <div className="yacht-arena-bomb-shadow" aria-hidden="true"
                          style={{ left: w.x + "%", top: w.y + "%",
                            transform: `translate(-50%, -50%) scale(${0.45 + fall * 0.6})`,
                            opacity: 0.35 + fall * 0.65 }} />
                      )}
                      <img className={"yacht-arena-bomb" + (w.state === "boom" ? " is-boom" : "")}
                        src={ARENA_SPRITES.waterbomb} alt="" draggable="false"
                        style={{ left: arcX + "%", top: arcY + "%" }} />
                    </Fragment>
                  );
                })() : w.kind === "rocket" && w.state === "fly" ? (
                  <img key={w.id} className="yacht-arena-rocket" src={ARENA_SPRITES.rocket}
                    alt="" draggable="false"
                    style={{ left: (w.x1 + w.ux * w.progress) + "%",
                      top: (w.y1 + w.uy * w.progress) + "%",
                      transform: `translate(-50%, -50%) rotate(${Math.atan2(w.uy, w.ux) * 180 / Math.PI + 45}deg)` }} />
                ) : null)}
                {(winding || locking) && (
                  <div className="yacht-arena-wake-cue" aria-hidden="true"
                    style={{ left: k.x + "%", top: k.y + "%" }} />
                )}
                {/* Animation round: both actor imgs are keyed by their
                    sprite, so a facing/pose swap remounts the img and
                    replays the CSS turn settle — a swap reads as a
                    small turn, not a cut. While Kuroi winds up, the
                    --revx/--revy vars aim the rev keyframes' backward
                    rock opposite his locked charge direction (the
                    flipped set's translate is mirrored by its
                    scaleX(-1), so the x var is pre-negated for it). */}
                <img key={kuroiSprite} className={"yacht-arena-actor yacht-arena-kuroi" + (k.mode === "dazed" ? " is-dazed" : "") + ((winding || locking) ? " is-winding" + (kuroiFlip ? " is-flipped" : "") : "")}
                  src={kuroiSprite} alt="Kuroi" draggable="false"
                  style={{ left: k.x + "%", top: k.y + "%",
                    ...arenaSpriteNormStyle(kuroiSprite),
                    ...(winding ? {
                      "--revx": `${(kuroiFlip ? 1 : -1) * (k.chargeDirX || 0) * 1.6}%`,
                      "--revy": `${-(k.chargeDirY || 0) * 1.6}%`
                    } : {}),
                    transform: `translate(-50%, -50%)${kuroiFlip ? " scaleX(-1)" : ""}` }} />
                <img key={rosieSprite} className={"yacht-arena-actor yacht-arena-rosie" +
                    (rosieInvuln ? " is-invuln" : "") + (r.dashing ? " is-dashing" : "")}
                  src={rosieSprite} alt="Captain Rosie" draggable="false"
                  style={{ left: r.x + "%", top: r.y + "%",
                    ...arenaSpriteNormStyle(rosieSprite) }} />
                {/* The laser gets its own layer ABOVE the barge and the
                    actors (round 4): the dot dances ON the barge, so in
                    the old z-4 tells layer the barge's own hull (z-5)
                    painted over it and the finale's centerpiece never
                    read on screen. */}
                {laserOn && (
                  <svg className="yacht-arena-laser" viewBox="0 0 100 100"
                    preserveAspectRatio="none" aria-hidden="true">
                    <line x1={r.x} y1={r.y} x2={view.laser.x} y2={view.laser.y}
                      vectorEffect="non-scaling-stroke" className="arena-laser-beam" />
                    <circle cx={view.laser.x} cy={view.laser.y} r={3.4}
                      className="arena-laser-dot-halo" />
                    <circle cx={view.laser.x} cy={view.laser.y} r={1.3}
                      vectorEffect="non-scaling-stroke" className="arena-laser-dot" />
                  </svg>
                )}
                {arenaCrashFx && (
                  <div className="yacht-arena-crashfx" key={arenaCrashFx.id} aria-hidden="true"
                    style={{ left: arenaCrashFx.x + "%", top: arenaCrashFx.y + "%" }}>
                    {/* SINGLE-RENDER GUARANTEE (animation round): this
                        cluster is splash foam ONLY. It used to also
                        carry the recoil painting — which is byte-
                        identical to the actor's dazed sprite — while
                        resolveCrash parks the dazed actor at this exact
                        point, so every crash showed two Kurois. The
                        actor is the only Kuroi figure in the arena,
                        ever; the impact beat is the boom starburst the
                        crash event fires alongside this foam. */}
                    <img className="yacht-kuroi-impact-foam" src="/yacht-dash/kuroi/kuroi-collision-splash.webp" alt="" />
                  </div>
                )}
                {/* Round 5: code-drawn weapon bursts — a flash, a
                    shockwave ring and spray droplets where a bomb
                    detonates or a rocket lands. Fed by machine events
                    (bomb-boom / rocket-boom), pruned on a short clock. */}
                {arenaBoomFx.map((fx) => (
                  <div key={fx.id} className={"yacht-arena-boom is-" + fx.kind}
                    aria-hidden="true"
                    style={{ left: fx.x + "%", top: fx.y + "%",
                      ...(typeof fx.angle === "number"
                        ? { transform: `translate(-50%, -50%) rotate(${fx.angle}deg)` } : {}) }}>
                    <span className="boom-flash" />
                    <span className="boom-ring" />
                    {Array.from({ length: 8 }, (_, i) => (
                      <i key={i} style={{
                        "--a": `${i * 45 + (fx.id % 3) * 13}deg`,
                        "--d": `${30 + (i % 3) * 12}px`
                      }} />
                    ))}
                  </div>
                ))}
                <KuroiFireworksCanvas active={view.status === "eruption"} durationMs={ARENA.eruptionMs} />
                {bargeCallout && view.status === "fighting" &&
                  <div className="yacht-arena-barge-callout" role="status">{bargeCallout}</div>}
                {/* The bottom elements of the arena (round 3, touch
                    rounds): the ONE dash control — a generated brass
                    plaque asset (touch-tuning round; the word DASH is
                    lettered in the artwork, with wake curls — no
                    keyboard reference anywhere) — and, for touch
                    players only, the fixed joystick in the bottom-right
                    with the plaque raised directly above it. The
                    helm-hint overlay text is gone; steering is learned
                    from the start panel and play itself. Desktop still
                    dashes on Space — that is input, not a button. */}
                <button type="button" className="yacht-arena-dash-button yacht-arena-dash-overlay"
                  disabled={!running || paused}
                  onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); arenaDashRef.current = true; }}
                  onPointerUp={(event) => event.stopPropagation()}
                  aria-label="Dash">
                  <img className="yacht-arena-dash-art"
                    src="/yacht-dash/kuroi-arena/ui-dash-plaque.webp"
                    alt="" draggable="false" />
                </button>
                {arenaTouchUi && (
                  <div ref={arenaJoystickRef} className="yacht-arena-joystick" aria-hidden="true">
                    <div ref={arenaJoystickKnobRef} className="yacht-arena-joystick-knob" />
                  </div>
                )}
              </div>
            );
          })()}
          {/* Obstacle warnings remain in the helm's lane forecast above.
              The old in-water red bars mimicked invisible hazards. */}

          {paused && (
            <div className="captain-yacht-pause-overlay">
              <CaptainPauseMenu theme="yacht" game="YACHT DASH"
                title={restartConfirm ? "RETRY VOYAGE?" : "VOYAGE PAUSED"}
                onPlay={toggleYachtPause} onRetry={() => startGame()}
                onLevels={returnYachtToLevels} />
            </div>
          )}
          {!isBoss && <div className="sun-glint" aria-hidden="true" />}
          {!isBoss && <div className="water-depth-bands" aria-hidden="true"><i /><i /><i /><i /></div>}
          {!isBoss && <div className="wake-lines" aria-hidden="true" />}
          {!isBoss && <div className="lane-line lane-line-a" aria-hidden="true" />}
          {!isBoss && <div className="lane-line lane-line-b" aria-hidden="true" />}
          {!isBoss && <div className="sea-sparkles" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i />
          </div>}

          {/* The course banner pill is lane-chapter furniture. The boss
              arena carries NO text overlay during play (round 3): no
              phase heading, no event line — the CRASH progress bar above
              the arena and the HUD carry the state, and the single
              exception is the barge callout inside the arena itself. */}
          {!isBoss && (
          <div className="captain-course-banner">
            <span>SCENE {levelNumber + 1} OF 5 · {chapter.name.toUpperCase()}</span>
            <strong>{level.name}</strong>
          </div>
          )}

          {phaseNotice && <div className="captain-phase-notice">{phaseNotice}</div>}
           {!isBoss && items.map((item) => {
            const approaching = chapter.id !== "sakura";
            const floatingPickup = ["ball", "treat", "cheese", "supply"].includes(item.kind);
            const arch = approaching && item.footprint === "arch";
            const perspective = approaching
              ? (floatingPickup ? yachtPickupApproachAt(item.y) : yachtApproachAt(item.y))
              : null;
            const artScale = yachtAssetScale(item.asset);
            // Raster at the final displayed pixel size, not at the small
            // base box size before a large compositor transform.
            const nativeResArt = item.kind === "rival" ||
              ["fan-raft.webp", "moonlight-race-buoy.webp", "regatta-beacon.webp"]
                .some(name => item.asset?.endsWith("/" + name));
            const visualScale = nativeResArt ? 1 : artScale;
            const incomingAttackLane = item.kind === "rival" && !item.drifted
              ? item.boss && item.driftTo !== undefined
                ? item.driftTo : yachtRivalAttackLane(item.lane, laneRef.current) : item.driftTo;
            const center = item.footprint === "arch" ? 50 :
              item.footprint === "wide" ? (item.lane + 1) * 33.333 :
                16.666 + item.lane * 33.333;
            const renderedStyle = approaching ? {
              left: center + "%",
              top: arch ? "0%" : perspective.top + "%",
              "--approach-top": perspective.top + "%",
              ...(item.footprint === "arch" ? { width: "96%" } :
                item.footprint === "wide" ? { width: "66.666%" } : {}),
              "--yacht-asset-multiplier": artScale,
              "--approach-scale": perspective.scale * visualScale *
                (item.footprint === "wide" ? 0.89 : item.footprint === "arch" ? 0.97 : 1),
              // Equal depth scaling in both axes preserves the original art.
              "--approach-scale-x": perspective.scale * visualScale *
                (item.footprint === "wide" ? 0.89 : item.footprint === "arch" ? 0.97 : 1),
              "--approach-opacity": perspective.opacity
            } : { left: floatingPickup ? center + "%" : "calc(" + center + "% - 23px)", top: item.y + "%" };
            return (
              <div
                className={"sea-pickup sea-pickup-" + item.kind +
                  (item.footprint ? " yacht-footprint-" + item.footprint : "") +
                  (approaching ? " yacht-upstream-object" : "") +
                  (arch ? " yacht-smooth-arch" : "") +
                  (floatingPickup ? " yacht-floating-pickup" : "") +
                  (nativeResArt ? " yacht-native-resolution" : "")}
                key={item.id}
                style={renderedStyle}
                data-yacht-art={item.asset?.split("/").pop()?.replace(".webp", "")}
                aria-label={item.label}
              >
                {arch ? <div className="yacht-arch-art"><YachtHazardArt item={item} /></div> :
                  item.kind === "cheese" ? <YachtGoldenCheeseIcon /> : item.asset
                  ? <YachtHazardArt item={item} /> : <CaptainPickupIcon kind={item.kind} />}
                {item.kind === "supply" && <small className="yacht-supply-caption">SUPPLIES</small>}
                {incomingAttackLane !== undefined && incomingAttackLane !== item.lane && !item.drifted &&
                  <span className="yacht-drift-warning" aria-hidden="true">{incomingAttackLane > item.lane ? "→" : "←"}</span>}
              </div>
            );
          })}

          {!isBoss && eventPulse > 0 && (
            <div className={"captain-burst burst-" + eventKind} key={eventPulse} aria-hidden="true">
              <i>✦</i><i>·</i><i>✦</i><i>·</i><i>✦</i><i>·</i>
            </div>
          )}

          {!isBoss && <div className={"captain-yacht lane-" + lane + (boost ? " yacht-boost" : "") +
            (hullRecovering ? " yacht-hull-recovering" : "") +
            (ramImpact ? " yacht-kuroi-rammed" : "")}>
            <CaptainYachtArt boost={boost} />
          </div>}
          {!isBoss && ramImpact && (
            <div className={"yacht-kuroi-collision yacht-kuroi-collision-lane-" + ramImpact.lane}
              key={ramImpact.id} aria-hidden="true">
              <img className="yacht-kuroi-hit-yacht" src="/yacht-dash/kuroi/kuroi-impact.webp" alt="" />
              <img className="yacht-kuroi-impact-foam" src="/yacht-dash/kuroi/kuroi-collision-splash.webp" alt="" />
              <img className="yacht-kuroi-recoil" src="/yacht-dash/kuroi/kuroi-recoil.webp" alt="" />
            </div>
          )}
          {!running && (
            <div className={"captain-start-panel" + (ended ? " captain-results-panel" : "")}>
              <CaptainRosieIllustration className="start-panel-rosie" idPrefix="startRosie" />
              {ended ? (
                <>
                  <span>{completed ? "CAPTAIN'S LOG · VOYAGE COMPLETE" : "CAPTAIN'S LOG · RETURNED TO PORT"}</span>
                  <div className="voyage-grade">{completed ? rank.mark : "⚓"}</div>
                  <strong>{completed ? rank.title : "Passage Interrupted"}</strong>
                  <p>{completed ? rank.copy : message}</p>
                  <div className="yacht-medal-stars" aria-label={chapterMedals + " of 3 passage medals earned"}>
                    {Array.from({ length: 3 }, (_, index) =>
                      <span key={index} className={index < chapterMedals ? "is-awarded" : ""}>★</span>)}
                  </div>
                  <p className="yacht-objective-summary">
                    {yachtNextMedalHint(chapter.id,
                      { completed, score, lives, nearMisses, rivalsPassed })}
                  </p>
                  <div className="voyage-stats">
                    <span><b>{score}</b> score</span>
                    <span><b>{bestStreak}</b> best streak</span>
                    <span><b>{collectedTotal}</b> cargo collected</span>
                    <span><b>{cheeses}</b> Golden Cheese</span>
                    <span><b>{nearMisses}</b> near misses</span>
                    <span><b>{rivalsPassed}</b> rival yachts passed</span>
                    {isBoss && <span><b>{arenaView.totalCrashes}/{ARENA.totalCrashes}</b> Kuroi crashes</span>}
                    {chapter.id !== "sakura" && !isBoss && <span><b>{suppliesCollected}/1</b> supply chest</span>}
                  </div>
                  <div className="yacht-result-actions">
                    {completed && chapterIndex < YACHT_CHAPTERS.length - 1 &&
                      (YACHT_PLAYTEST_ALL_LEVELS || unlockedChapter >= chapterIndex + 1) && <button type="button"
                        onClick={() => startGame(chapterIndex + 1)}>NEXT LEVEL</button>}
                    <button type="button" onClick={() => startGame()}>SAIL AGAIN</button>
                    <button type="button" onClick={() => { setShowVictoryArt(false); selectChapter(chapterIndex); }}>CHOOSE LEVEL</button>
                  </div>
                </>
              ) : (
                <>
                  <span>CAPTAIN ROSIE AWAITS YOUR ORDERS</span>
                  <strong>{chapter.name}</strong>
                  <p>{chapter.description}</p>
                  <small className="yacht-chapter-goal">{YACHT_CHAPTER_GOALS[chapter.id].preview}</small>
                  <div className="yacht-select-actions">
                    <button type="button" className="yacht-cast-off" onClick={() => startGame()}>CAST OFF</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {!running && showVictoryArt && createPortal(
          <div className="yacht-victory-overlay" role="dialog" aria-modal="true"
            aria-label={chapter.name + " victory artwork"}>
            <div className="yacht-victory-backdrop" aria-hidden="true"
              style={{ backgroundImage: `url("${chapter.victory}")` }} />
            <div className="yacht-victory-content">
              <img className="yacht-victory-art" src={chapter.victory}
                alt={chapter.name + " victory - Captain Rosie receives her award"}
                onError={() => setShowVictoryArt(false)} />
              <div className="yacht-victory-actions">
                <button type="button" onClick={() => setShowVictoryArt(false)}>
                  {ended ? "VIEW CAPTAIN'S LOG" : "BACK TO LEVELS"}
                </button>
                {chapterIndex < YACHT_CHAPTERS.length - 1 &&
                  (YACHT_PLAYTEST_ALL_LEVELS || unlockedChapter >= chapterIndex + 1) &&
                  <button type="button" onClick={() => startGame(chapterIndex + 1)}>NEXT LEVEL</button>}
              </div>
            </div>
          </div>,
          document.fullscreenElement?.classList?.contains("captain-fs-yacht")
            ? document.fullscreenElement : document.body
        )}

        {/* Kuroi finale cinematic: mounted only by a boss win, after
            the full fireworks eruption ends. Autoplays (muted inline
            first-frame fallback is unnecessary — it carries sound and
            the win gesture chain started the game fullscreen), fills
            the screen, and its end (or any playback error) opens the
            victory art. Portalled into the fullscreen yacht frame
            when there is one, like the victory overlay. */}
        {!running && showFinaleVideo && createPortal(
          <div className="yacht-finale-video-overlay" role="dialog" aria-modal="true"
            aria-label="Kuroi's Last Charge finale video">
            <video className="yacht-finale-video" ref={finaleVideoRef}
              src="/yacht-dash/kuroi-arena/kuroi-finale-video.mp4"
              autoPlay playsInline preload="auto"
              onEnded={finishFinaleVideo}
              onError={finishFinaleVideo} />
          </div>,
          document.fullscreenElement?.classList?.contains("captain-fs-yacht")
            ? document.fullscreenElement : document.body
        )}



        {!wideConsole && !isBoss && helmControls}

        {!isBoss && <div className="captain-cargo-key">
          <span><b className="cargo-ball"><CaptainPickupIcon kind="ball" /></b><i>+10</i>Tennis <small>×{catches.ball}</small></span>
          <span><b className="cargo-treat"><CaptainPickupIcon kind="treat" /></b><i>+20</i>Treat <small>×{catches.treat}</small></span>
          <span><b className="cargo-cheese"><GoldenCheeseIcon compact /></b><i>+40</i>Cheese <small>×{catches.cheese}</small></span>
          <span><b className="cargo-buoy"><CaptainPickupIcon kind="buoy" /></b><i>-1</i>Buoy</span>
          <span className="mission-meter"><i style={{ width: missionProgress + "%" }} /><em>{missionProgress}% to {chapter.name} medal target</em></span>
        </div>}
      </section>
    </main>
  );
}


function FullscreenGameFrame({ children, label, variant }) {
  const frameRef = useRef(null);
  const hadNativeFullscreen = useRef(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [fallbackFullscreen, setFallbackFullscreen] = useState(false);
  const [fullscreenExitSequence, setFullscreenExitSequence] = useState(0);
  const expanded = nativeFullscreen || fallbackFullscreen;

  useEffect(() => {
    if (variant !== "cosmic") return undefined;
    const iframe = frameRef.current?.querySelector("iframe");
    if (!iframe) return undefined;
    const sync = () => {
      try { iframe.contentDocument?.documentElement.classList.toggle("cosmic-parent-expanded", expanded); }
      catch { /* Same-origin arcade may still be loading. */ }
    };
    sync();
    iframe.addEventListener("load", sync);
    return () => {
      iframe.removeEventListener("load", sync);
      try { iframe.contentDocument?.documentElement.classList.remove("cosmic-parent-expanded"); } catch {}
    };
  }, [expanded, variant]);

  useEffect(() => {
    const syncFullscreen = () => {
      const active = (document.fullscreenElement || document.webkitFullscreenElement) === frameRef.current;
      if (hadNativeFullscreen.current && !active && variant === "yacht") {
        setFullscreenExitSequence((count) => count + 1);
      }
      hadNativeFullscreen.current = active;
      setNativeFullscreen(active);
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    syncFullscreen();
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
    };
  }, []);

  useEffect(() => {
    if (!fallbackFullscreen) return undefined;
    // iOS-proof scroll lock (Mitchell, 2026-11-26): body overflow:hidden
    // alone does not stop iOS Safari from scrolling the page behind a
    // fallback fullscreen frame — during a Tunnel victory the Captain page
    // scrolled and Cosmic Odyssey rose into view, stranding the exit
    // control. Pin the body at the current offset and swallow touch moves
    // that do not belong to a genuinely scrollable in-game sheet.
    const savedY = window.scrollY || 0;
    const previousOverflow = document.body.style.overflow;
    const previousBodyPin = {
      position: document.body.style.position, top: document.body.style.top,
      left: document.body.style.left, right: document.body.style.right, width: document.body.style.width,
    };
    document.body.classList.add("captain-fullscreen-fallback-active");
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    const guardTouchMove = (event) => {
      let node = event.target;
      while (node && node !== document) {
        if (node instanceof Element) {
          const style = window.getComputedStyle(node);
          if ((style.overflowY === "auto" || style.overflowY === "scroll") && node.scrollHeight > node.clientHeight) return;
        }
        node = node.parentNode;
      }
      event.preventDefault();
    };
    document.addEventListener("touchmove", guardTouchMove, { passive: false, capture: true });
    const escape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setFallbackFullscreen(false);
        if (variant === "yacht") setFullscreenExitSequence(count => count + 1);
      }
    };
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("keydown", escape, true);
      document.removeEventListener("touchmove", guardTouchMove, true);
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousBodyPin.position;
      document.body.style.top = previousBodyPin.top;
      document.body.style.left = previousBodyPin.left;
      document.body.style.right = previousBodyPin.right;
      document.body.style.width = previousBodyPin.width;
      document.body.classList.remove("captain-fullscreen-fallback-active");
      window.scrollTo(0, savedY);
    };
  }, [fallbackFullscreen, variant]);

  useEffect(() => {
    const preventGameScroll = event => {
      if (event.code !== "Space" && event.key !== " ") return;
      if (event.target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      if (expanded || frameRef.current?.contains(event.target)) event.preventDefault();
    };
    window.addEventListener("keydown", preventGameScroll, true);
    return () => window.removeEventListener("keydown", preventGameScroll, true);
  }, [expanded]);

  const enterGameFullscreen = () => {
    if (expanded) return;
    const element = frameRef.current;
    if (!element) return;
    const request = element.requestFullscreen || element.webkitRequestFullscreen;
    if (request && document.fullscreenEnabled) {
      try {
        const result = request.call(element);
        if (result?.catch) result.catch(() => setFallbackFullscreen(true));
        return;
      } catch {
        // Native fullscreen is not available in this browser.
      }
    }
    setFallbackFullscreen(true);
  };

  const exitGameFullscreen = () => {
    if (fallbackFullscreen) {
      setFallbackFullscreen(false);
      if (variant === "yacht") setFullscreenExitSequence(count => count + 1);
      return;
    }
    if (nativeFullscreen) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) {
        try { Promise.resolve(exit.call(document)).catch(() => setNativeFullscreen(false)); }
        catch { setNativeFullscreen(false); }
      } else setNativeFullscreen(false);
    }
  };

  // Mitchell's rule (2026-11-25): every game goes fullscreen when played.
  // React games call their requestGameFullscreen prop on start; the Cosmic
  // iframe announces its LAUNCH with a rosieverse:captain-start event on the
  // parent window (see public/cosmic-odyssey/game.js) — answer it here.
  useEffect(() => {
    const onCaptainStart = (event) => {
      if (event?.detail?.variant === variant) enterGameFullscreen();
    };
    window.addEventListener("rosieverse:captain-start", onCaptainStart);
    return () => window.removeEventListener("rosieverse:captain-start", onCaptainStart);
  });

  return (
    <section
      ref={frameRef}
      className={`captain-fullscreen-frame captain-fs-${variant}${expanded ? " is-expanded" : variant === "yacht" ? " is-preview-console" : ""}${fallbackFullscreen ? " is-fallback-fullscreen" : ""}`}
      aria-label={`${label} game`}
      onContextMenu={(event) => event.preventDefault()}
    >
      {["yacht", "tunnel", "captain2", "cheese"].includes(variant) && React.isValidElement(children)
        ? React.cloneElement(children, { requestGameFullscreen: enterGameFullscreen,
            exitGameFullscreen, fullscreenExitSequence })
        : children}
      {/* Mitchell (2026-11-26, round 10): games auto-start fullscreen, so
          there is NO start-fullscreen button — but an EXIT-fullscreen
          button is restored, visible only while fullscreen is active,
          for every Captain game frame (Yacht, Tunnel, Cosmic, Cheese,
          Captain 2). It calls the same exitGameFullscreen the games
          already receive as a prop, covering both the native and the
          fallback fullscreen paths. */}
      {expanded && (() => {
        const exitButton = (
          <button type="button" className="captain-fullscreen-toggle captain-exit-fullscreen-toggle"
            onClick={exitGameFullscreen}
            aria-label={`Exit fullscreen — ${label}`}>
            <span aria-hidden="true">✕</span><b>EXIT FULLSCREEN</b>
          </button>
        );
        // In fallback fullscreen the button is portaled to <body> so no
        // in-frame overlay (victory screens included) or stacking context
        // can ever cover it. In native fullscreen it must stay inside the
        // fullscreen element, so it renders in place there.
        return fallbackFullscreen ? createPortal(exitButton, document.body) : exitButton;
      })()}
    </section>
  );
}

function CaptainArcadeHub(){
  const jumpTo = (selector) => {
    // Buttons, not hash anchors: the hash router would misread a # fragment
    // as a page route. scrollIntoView keeps the user on #captain.
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <section className="captain-arcade-hub" aria-label="Captain's arcade">
      <h2>THE CAPTAIN'S ARCADE</h2>
      <p>Three adventures aboard the ROSIE I. Yacht Dash is a three-lane cargo run through four voyages, Ember Tunnel Drill is a five-world excavation with boss guardians, and Cosmic Odyssey is a maze mission against the galaxy's most wanted.</p>
      <nav className="captain-arcade-jump" aria-label="Jump to a game">
        <span>JUMP TO</span>
        <button type="button" onClick={() => jumpTo(".captain-fs-yacht")}>
          <strong>Yacht Dash</strong><small>Three-lane cargo run · 4 voyages</small>
        </button>
        <button type="button" onClick={() => jumpTo(".captain-fs-tunnel")}>
          <strong>Ember Tunnel Drill</strong><small>Five worlds · boss fights</small>
        </button>
        <button type="button" onClick={() => jumpTo("#cosmic-odyssey-arcade")}>
          <strong>Cosmic Odyssey</strong><small>Maze mission · 10 sectors</small>
        </button>
      </nav>
    </section>
  );
}

function CosmicMobileCharacterCards(){
  const profiles = [
    ["rosie", "Captain Rosie"], ["jett", "Jett Scroundrel"],
    ["kitty", "Kitty Xenovese"], ["chip", "Chip Scurrio"],
  ];
  const [index, setIndex] = useState(0);
  const [back, setBack] = useState(false);
  const dialog = useRef(null);
  const [id, name] = profiles[index];
  const art = (key, reverse = false) => "/cosmic-odyssey/cards/" + key + (reverse ? "-back.webp" : "-front.webp");
  const open = (i) => {
    setIndex(i); setBack(false);
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  };
  const cycle = (delta) => { setIndex(i => (i + delta + profiles.length) % profiles.length); setBack(false); };
  return <section className="cosmic-phone-profiles" aria-label="Cosmic Odyssey character cards">
    <style>{`
      .cosmic-phone-profiles{display:none}
      @media (max-width:759px), (max-width:1024px) and (max-height:560px) and (pointer:coarse){
        .cosmic-phone-profiles{display:block!important;box-sizing:border-box;width:100%;margin:8px 0 12px;padding:12px 10px;background:linear-gradient(#070b2540,#070b2560),url('/cosmic-odyssey/assets/console-v2/card-cosmos.webp') center/cover;border:1px solid #c39b62;border-radius:14px;text-align:center;color:#ffe6af}
        .cosmic-phone-profiles h2{font:600 19px/1.15 Georgia,serif;margin:0 0 4px;color:#ffe1a0}
        .cosmic-phone-profiles p{font:12px/1.4 Arial,sans-serif;margin:0 0 10px;color:#e7d4b4}
        .cosmic-phone-profiles-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
        .cosmic-phone-profiles-grid button{display:block;width:100%;min-width:0;border:0;padding:0;background:none;cursor:pointer;touch-action:manipulation;line-height:0}
        .cosmic-phone-profiles-grid button img,.cosmic-phone-profile-viewer .cosmic-phone-profile-art{display:block!important;width:100%!important;height:auto!important;max-height:none!important;max-width:none!important;aspect-ratio:2/3;object-fit:contain!important;filter:none!important;border-radius:8px}
        .cosmic-phone-profile-viewer{box-sizing:border-box;position:fixed;inset:0;margin:auto;width:min(100%,560px);max-width:100vw;height:100dvh;max-height:100dvh;border:0;padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom));background:#090d25;color:#ffe5b0;overflow:auto}
        .cosmic-phone-profile-viewer::backdrop{background:#050819e8}
        .cosmic-phone-profile-viewer[open]{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
        .cosmic-phone-profile-viewer button{color:#ffe6b3;background:#201635;border:1px solid #c39b62;border-radius:9px;min-height:44px;padding:7px 12px;cursor:pointer;touch-action:manipulation}
        .cosmic-phone-profile-viewer .cosmic-phone-profile-close{align-self:flex-end;min-width:44px}
        .cosmic-phone-profile-viewer .cosmic-phone-profile-flip{min-height:0;width:min(100%,calc((100dvh - 170px)*.666667));padding:0;border:0;background:none;line-height:0}
        .cosmic-phone-profile-nav{display:flex;align-items:center;justify-content:space-between;gap:8px;width:min(100%,390px);font:12px/1.3 Arial,sans-serif}
        .cosmic-phone-profile-viewer p{margin:0}
      }
      @media (max-width:1024px) and (max-height:560px) and (pointer:coarse){.cosmic-phone-profiles-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
    `}</style>
    <h2>Captain Rosie &amp; the Fiends</h2>
    <p>Tap any card to enlarge and flip it.</p>
    <div className="cosmic-phone-profiles-grid">
      {profiles.map(([key, label], i) => <button key={key} type="button" aria-label={"View " + label + " character card"} onClick={() => open(i)}><img src={art(key)} alt={label} decoding="async" /></button>)}
    </div>
    <dialog ref={dialog} className="cosmic-phone-profile-viewer" aria-label={name + " character card"} onClose={() => setBack(false)}>
      <button type="button" className="cosmic-phone-profile-close" aria-label="Close character card" onClick={() => dialog.current.close()}>✕</button>
      <button type="button" className="cosmic-phone-profile-flip" aria-label={back ? "Show front" : "Show reverse"} onClick={() => setBack(v => !v)}><img className="cosmic-phone-profile-art" src={art(id, back)} alt={name + (back ? " dossier" : " portrait")} /></button>
      <p>{back ? "Tap card to see front" : "Tap card to read dossier"}</p>
      <div className="cosmic-phone-profile-nav">
        <button type="button" aria-label="Previous character" onClick={() => cycle(-1)}>‹</button>
        <span>{name} · {index + 1} / {profiles.length}</span>
        <button type="button" aria-label="Next character" onClick={() => cycle(1)}>›</button>
      </div>
    </dialog>
  </section>;
}

function CosmicOdysseyArcade(){
  // Always open on the page: Mitchell asked for the CLOSE COSMIC ODYSSEY /
  // OPEN IN NEW TAB bar to be removed (2026-11-25), so there is no toggle.
  return (
    <section id="cosmic-odyssey-arcade" className="cosmic-odyssey-portal cosmic-odyssey-main-entry" aria-label="Captain Rosie Cosmic Odyssey arcade">
      <img className="cosmic-odyssey-entry-banner" src="/cosmic-odyssey/assets/cosmic-banner.webp"
        alt="Captain Rosie: Cosmic Odyssey - original starship arcade banner" loading="lazy" />
      <CosmicMobileCharacterCards />
      <FullscreenGameFrame label="Cosmic Odyssey" variant="cosmic">
        <div className="cosmic-odyssey-embedded-shell" id="cosmic-odyssey-embedded-game">
          <iframe title="Captain Rosie Cosmic Odyssey playable arcade" src="/cosmic-odyssey/index.html"
            loading="lazy" allow="gamepad; fullscreen" allowFullScreen />
        </div>
      </FullscreenGameFrame>
    </section>
  );
}

function CaptainArcadeBackdrop(){
  React.useEffect(()=>{
    const scenes=[['yacht','.captain-fs-yacht'],['tunnel','.captain-fs-tunnel'],['cosmic','#cosmic-odyssey-arcade']];
    const backdrop=document.querySelector('.captain-arcade-page-background');
    if(!backdrop)return;
    let frame=0;
    const update=()=>{
      frame=0;
      const middle=window.innerHeight*.48;
      const closest=scenes.map(([name,selector])=>{
        const rect=document.querySelector(selector)?.getBoundingClientRect();
        return {name,distance:rect?Math.max(rect.top-middle,0,middle-rect.bottom):Infinity};
      }).sort((a,b)=>a.distance-b.distance)[0];
      backdrop.dataset.focusedGame=closest?.name||'yacht';
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
    update();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule)};
  },[]);
  return <div className="captain-arcade-page-background" data-focused-game="yacht" aria-hidden="true" />;
}

function App() {
  const [loaded, setLoaded] = useState(false);
  // Captain's audio uses this shared setting. It must exist before the Captain
  // component mounts - an undefined value previously made that tab crash.
  const [soundOn] = useState(true);
  const validPages = ["home", "fortune", "cheese", "captain", "captain2", "vault", "randomizers", "haiku", "reminders", "calculations", "timekeeper", "resources", "qr-atelier", "recipes", "reviews"];
  const pageFromLocation = () => {
    const requested = window.location.hash.replace("#", "").split("?")[0].toLowerCase();
    return validPages.includes(requested) ? requested : "home";
  };
  const [page, setPage] = useState(pageFromLocation);
  const [fortuneScrolled, setFortuneScrolled] = useState(false);
  // Users can flip navigation families in place; visiting a destination
  // restores the family appropriate to that page.
  const [navFamily, setNavFamily] = useState(() =>
    RESOURCE_PAGE_IDS.has(pageFromLocation()) ? "resources" : "salon");

  // Normal iPhone Safari has expanding browser chrome. Size the app to its
  // usable visual viewport while keeping standalone Home Screen mode intact.
  useEffect(() => {
    if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) return undefined;
    const root = document.documentElement;
    const syncViewport = () => {
      if (window.innerWidth > 600) {
        root.style.removeProperty("--rosie-visible-height");
        return;
      }
      const viewport = window.visualViewport;
      if (!viewport || Math.abs(viewport.scale - 1) > 0.02) return;
      if (document.activeElement?.matches?.("input, textarea, select, [contenteditable='true']")) return;
      const height = Math.round(viewport.height);
      if (Number.isFinite(height) && height >= 320) {
        root.style.setProperty("--rosie-visible-height", height + "px");
      }
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    window.addEventListener("orientationchange", syncViewport);
    window.visualViewport?.addEventListener("resize", syncViewport);
    document.addEventListener("focusout", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
      window.visualViewport?.removeEventListener("resize", syncViewport);
      document.removeEventListener("focusout", syncViewport);
      root.style.removeProperty("--rosie-visible-height");
    };
  }, []);

  const [layoutUnlocked, setLayoutUnlocked] = useState(() => {
    try { return localStorage.getItem(LAYOUT_UNLOCK_KEY) === "1"; } catch { return false; }
  });
  function unlockLayoutStudio() {
    try { localStorage.setItem(LAYOUT_UNLOCK_KEY, "1"); } catch {}
    setLayoutUnlocked(true);
    setQuestion("");
  }
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [hasAskedFortune, setHasAskedFortune] = useState(false);
  const [consulting, setConsulting] = useState(false);
  const [toast, setToast] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [poseIndex, setPoseIndex] = useState(0);
  const [turning, setTurning] = useState(false);
  const [flipBurst, setFlipBurst] = useState(0);
  const [revealStage, setRevealStage] = useState("idle");
  const [answerDismissed, setAnswerDismissed] = useState(false);
  const [listening, setListening] = useState(false);
  const [dictationStatus, setDictationStatus] = useState("idle");
  const [consultations, setConsultations] = useState(() => {
    const value = Number(sessionStorage.getItem("rosieConsultations") || 0);
    return Number.isFinite(value) ? value : 0;
  });
  const inputRef = useRef(null);
  const fortuneTicketRef = useRef(null);
  const audioRef = useRef(null);
  const whistleAudioRef = useRef(null);
  const whistleUrlRef = useRef(null);
  const recognitionRef = useRef(null);
  const flipTimerRef = useRef(null);
  const turnEndTimerRef = useRef(null);
  const revealTimerRef = useRef(null);
  const revealFinishTimerRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const dictationTimerRef = useRef(null);
  const fortuneRequestRef = useRef(0);
  const previousPageRef = useRef(page);
  const landingSwipeRef = useRef(null);

  const speechSupported = useMemo(
    () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    []
  );

  const speechCopy = listening
    ? "Listening… ask Rosie your question."
    : dictationStatus === "captured"
      ? "Dictation captured. You can edit it before asking Rosie."
      : dictationStatus === "denied"
        ? "Microphone access is blocked. You can still type your question."
        : "";

  const daily = useMemo(() => {
    const seed = dayNumber();
    return {
      treat: OMENS.treat[seed % OMENS.treat.length],
      hour: OMENS.hour[(seed * 3 + 1) % OMENS.hour.length],
      avoid: OMENS.avoid[(seed * 5 + 2) % OMENS.avoid.length]
    };
  }, []);

  const [quickQuestions, setQuickQuestions] = useState(() => samplePrompts(4));

  // The three games are directly linkable and browser navigation stays in sync.
  // This also avoids a stale Captain tab after a reload or shared URL.
  useEffect(() => {
    const onLocationChange = () => {
      const nextPage = pageFromLocation();
      setPage(nextPage);
      setNavFamily(RESOURCE_PAGE_IDS.has(nextPage) ? "resources" : "salon");
    };
    window.addEventListener("hashchange", onLocationChange);
    window.addEventListener("popstate", onLocationChange);
    return () => {
      window.removeEventListener("hashchange", onLocationChange);
      window.removeEventListener("popstate", onLocationChange);
    };
  }, []);

  useEffect(() => {
    const previousPage = previousPageRef.current;
    previousPageRef.current = page;
    if (previousPage !== "fortune" || page === "fortune") return;
    fortuneRequestRef.current += 1;
    [flipTimerRef, turnEndTimerRef, revealTimerRef, revealFinishTimerRef, dismissTimerRef, dictationTimerRef]
      .forEach((timer) => window.clearTimeout(timer.current));
    recognitionRef.current?.abort?.();
    setQuestion("");
    setSubmittedQuestion("");
    setAnswer(null);
    setHasAskedFortune(false);
    setConsulting(false);
    setAnswerDismissed(false);
    setRevealStage("idle");
    setListening(false);
    setDictationStatus("idle");
    setFlipped(false);
    setPoseIndex(0);
    setTurning(false);
    setFlipBurst(0);
    setConsultations(0);
    sessionStorage.removeItem("rosieConsultations");
  }, [page]);

  // The oracle starts with an intentional safe-area stage and only becomes
  // pinned after the visitor scrolls it into the top of the viewport.
  useLayoutEffect(() => {
    if (page !== "fortune") {
      setFortuneScrolled(false);
      return undefined;
    }
    // location.hash restores the previous iPhone scroll position. Reset after
    // this page has committed, then once more after browser restoration.
    const resetFortuneEntry = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      setFortuneScrolled(false);
    };
    resetFortuneEntry();
    const firstFrame = window.requestAnimationFrame(() => {
      resetFortuneEntry();
      window.requestAnimationFrame(resetFortuneEntry);
    });
    const restoredScrollTimer = window.setTimeout(resetFortuneEntry, 80);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(restoredScrollTimer);
    };
  }, [page]);

  useEffect(() => {
    if (page !== "fortune") return undefined;
    const updateOraclePosition = () => setFortuneScrolled(window.scrollY > 8);
    window.addEventListener("scroll", updateOraclePosition, { passive: true });
    updateOraclePosition();
    return () => window.removeEventListener("scroll", updateOraclePosition);
  }, [page]);

  useEffect(() => {
    if (page !== "fortune" || !answer || revealStage !== "revealed" || window.innerWidth > 720) return;
    const frame = window.requestAnimationFrame(() => {
      const card = fortuneTicketRef.current?.querySelector(".ticket-paper");
      if (!card) return;
      const bounds = card.getBoundingClientRect();
      const navTop = document.querySelector(".bottom-nav")?.getBoundingClientRect().top ?? window.innerHeight - 86;
      const needed = Math.max(0, bounds.bottom - navTop + 18);
      const room = Math.max(0, bounds.top - 126);
      if (needed > 0) window.scrollBy({ top: Math.min(needed, room), behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [page, answer, revealStage]);

  function navigateTo(nextPage) {
    if (!validPages.includes(nextPage)) return;
    setNavFamily(RESOURCE_PAGE_IDS.has(nextPage) ? "resources" : "salon");
    setFortuneScrolled(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (window.location.hash !== `#${nextPage}`) {
      // Preserve deep links without native hash scrolling/restoration.
      window.history.pushState(null, "", `#${nextPage}`);
    }
    setPage(nextPage);
  }

  function beginLandingSwipe(event) {
    if (page !== "home" && page !== "resources") return;
    const touch = event.touches[0];
    landingSwipeRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function completeLandingSwipe(event) {
    const start = landingSwipeRef.current;
    landingSwipeRef.current = null;
    if (!start || (page !== "home" && page !== "resources")) return;
    const touch = event.changedTouches[0];
    const horizontal = touch.clientX - start.x;
    const vertical = touch.clientY - start.y;
    if (Math.abs(horizontal) < 72 || Math.abs(horizontal) < Math.abs(vertical) * 1.35) return;
    navigateTo(page === "home" ? "resources" : "home");
  }

  function reshufflePrompts() {
    setQuickQuestions((current) => samplePrompts(4, current));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 950);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const whistleUrl = createWhistleBlobUrl();
    const whistle = new Audio(whistleUrl);
    whistle.preload = "auto";
    whistle.volume = 1;
    whistleAudioRef.current = whistle;
    whistleUrlRef.current = whistleUrl;
    whistle.load();

    return () => {
      whistle.pause();
      whistleAudioRef.current = null;
      if (whistleUrlRef.current) URL.revokeObjectURL(whistleUrlRef.current);
      whistleUrlRef.current = null;
    };
  }, []);


  useEffect(() => {
    const clearLocalTimers = () => {
      window.clearTimeout(flipTimerRef.current);
      window.clearTimeout(turnEndTimerRef.current);
      window.clearTimeout(revealTimerRef.current);
      window.clearTimeout(revealFinishTimerRef.current);
      window.clearTimeout(dismissTimerRef.current);
      window.clearTimeout(dictationTimerRef.current);
    };

    if (!speechSupported) return clearLocalTimers;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = navigator.language || "en-US";

    recognition.onstart = () => {
      setListening(true);
      setDictationStatus("listening");
    };

    recognition.onresult = (event) => {
      const result = event.results?.[event.resultIndex ?? 0]?.[0]?.transcript?.trim();
      if (!result) return;

      setQuestion(result);
      setDictationStatus("captured");
      window.clearTimeout(dictationTimerRef.current);
      dictationTimerRef.current = window.setTimeout(() => {
        setDictationStatus((status) => status === "captured" ? "idle" : status);
      }, 2800);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setDictationStatus("denied");
      } else if (event.error !== "aborted") {
        setDictationStatus("idle");
        setToast("Rosie couldn't hear that clearly. Try the mic again.");
        window.setTimeout(() => setToast(""), 1800);
      }
    };

    recognition.onend = () => {
      setListening(false);
      setDictationStatus((status) => status === "listening" ? "idle" : status);
    };

    recognitionRef.current = recognition;

    return () => {
      clearLocalTimers();
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [speechSupported]);

  function chooseFortune() {
    const recent = readRecent();
    let candidates = FORTUNES.filter((item) => !recent.includes(item.id));
    if (candidates.length < 10) candidates = FORTUNES;

    const selection = candidates[secureIndex(candidates.length)];
    const next = [...recent.filter((id) => id !== selection.id), selection.id].slice(-5);
    sessionStorage.setItem("rosieRecent", JSON.stringify(next));
    return selection;
  }

  function primeAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioRef.current) audioRef.current = new AudioContext();
    audioRef.current.resume?.();
    return audioRef.current;
  }

  function playOracleRevealCue() {
    const context = audioRef.current;
    if (!context) return;

    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.72, now);
    master.connect(context.destination);

    const gongGain = context.createGain();
    gongGain.gain.setValueAtTime(0.0001, now);
    gongGain.gain.exponentialRampToValueAtTime(0.11, now + 0.025);
    gongGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.35);
    gongGain.connect(master);

    [108, 216, 323.5, 432].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.detune.setValueAtTime(index * 2.5, now);
      oscillator.connect(gongGain);
      oscillator.start(now);
      oscillator.stop(now + 2.4);
    });

    const shimmer = context.createGain();
    shimmer.gain.setValueAtTime(0.0001, now + 0.12);
    shimmer.gain.exponentialRampToValueAtTime(0.065, now + 0.22);
    shimmer.gain.exponentialRampToValueAtTime(0.0001, now + 1.75);
    shimmer.connect(master);

    [659.25, 783.99, 987.77, 1174.66].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + 0.16 + index * 0.12;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.55, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.68);
      oscillator.connect(gain);
      gain.connect(shimmer);
      oscillator.start(start);
      oscillator.stop(start + 0.72);
    });

    const sparkle = context.createOscillator();
    const sparkleGain = context.createGain();
    sparkle.type = "sine";
    sparkle.frequency.setValueAtTime(1760, now + 0.48);
    sparkle.frequency.exponentialRampToValueAtTime(2640, now + 0.92);
    sparkleGain.gain.setValueAtTime(0.0001, now + 0.48);
    sparkleGain.gain.exponentialRampToValueAtTime(0.028, now + 0.54);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.28);
    sparkle.connect(sparkleGain);
    sparkleGain.connect(master);
    sparkle.start(now + 0.48);
    sparkle.stop(now + 1.32);
  }

  function playReleaseChime() {
    const context = audioRef.current;
    if (!context) return;

    const now = context.currentTime;
    [1174.66, 987.77, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.055;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.032, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.37);
    });
  }

  async function synthWhistleFallback() {
    const context = primeAudio();
    if (!context) return;

    try {
      await context.resume?.();
    } catch {}

    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.048, now + 0.024);
    master.gain.setValueAtTime(0.046, now + 0.36);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.49);
    master.connect(context.destination);

    const lead = context.createOscillator();
    lead.type = "sine";
    lead.frequency.setValueAtTime(1575, now);
    lead.frequency.linearRampToValueAtTime(2120, now + 0.205);
    lead.frequency.linearRampToValueAtTime(1885, now + 0.292);
    lead.frequency.linearRampToValueAtTime(2240, now + 0.455);
    lead.frequency.linearRampToValueAtTime(2180, now + 0.49);
    lead.connect(master);
    lead.start(now);
    lead.stop(now + 0.5);
  }

  async function playWhistle() {
    let audio = whistleAudioRef.current;
    if (!audio) {
      const whistleUrl = createWhistleBlobUrl();
      whistleUrlRef.current = whistleUrl;
      audio = new Audio(whistleUrl);
      audio.preload = "auto";
      whistleAudioRef.current = audio;
    }
    audio.volume = 1;

    try {
      audio.pause();
      audio.currentTime = 0;
      await audio.play();
      return;
    } catch {
      await synthWhistleFallback();
    }
  }

  function whistleForRosie() {
    void playWhistle();
    setTurning(true);
    setFlipBurst((value) => value + 1);

    window.clearTimeout(flipTimerRef.current);
    window.clearTimeout(turnEndTimerRef.current);

    // The visual swap happens only once the smoke is fully opaque.
    flipTimerRef.current = window.setTimeout(() => {
      setFlipped((value) => !value);
      setPoseIndex((value) => (value + 1) % FORTUNE_POSES.length);
      window.navigator.vibrate?.([8, 20, 8]);
    }, 390);

    turnEndTimerRef.current = window.setTimeout(() => {
      setTurning(false);
    }, 960);
  }

  async function toggleDictation() {
    const recognition = recognitionRef.current;
    if (!speechSupported || !recognition) {
      setToast("Speech input is not available on this browser.");
      window.setTimeout(() => setToast(""), 1700);
      return;
    }

    if (listening) {
      recognition.stop();
      return;
    }

    window.clearTimeout(dictationTimerRef.current);
    setDictationStatus("listening");

    // Tesla's 2026.26.6+ browser supports cabin-microphone permissions.
    // Prime that grant on a user gesture before starting native speech recognition.
    // Standard iPhone/iPad behavior is unchanged.
    const isTeslaBrowser=/Tesla|TeslaBrowser|TeslaWebKit/i.test(navigator.userAgent);
    if(isTeslaBrowser && navigator.mediaDevices?.getUserMedia){
      try{
        const permissionStream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
        permissionStream.getTracks().forEach(track=>track.stop());
      }catch{
        setListening(false);
        setDictationStatus("denied");
        setToast("Allow cabin microphone access in Tesla's browser to dictate.");
        window.setTimeout(()=>setToast(""),3200);
        return;
      }
    }
    try {
      recognition.start();
    } catch {
      setListening(false);
      setDictationStatus("idle");
    }
  }

  async function askRosie(event) {
    event.preventDefault();
    if (consulting) return;

    // A blank Ask is an invitation to suggest a question, not to send one
    // invisibly. First tap fills the input; the next tap consults Rosie.
    if (!question.trim()) {
      const suggested = quickQuestions[secureIndex(quickQuestions.length)] || samplePrompts(1)[0];
      if (suggested) {
        setQuestion(suggested);
        setSubmittedQuestion("");
      }
      return;
    }
    const askedQuestion = question.trim();
    const requestId = ++fortuneRequestRef.current;
    setHasAskedFortune(true);

    primeAudio();
    window.clearTimeout(revealTimerRef.current);
    window.clearTimeout(revealFinishTimerRef.current);
    setAnswer(null);
    setAnswerDismissed(false);
    setRevealStage("consulting");
    setConsulting(true);

    const fallback = { ...chooseFortune(), source: "collection" };
    setSubmittedQuestion(askedQuestion);
    setQuestion("");
    // Preserve Rosie's existing fortune library as the no-network fallback.
    reshufflePrompts();
    const started = Date.now();
    let result = fallback;
    try {
      const generated = await generateRosieText({ feature: "oracle", question: askedQuestion });
      if (typeof generated.text !== "string" || !generated.text.trim()) throw new Error("Invalid fortune");
      result = {
        id: generated.id || `ai-${Date.now()}`,
        tone: ["positive", "uncertain", "negative"].includes(generated.tone) ? generated.tone : "uncertain",
        text: generated.text.trim(),
        source: "ai"
      };
    } catch {
      // The crystal ball still works even if Venice is unavailable.
    }
    if (requestId !== fortuneRequestRef.current) return;
    const delay = Math.max(0, 1350 + secureIndex(650) - (Date.now() - started));

    revealTimerRef.current = window.setTimeout(() => {
      setAnswer(result);
      setConsulting(false);
      setRevealStage("manifesting");

      const nextCount = consultations + 1;
      setConsultations(nextCount);
      sessionStorage.setItem("rosieConsultations", String(nextCount));

      playOracleRevealCue();
      window.navigator.vibrate?.([20, 42, 18, 52, 24]);

      revealFinishTimerRef.current = window.setTimeout(() => {
        setRevealStage("revealed");
      }, 1450);
    }, delay);
  }

  function dismissAnswer() {
    if (!answer || answerDismissed || revealStage !== "revealed") return;

    window.clearTimeout(dismissTimerRef.current);
    setRevealStage("dismissing");
    playReleaseChime();
    window.navigator.vibrate?.([9, 22, 9]);

    dismissTimerRef.current = window.setTimeout(() => {
      setAnswerDismissed(true);
      setRevealStage("revealed");
    }, 720);
  }

  function askAnother() {
    window.clearTimeout(revealTimerRef.current);
    window.clearTimeout(revealFinishTimerRef.current);
    setQuestion("");
    setSubmittedQuestion("");
    setAnswer(null);
    setAnswerDismissed(false);
    setConsulting(false);
    setRevealStage("idle");
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }

  function saveFortune() {
    if (!answer) return;
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("rosieSavedFortunes") || "[]");
    } catch {}

    saved.unshift({
      question: submittedQuestion,
      answer: answer.text,
      tone: answer.tone,
      savedAt: new Date().toISOString()
    });
    localStorage.setItem("rosieSavedFortunes", JSON.stringify(saved.slice(0, 50)));

    setToast("Fortune saved to Rosie's vault.");
    window.setTimeout(() => setToast(""), 1700);
  }

  async function shareFortune() {
    if (!answer) return;
    const text = `I asked Madame Rosie: “${submittedQuestion}”\nRosie said: “${answer.text}”`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Madame Rosie", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setToast("Fortune copied to your clipboard.");
    } catch {
      setToast("Rosie kept this fortune private.");
    }
    window.setTimeout(() => setToast(""), 1700);
  }

  function choosePrompt(prompt) {
    setQuestion(prompt);
  }

  return (
    <>
      <div className={`loading-screen ${loaded ? "loading-screen-hidden" : ""}`}>
        <div className="loading-orb"><span>🐾</span></div>
        <div className="loading-title">ROSIE</div>
        <div className="loading-copy">Consulting the ancient treat ledger…</div>
      </div>

      <RosieMusicPlayer page={page} />
      <div className={`app-shell page-${page} ${loaded ? "app-shell-visible" : ""} ${page === "cheese" ? "is-cheese-page" : ""} ${page === "vault" ? "is-vault-page" : ""}`} onTouchStart={beginLandingSwipe} onTouchEnd={completeLandingSwipe}>
        {page === "captain" && <CaptainOuterAtmosphere />}


        {page === "home" ? (
          <RosieHome onNavigate={navigateTo} />
        ) : page === "haiku" ? (
          <RosieHaikuGarden onNavigate={navigateTo} />
        ) : page === "fortune" ? (
        <main className={`fortune-page ${fortuneScrolled ? "fortune-scrolled" : ""}`}>
          <div className="fortune-console">
            <FortuneMachine
              consulting={consulting}
              answer={answer}
              revealStage={revealStage}
              answerDismissed={answerDismissed}
              onDismissAnswer={dismissAnswer}
              flipped={flipped}
              turning={turning}
              flipBurst={flipBurst}
              poseIndex={poseIndex}
            />

            <div className="console-caption">
              <span>FORTUNES · ADVICE · HIGHLY QUALIFIED OPINIONS</span>
            </div>
            <form className={`question-card ${hasAskedFortune ? "has-consultation" : ""}`} onSubmit={askRosie}>
              <div className="console-rivets" aria-hidden="true"><i /><i /><i /><i /></div>
              <div className="question-heading">
                <span className="question-kicker">PETITION THE ORACLE</span>
                <button
                  type="button"
                  className="fortune-whistle-button"
                  aria-label="Whistle for another Madame Rosie pose"
                  title="Whistle for another Madame Rosie pose"
                  onClick={whistleForRosie}
                  disabled={turning}
                >
                  <span aria-hidden="true">♪</span>
                </button>
                <label htmlFor="question">Ask Rosie what you should do…</label>
              </div>

              <div className="question-row">
                <div className="input-shell">
                  <span className="input-star">✦</span>
                  <input
                    ref={inputRef}
                    id="question"
                    value={question}
                    onChange={(event) => {
                      if (event.target.value.trim().toLowerCase() === "manchego") {
                        unlockLayoutStudio();
                        return;
                      }
                      setQuestion(event.target.value);
                      if (dictationStatus === "captured") setDictationStatus("idle");
                    }}
                    maxLength={160}
                    autoComplete="off"
                    enterKeyHint="go"
                    placeholder="Bring Rosie your most delicious dilemma…"
                  />
                  <button
                    className={`mic-button ${listening ? "is-listening" : ""}`}
                    type="button"
                    onClick={toggleDictation}
                    disabled={!speechSupported || consulting}
                    aria-label={listening ? "Stop listening" : "Dictate your question"}
                    title={speechSupported ? "Dictate your question" : "Speech input unavailable"}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" />
                      <path d="M17.2 10.8a1 1 0 0 1 2 0 7.2 7.2 0 0 1-6.2 7.13V21h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-3.07a7.2 7.2 0 0 1-6.2-7.13 1 1 0 1 1 2 0 5.2 5.2 0 0 0 10.4 0Z" />
                    </svg>
                  </button>
                </div>

                <button className="ask-button" type="submit" disabled={consulting || revealStage === "manifesting"}>
                  <span className="button-paw">🐾</span>
                  {revealStage === "manifesting" ? "RECEIVING…" : consulting ? "CONSULTING…" : "ASK ROSIE"}
                </button>
              </div>

              {speechCopy && (
                <div
                  className={`speech-status ${listening ? "is-listening" : dictationStatus === "captured" ? "is-captured" : "is-denied"}`}
                  aria-live="polite"
                >
                  {speechCopy}
                </div>
              )}

              {!hasAskedFortune && <div className="quick-row">
                <p className="fortune-sample-heading">ROSIE’S SAMPLE QUESTIONS <span>Tap to choose · Or press Ask for a surprise</span></p>
                <div className="quick-prompts">
                  {quickQuestions.map((prompt) => (
                    <button type="button" key={prompt} onClick={() => choosePrompt(prompt)}>
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>}
              {!hasAskedFortune && <div className="console-foot">
                <button type="button" className="footer-shuffle" onClick={reshufflePrompts} aria-label="Show different sample questions" title="Different questions">
                  <span aria-hidden="true">↻</span>
                  Different questions
                </button>
                <strong>{consultations} question{consultations === 1 ? "" : "s"} asked tonight</strong>
              </div>}
              {!hasAskedFortune && <div className="fortune-mobile-caption">FORTUNES · ADVICE · HIGHLY QUALIFIED OPINIONS</div>}
            </form>
          </div>

          {hasAskedFortune && <section ref={fortuneTicketRef} className={`fortune-ticket ${answer && (revealStage === "revealed" || revealStage === "dismissing") ? "fortune-ticket-visible" : ""}`} aria-live="polite">
            {(!answer || revealStage === "manifesting") && (
              <div className={`fortune-waiting-card ${consulting || revealStage === "manifesting" ? "is-awake" : ""}`}>
                <span aria-hidden="true">✦</span>
                <small>THE PRIVATE CONSULTATION</small>
                <strong>{consulting || revealStage === "manifesting" ? "The signs are gathering." : "Rosie will place her answer here."}</strong>
                <p>Ask one excellent question. The crystal ball will stir, and Madame Rosie will deliver her ruling.</p>
              </div>
            )}
            {answer && revealStage !== "manifesting" && (
              <div className="ticket-paper">
                <span className="ticket-corner ticket-corner-tl" aria-hidden="true">✦</span>
                <span className="ticket-corner ticket-corner-tr" aria-hidden="true">✦</span>
                <span className="ticket-corner ticket-corner-bl" aria-hidden="true">✦</span>
                <span className="ticket-corner ticket-corner-br" aria-hidden="true">✦</span>

                <div className="ticket-topline">
                  <span>FORTUNE № {String(consultations).padStart(3, "0")}</span>
                  <strong>MADAME ROSIE</strong>
                  <span>{answer.source === "collection" ? "CLASSIC FORTUNE" : "PRIVATE ORACLE"}</span>
                </div>

                <div className="ticket-oracle-mark" aria-hidden="true">
                  <span>✦</span><b>🐾</b><span>✦</span>
                </div>

                <div className="ticket-question">“{submittedQuestion}”</div>
                <div className="ticket-answer">{answer.text}</div>

                <div className="ticket-stamp"><span aria-hidden="true">🐾</span> THE PAW HAS SPOKEN</div>

                <div className="answer-actions">
                  <button type="button" onClick={askAnother}>ASK ANOTHER</button>
                  <button type="button" className="secondary" onClick={saveFortune}>SAVE</button>
                  <button type="button" className="secondary" onClick={shareFortune}>SHARE</button>
                </div>
              </div>
            )}
          </section>}

          <section className="omen-rail bottom-omens" aria-label="Today's omens">
            <div className="omen-title">
              <span>✦</span>
              TODAY'S OMENS
              <span>✦</span>
            </div>
            <div className="omen-grid">
              <div><small>LUCKY TREAT</small><strong>{capitalizeFirst(daily.treat)}</strong></div>
              <div><small>AUSPICIOUS HOUR</small><strong>{daily.hour}</strong></div>
              <div><small>AVOID</small><strong>{capitalizeFirst(daily.avoid)}</strong></div>
            </div>
          </section>
        </main>
        ) : page === "cheese" ? (
          <FullscreenGameFrame label="Cheese Memory" variant="cheese"><CheeseMemoryGame /></FullscreenGameFrame>
        ) : page === "captain" ? (
          <>
            <CaptainArcadeBackdrop />
            <FullscreenGameFrame label="Captain Rosie Yacht Adventure" variant="yacht">
              <CaptainGameBoundary>
                <CaptainRosieGame soundOn={soundOn} />
              </CaptainGameBoundary>
            </FullscreenGameFrame>
            <FullscreenGameFrame label="Ember Tunnel Drill" variant="tunnel">
              <EmberTunnelDrill soundOn={soundOn} />
            </FullscreenGameFrame>
            <CosmicOdysseyArcade />
          </>
        ) : page === "captain2" ? (
          <FullscreenGameFrame label="Captain 2" variant="captain2"><Captain2Game soundOn={soundOn} /></FullscreenGameFrame>
        ) : page === "vault" ? (
          <RosieCardVault />
        ) : page === "reminders" ? (
          <RosieReminders />
        ) : page === "calculations" ? (
          <RosieCalculations />
        ) : page === "timekeeper" ? (
          <RosieTimekeeper />
        ) : page === "qr-atelier" ? (
          <RosieQrAtelier />
        ) : page === "recipes" ? (
          <RosieRecipes />
        ) : page === "reviews" ? (
          <RosieReviews />
        ) : page === "resources" ? (
          <RosieResources onNavigate={navigateTo} />
        ) : (
          <RosieRandomizers />
        )}

        {page !== "home" && <div className="royal-nav-shell" data-nav-family={navFamily}>
          <button type="button" className="bottom-side-seal bottom-side-seal--home" aria-label="RosieVerse Home" title="RosieVerse Home" onClick={() => navigateTo("home")}><RoyalNavArt name="home-simple" className="royal-seal-art" /></button>
          {navFamily === "resources" ?
          <nav className="bottom-nav resources-bottom-nav" aria-label="Rosie’s Resources">
            <button type="button" aria-label="Open Rosie’s Reminders" className={page === "reminders" ? "active" : ""} aria-current={page === "reminders" ? "page" : undefined} onClick={() => navigateTo("reminders")}><span className="nav-icon-wrap"><ResourceNavIcon type="reminders" /></span><small>Reminders</small></button>
            <button type="button" aria-label="Open QR" className={page === "qr-atelier" ? "active" : ""} aria-current={page === "qr-atelier" ? "page" : undefined} onClick={() => navigateTo("qr-atelier")}><span className="nav-icon-wrap"><ResourceNavIcon type="qr-atelier" /></span><small>QR</small></button>
            <button type="button" aria-label="Open Rosie’s Calculations" className={page === "calculations" ? "active" : ""} aria-current={page === "calculations" ? "page" : undefined} onClick={() => navigateTo("calculations")}><span className="nav-icon-wrap"><ResourceNavIcon type="calculations" /></span><small>Calculations</small></button>
            <button type="button" aria-label="Open Rosie’s Recipes" className={page === "recipes" ? "active" : ""} aria-current={page === "recipes" ? "page" : undefined} onClick={() => navigateTo("recipes")}><span className="nav-icon-wrap"><ResourceNavIcon type="recipes" /></span><small>Recipes</small></button>
            <button type="button" aria-label="Open Rosie’s Reviews" className={page === "reviews" ? "active" : ""} aria-current={page === "reviews" ? "page" : undefined} onClick={() => navigateTo("reviews")}><span className="nav-icon-wrap"><ResourceNavIcon type="reviews" /></span><small>Reviews</small></button>
            <button type="button" aria-label="Open Rosie’s Timekeepers" className={page === "timekeeper" ? "active" : ""} aria-current={page === "timekeeper" ? "page" : undefined} onClick={() => navigateTo("timekeeper")}><span className="nav-icon-wrap"><ResourceNavIcon type="timekeeper" /></span><small>Timekeepers</small></button>
          </nav> :
          <nav className="bottom-nav" aria-label="RosieVerse destinations">
            <button type="button" aria-label="Open Fortune Teller" className={page === "fortune" ? "active" : ""} aria-current={page === "fortune" ? "page" : undefined} onClick={() => navigateTo("fortune")}><span className="nav-icon-wrap"><RosieNavIcon type="fortune" /></span><small>Fortune</small></button>
            <button type="button" aria-label="Open Cheese Board Exam" className={page === "cheese" ? "active" : ""} aria-current={page === "cheese" ? "page" : undefined} onClick={() => navigateTo("cheese")}><span className="nav-icon-wrap"><RosieNavIcon type="cheese" /></span><small>Cheese</small></button>
            <button type="button" aria-label="Open Captain Rosie" className={page === "captain" ? "active" : ""} aria-current={page === "captain" ? "page" : undefined} onClick={() => navigateTo("captain")}><span className="nav-icon-wrap"><RosieNavIcon type="captain" /></span><small>Captain</small></button>
            <button type="button" aria-label="Open Rosie’s Zen Garden" className={page === "haiku" ? "active" : ""} aria-current={page === "haiku" ? "page" : undefined} onClick={() => navigateTo("haiku")}><span className="nav-icon-wrap"><RosieNavIcon type="zen" /></span><small>Zen</small></button>
            <button type="button" className={`vault-nav-button ${page === "vault" ? "active" : ""}`} aria-label="Open Card Vault" title="Card Vault" aria-current={page === "vault" ? "page" : undefined} onClick={() => navigateTo("vault")}><span className="nav-icon-wrap"><RosieNavIcon type="vault" /></span><small>Vault</small></button>
            <button type="button" aria-label="Open Rosie’s Randomizers" className={page === "randomizers" ? "active" : ""} aria-current={page === "randomizers" ? "page" : undefined} onClick={() => navigateTo("randomizers")}><span className="nav-icon-wrap"><RosieNavIcon type="random" /></span><small>Random</small></button>
          </nav>}
          <button type="button" className="bottom-side-seal bottom-side-seal--tools" aria-label="Rosie’s Resources hub" title="Rosie’s Resources" onClick={() => navigateTo("resources")}><RoyalNavArt name="resources-simple" className="royal-seal-art" /></button>
          <button className={"nav-family-toggle" + (navFamily === "resources" ? " on-resources" : "")}
            type="button"
            aria-label={navFamily === "resources" ? "Switch navigation to RosieVerse games" : "Switch navigation to tools"}
            title={navFamily === "resources" ? "Show RosieVerse games" : "Show Tools"}
            onClick={() => setNavFamily(family => family === "resources" ? "salon" : "resources")}>
            <RoyalNavArt name={navFamily === "resources" ? "gamepad" : "tools"} className="royal-mode-icon" />
            <RoyalNavArt name="switch-arrows" className="royal-mode-arrows" />
            <span>{navFamily === "resources" ? "Games" : "Tools"}</span>
          </button>
        </div>}
        <AccountPortal />
      </div>

      <SecretLayoutStudio
        page={page}
        unlocked={layoutUnlocked}
        onNavigate={navigateTo}
        onHide={() => {
          try { localStorage.removeItem(LAYOUT_UNLOCK_KEY); } catch {}
          setLayoutUnlocked(false);
        }}
      />
      <div className={`toast ${toast ? "toast-visible" : ""}`}>{toast}</div>
    </>
  );
}
// Mount/unmount is explicit so the Tesla-only desktop stage can replace
// its regular view without keeping a second music-playing app in the DOM.
export function mountRosieVerse(container = document.getElementById("root")) {
  const layoutParams = new URLSearchParams(window.location.search);
  const isLayoutStudio = layoutParams.has("layout");
  const isLayoutPreview = layoutParams.has("layoutPreview");
  const root = createRoot(container);
  root.render(
    isLayoutStudio
      ? <LayoutPlayground />
      : <AccountProvider><App />{isLayoutPreview && <LayoutPreviewBridge />}</AccountProvider>
  );
  return root;
}
