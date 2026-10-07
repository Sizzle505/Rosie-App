import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./fortune-effects.css";
import "./visual-rebuild.css";
import Captain2Game from "./captain2.jsx";
import RosieCardVault from "./RosieCardVault.jsx";

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
  "Should I buy the fancy cheese?",
  "Should I cancel my plans and become a blanket burrito?",
  "Would a tiny treat improve morale?",
  "Should I send the text or stare nobly into the distance?",
  "Is today a good day to wear the dramatic coat?",
  "Would Rosie consider this a snack emergency?",
  "Should I choose the option with better snacks?",
  "Am I being mysterious or just avoiding my inbox?",
  "Would a walk fix my entire personality?",
  "Should I order fries for the table and mostly eat them myself?",
  "Is one more little treat technically self-care?",
  "Should I trust a plan conceived after 10 p.m.?",
  "Would a ceremonial cheese plate improve negotiations?",
  "Should I dramatically leave five minutes early?",
  "Is the universe telling me to take a nap?",
  "Would Rosie approve of this level of nonsense?",
  "Should I take the scenic route if snacks are involved?",
  "Is this person worthy of sharing my best cheese?",
  "Should I pretend I didn't hear the vacuum?",
  "Would a tiny adventure be good for morale?",
  "Should I make the responsible choice or the charming one?",
  "Am I overthinking this, or is my eyebrow correctly raised?",
  "Should I bring a snack just in case there is no snack?",
  "Should I buy it because it has a tiny bow?",
  "Is this meeting worth putting on real pants for?",
  "Should I leave before everyone starts saying 'one more drink'?",
  "Would adding champagne make this a plan?",
  "Should I trust someone who dislikes dogs?",
  "Is this a sign or just excellent lighting?",
  "Should I send the risky text with impeccable punctuation?",
  "Do I deserve a reward for answering two emails?",
  "Should I spend the afternoon being unavailable and exquisite?",
  "Would Rosie choose cozy or chaos?",
  "Should I wear the impractical shoes if they complete the vision?",
  "Should I make an entrance?",
  "Would one more coffee make me wiser or merely faster?",
  "Should I take the last cookie and deny everything?",
  "Should I solve this now or delegate it to Future Me?",
  "Is my first instinct brilliant or theatrically wrong?",
  "Should I order dessert before anyone can object?",
  "Would a nap count as strategic planning?",
  "Should I buy flowers because Tuesday looked lonely?",
  "Do I need a plan, or just suspiciously good confidence?",
  "Should I say yes and let Future Me discover the details?",
  "Would this decision be improved by wearing sunglasses?",
  "Should I forgive them if they arrive with cheese?",
  "Is it too early to declare victory and lie in the sun?",
  "Should I pursue this squirrel of an idea?",
  "Would Rosie classify this as elegant mischief?",
  "Should I reward myself for showing tremendous restraint so far?"
]

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

function samplePrompts(count = 4) {
  const pool = [...QUICK_QUESTIONS];
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

  const state = [
    consulting ? "is-consulting" : "",
    manifesting ? "is-manifesting" : "",
    dismissing ? "is-dismissing" : "",
    showAnswer ? `has-answer tone-${answer.tone}` : ""
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
      onPointerUp={interactive ? onDismiss : undefined}
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
        <div className="lens-answer" key={answer.id}>
          <span className="answer-spark-field" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i />
          </span>
          <span className="answer-sigil" aria-hidden="true">✦</span>
          <span className="answer-kicker">ROSIE HAS SEEN IT</span>
          <strong>{answer.text}</strong>

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
      className={`crystal-energy ${consulting ? "is-consulting" : ""} ${manifesting ? "is-manifesting" : ""} ${tone}`}
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

function FortuneMachine({ consulting, answer, revealStage, answerDismissed, onDismissAnswer, flipped, turning, flipBurst }) {
  const manifesting = revealStage === "manifesting";
  return (
    <section
      className={`machine ${consulting ? "machine-consulting" : ""} ${manifesting ? "machine-manifesting" : ""}`}
      aria-label="Madame Rosie fortune teller"
    >
      <div className="booth">
        <div className="cabinet-lights cabinet-lights-left" />
        <div className="cabinet-lights cabinet-lights-right" />
        <div className="curtain curtain-left" />
        <div className="curtain curtain-right" />

        <div className="sign">
          <div className="sign-paw">🐾</div>
          <span className="sign-glint sign-glint-a" />
          <span className="sign-glint sign-glint-b" />
          <h1>MADAME ROSIE</h1>
          <p>SEER OF TREATS · KNOWER OF THINGS</p>
        </div>

        <div className={`stage ${turning ? "stage-turning" : ""} ${manifesting ? "stage-manifesting" : ""}`}>
          <img
            className={`stage-art ${consulting ? "stage-art-consulting" : ""}`}
            src="/rosie-fortune-stage.webp"
            alt="Rosie dressed as a jeweled fortune teller at her crystal ball"
          />

          {/* A Rosie-only portrait layer.  The stage image never moves; the layer is
              revealed only under the whistle's smoke, then pivots in place. */}
          <img
            className={`rosie-turn-layer ${flipped ? "is-flipped" : ""} ${turning ? "is-turning" : ""}`}
            src="/rosie-fortune-turn-side.webp"
            alt=""
            aria-hidden="true"
          />

          <div className="lantern-life" aria-hidden="true">
            <span className="lantern-glow lantern-glow-left"><i /></span>
            <span className="lantern-glow lantern-glow-right"><i /></span>
          </div>

          {/* The stage is deliberately one immutable painting. The whistle effect is
              additive magic only - no mirrored/cropped duplicate of Rosie or the set. */}

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
        </div>

        <CrystalEnergy consulting={consulting} answer={answer} revealStage={revealStage} />
        <FortuneLens
          consulting={consulting}
          answer={answer}
          revealStage={revealStage}
          answerDismissed={answerDismissed}
          onDismiss={onDismissAnswer}
        />

        {flipBurst > 0 && turning && (
          <div className="turn-foreground-smoke" aria-hidden="true" key={`foreground-${flipBurst}`}>
            <span className="foreground-plume foreground-plume-a" />
            <span className="foreground-plume foreground-plume-b" />
            <span className="foreground-plume foreground-plume-c" />
            <span className="foreground-glitter">
              <i /><i /><i /><i /><i /><i /><i /><i />
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
const CHEESES = [
  {
    id: "brie",
    name: "Brie",
    note: "Soft-ripened royalty",
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Brie_de_Meaux.jpg",
    objectPosition: "50% 52%"
  },
  {
    id: "swiss",
    name: "Swiss",
    note: "The hole truth",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/ec/NCI_swiss_cheese.jpg",
    objectPosition: "50% 50%"
  },
  {
    id: "cheddar",
    name: "Cheddar",
    note: "Sharp and distinguished",
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Montgomerys_cheddar_cheese.jpg",
    objectPosition: "52% 52%"
  },
  {
    id: "blue",
    name: "Blue",
    note: "Veined with greatness",
    image: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Shropshire_blue_cheese.jpg",
    objectPosition: "50% 50%"
  },
  {
    id: "gouda",
    name: "Gouda",
    note: "Wheel of good decisions",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Aged_Gouda_cheese.jpg",
    objectPosition: "55% 48%"
  },
  {
    id: "parmesan",
    name: "Parmesan",
    note: "Aged with authority",
    image: "https://upload.wikimedia.org/wikipedia/commons/9/96/Parmigiano_Reggiano_cheese.jpg",
    objectPosition: "54% 48%"
  },
  {
    id: "mozzarella",
    name: "Mozzarella",
    note: "Fresh little clouds",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/50/Mozzarella_cheese.jpg",
    objectPosition: "48% 50%"
  },
  {
    id: "goat",
    name: "Goat Cheese",
    note: "Tangy academic excellence",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Goat_cheese_from_Belgium_2025-02-20_01.jpg/960px-Goat_cheese_from_Belgium_2025-02-20_01.jpg",
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

const ROSIE_MOOD_ART = {
  watching: "/rosie-mood-watching.webp",
  focused: "/rosie-mood-focused.webp",
  pleased: "/rosie-mood-pleased.webp",
  proud: "/rosie-mood-proud.webp",
  amused: "/rosie-mood-amused.webp",
  embarrassed: "/rosie-mood-embarrassed.webp",
  distraught: "/rosie-mood-distraught.webp",
  elated: "/rosie-mood-elated.webp"
};

function CheeseMemoryGame() {
  const [deck, setDeck] = useState(() => shuffleCheeseDeck());
  const [openCards, setOpenCards] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState("Rosie is testing your palate memory. Do try not to embarrass yourself.");
  const [rosieMood, setRosieMood] = useState("watching");
  const [matchStreak, setMatchStreak] = useState(0);
  const [misses, setMisses] = useState(0);
  const [inspections, setInspections] = useState(0);
  const pendingFlipRef = useRef(null);

  const complete = matched.length === CHEESES.length;

  useEffect(() => {
    if (!started || complete) return undefined;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [started, complete]);

  useEffect(() => () => window.clearTimeout(pendingFlipRef.current), []);

  function resetGame() {
    window.clearTimeout(pendingFlipRef.current);
    pendingFlipRef.current = null;
    setDeck(shuffleCheeseDeck());
    setOpenCards([]);
    setMatched([]);
    setMoves(0);
    setElapsed(0);
    setStarted(false);
    setLocked(false);
    setMatchStreak(0);
    setMisses(0);
    setInspections(0);
    setRosieMood("watching");
    setMessage("A fresh examination board. Doctor Rosie is ready when you are.");
  }

  function chooseCard(index) {
    if (locked || complete || openCards.includes(index) || matched.includes(deck[index].id)) return;
    if (!started) setStarted(true);

    if (openCards.length === 0) {
      setOpenCards([index]);
      const nextInspection = inspections + 1;
      setInspections(nextInspection);
      // A first pick is a continuation of the examination, not a reset to neutral.
      // Alternating reactions makes Rosie feel like she is following the player.
      if (rosieMood === "watching") {
        setRosieMood("focused");
        setMessage("Rosie has the loupe out. Choose its companion.");
      } else if (rosieMood === "distraught" || rosieMood === "embarrassed") {
        setRosieMood("focused");
        setMessage("A second opinion, then. Rosie is watching closely.");
      } else if (nextInspection % 3 === 0) {
        setRosieMood("amused");
        setMessage("Interesting. Continue, if you dare.");
      } else {
        setRosieMood("focused");
        setMessage("Rosie is considering the evidence.");
      }
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
      pendingFlipRef.current = window.setTimeout(() => {
        setMatched((items) => [...items, first.id]);
        setOpenCards([]);
        setLocked(false);
        const nextStreak = matchStreak + 1;
        setMatchStreak(nextStreak);
        setMisses(0);
        setRosieMood(matched.length + 1 === CHEESES.length ? "elated" : nextStreak >= 3 ? "proud" : "pleased");
        setMessage(matched.length + 1 === CHEESES.length
          ? "You pass. Rosie is genuinely impressed."
          : nextStreak >= 3
            ? "A remarkable run. Rosie is almost visibly proud."
            : nextStreak > 1
              ? "Another correct pairing. Your palate may yet be salvageable."
            : "Correct. Your palate may yet be salvageable.");
        window.navigator.vibrate?.([18, 26, 18]);
      }, 430);
    } else {
      pendingFlipRef.current = window.setTimeout(() => {
        setOpenCards([]);
        setLocked(false);
        const nextMisses = misses + 1;
        setMisses(nextMisses);
        setMatchStreak(0);
        setRosieMood(nextMisses > 1 ? "distraught" : "embarrassed");
        setMessage(nextMisses > 1
          ? "Unconvincing. Doctor Rosie expected better."
          : "Oh, dear. Rosie saw that.");
      }, 850);
    }
  }

  return (
    <main className="cheese-game-page">
      <section className="cheese-desktop-layout">
        <aside className="cheese-left-rail">
          <section className="cheese-exam-header" aria-labelledby="cheese-exam-title">
            <div className="cheese-exam-portrait">
              <img
                src="/rosie-doctor-cheese-hero.webp"
                alt="Rosie, Doctor of Cheese, administering the practical exam"
              />
              <span>EXAMINER</span>
            </div>

            <div className="cheese-exam-title">
              <div className="cheese-eyebrow">THE PRACTICAL EXAM</div>
              <h1 id="cheese-exam-title">ROSIE'S CHEESE BOARD EXAM</h1>
              <p>A memory game for serious cheese scholars.</p>

              <div className="cheese-header-status" aria-label="Current exam status">
                <div><span>PAIRS</span><strong>{matched.length}/{CHEESES.length}</strong></div>
                <div><span>MOVES</span><strong>{moves}</strong></div>
                <div><span>TIME</span><strong>{formatGameTime(elapsed)}</strong></div>
              </div>
            </div>

            <div className="cheese-header-seal" aria-hidden="true">
              <span className="seal-paw">🐾</span>
              <strong>Che.D.</strong>
              <small>BOARD EXAM</small>
            </div>

            <button type="button" className="cheese-reset-button cheese-reset-left" onClick={resetGame}>
              <span aria-hidden="true">↻</span>
              NEW BOARD
            </button>
          </section>
        </aside>

        <section className="cheese-game-frame" aria-label="Cheese matching board">
          <div className="cheese-game-heading">
            <div>
              <span>BOARD ONE · PRACTICAL MEMORY</span>
              <h2>Pair the Fromage</h2>
            </div>
            <p>Eight cheeses. Sixteen cards. Rosie is watching every move.</p>
          </div>

          <div className="cheese-grid">
            {deck.map((cheese, index) => {
              const faceUp = openCards.includes(index) || matched.includes(cheese.id);
              const isMatched = matched.includes(cheese.id);
              return (
                <button
                  type="button"
                  className={"cheese-card" + (faceUp ? " is-flipped" : "") + (isMatched ? " is-matched" : "")}
                  key={cheese.cardId}
                  onClick={() => chooseCard(index)}
                  aria-label={faceUp ? cheese.name : "Face-down cheese card"}
                >
                  <span className="cheese-card-inner">
                    <span className="cheese-card-back">
                      <span className="cheese-back-corner cheese-back-corner-tl" aria-hidden="true" />
                      <span className="cheese-back-corner cheese-back-corner-tr" aria-hidden="true" />
                      <span className="cheese-back-corner cheese-back-corner-bl" aria-hidden="true" />
                      <span className="cheese-back-corner cheese-back-corner-br" aria-hidden="true" />
                      <span className="cheese-back-ornament" aria-hidden="true">
                        <span className="cheese-back-seal">
                          <span className="cheese-back-paw">
                            <i /><i /><i /><i /><b />
                          </span>
                          <span className="cheese-back-wedge"><i /><i /><i /></span>
                        </span>
                        <strong>ROSIE'S</strong>
                        <span className="cheese-back-ribbon">CHEESE BOARD</span>
                        <small>THE PRACTICAL EXAM</small>
                      </span>
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

        <aside className="cheese-examiner-rail" aria-label="Doctor Rosie's live reaction">
          <div className={"rosie-reaction mood-" + rosieMood} aria-live="polite">
            <div className="reaction-effects" aria-hidden="true"><b /><b /><b /><b /><b /></div>
            <div className="rosie-reaction-portrait">
              <img key={rosieMood} src={ROSIE_MOOD_ART[rosieMood]} alt={"Doctor Rosie looking " + rosieMood} />
            </div>
            <div className="reaction-copy">
              <span>DOCTOR ROSIE'S FIELD NOTES · {rosieMood.toUpperCase()}</span>
              <strong>{message}</strong>
            </div>
            <i aria-hidden="true">{rosieMood === "elated" || rosieMood === "proud" ? "✦" : rosieMood === "distraught" ? "!" : rosieMood === "pleased" ? "✦" : rosieMood === "embarrassed" ? "♡" : rosieMood === "focused" ? "⌕" : "◌"}</i>
          </div>
          <button type="button" className="cheese-reset-button cheese-reset-mobile" onClick={resetGame}>
            <span aria-hidden="true">↻</span>
            NEW BOARD
          </button>
        </aside>
      </section>

      {complete && (
        <section className="cheese-victory" aria-live="polite">
          <div className="victory-sparkles" aria-hidden="true"><b>✦</b><b>✦</b><b>✦</b></div>
          <img className="victory-rosie" src="/rosie-mood-proud.webp" alt="A proud Doctor Rosie holding a gold paw medal" />
          <span>THE GOLDEN PAW HONOURS</span>
          <h2>Rosie awards you a most distinguished pass.</h2>
          <p>{moves} moves · {formatGameTime(elapsed)} · All {CHEESES.length} cheeses correctly identified.</p>
          <button type="button" onClick={resetGame}>DEFEND THE DISSERTATION AGAIN</button>
        </section>
      )}
    </main>
  );
}

const CAPTAIN_PICKUPS = [
  { kind: "ball", icon: "🎾", label: "Tennis ball", points: 10, turbo: 12 },
  { kind: "treat", icon: "🦴", label: "Captain's treat", points: 20, turbo: 18 },
  { kind: "cheese", icon: "", label: "Golden Cheese", points: 40, turbo: 30 },
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
  if (score >= 900) return { title: "Admiral of Treats", mark: "S", copy: "A voyage worthy of the House of Rosie." };
  if (score >= 650) return { title: "Commodore", mark: "A", copy: "Impeccable yachtcraft. Rosie is visibly impressed." };
  if (score >= 430) return { title: "First Officer", mark: "B", copy: "A highly respectable command performance." };
  if (score >= 250) return { title: "Able Seadog", mark: "C", copy: "Solid seamanship. More treats would help." };
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

function CaptainPickupIcon({ kind }) {
  if (kind === "ball") {
    return <svg className="pickup-art pickup-art-ball" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" /><path d="M12 22c11 1 18 8 19 20M52 42c-11-1-18-8-19-20" /><path d="M24 12c-1 11-8 18-20 19M40 52c1-11 8-18 20-19" /></svg>;
  }
  if (kind === "treat") {
    return <svg className="pickup-art pickup-art-treat" viewBox="0 0 64 64" aria-hidden="true"><path d="M18 23a10 10 0 1 1-7-13 10 10 0 0 1 13 7l17 17a10 10 0 1 1 7 13 10 10 0 0 1-13 7L18 37a10 10 0 1 1 0-14Z" /></svg>;
  }
  return <svg className="pickup-art pickup-art-buoy" viewBox="0 0 64 64" aria-hidden="true"><path d="M27 8h10l3 9-3 5 8 27H19l8-27-3-5Z" /><path d="M19 38h26M22 48h20" /><path d="M24 56h16" /></svg>;
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
    <div className="yacht-illustration" aria-label="Captain Rosie commanding the ROSIE I">
      <div className="yacht-vector-shadow" aria-hidden="true" />
      <div className="captain-at-helm" aria-hidden="true">
        <CaptainRosieIllustration className="helm-rosie-art" />
        <span className="captain-window-glint" />
      </div>

      <svg className="rosie-yacht-base" viewBox="0 0 320 210" aria-hidden="true">
        <defs>
          <linearGradient id="captainHullIvory" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffdf4" />
            <stop offset=".56" stopColor="#f0dfc0" />
            <stop offset="1" stopColor="#b89969" />
          </linearGradient>
          <linearGradient id="captainHullNavy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#173f61" />
            <stop offset=".48" stopColor="#0b2946" />
            <stop offset="1" stopColor="#04172b" />
          </linearGradient>
          <linearGradient id="captainTeak" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8f552e" />
            <stop offset=".3" stopColor="#d7aa70" />
            <stop offset=".57" stopColor="#f2d39f" />
            <stop offset=".82" stopColor="#b8753d" />
            <stop offset="1" stopColor="#744126" />
          </linearGradient>
          <linearGradient id="captainBrass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff0ad" />
            <stop offset=".34" stopColor="#e0b65b" />
            <stop offset=".72" stopColor="#8f5d23" />
            <stop offset="1" stopColor="#f1ce78" />
          </linearGradient>
        </defs>

        <path d="M26 124c38-16 82-23 134-23s96 7 134 23l-29 58c-30 17-65 25-105 25s-75-8-105-25Z" fill="url(#captainHullIvory)" stroke="#956322" strokeWidth="3" />
        <path d="M44 153c72 17 160 17 232 0l-14 30c-31 15-65 22-102 22-38 0-72-7-103-22Z" fill="url(#captainHullNavy)" />
        <path d="M47 149c72 12 154 12 226 0" fill="none" stroke="url(#captainBrass)" strokeWidth="5" />
        <path d="M68 116c52-16 113-18 184-5l14 12c-72 9-143 9-213 0Z" fill="url(#captainTeak)" stroke="#744426" strokeWidth="2.5" />
        <path d="M92 108 110 58c5-14 15-22 31-25h39c16 3 26 11 31 25l18 50Z" fill="#f7efde" stroke="#b38136" strokeWidth="3" />
        <path d="M102 102h116" stroke="#dfbd71" strokeWidth="3" />
        <path d="M74 120c57-7 115-8 173-1" fill="none" stroke="#fffdf4" strokeWidth="2.5" opacity=".8" />

        <path d="M257 88V31" stroke="#bd8d3c" strokeWidth="3" />
        <path d="M259 34c18 2 34 7 49 16-13 8-30 11-49 11Z" fill="#12385a" stroke="#e0b65b" strokeWidth="2" />
        <text x="274" y="52" fontSize="12" fontWeight="900" fill="#f7d98a">R</text>

        <text x="160" y="190" textAnchor="middle" fontSize="12" fontWeight="900" letterSpacing="4" fill="#f3d47f">ROSIE I</text>
        <g fill="#d7aa51">
          <circle cx="151" cy="137" r="2.8" />
          <circle cx="160" cy="133" r="2.8" />
          <circle cx="169" cy="137" r="2.8" />
          <path d="M152 147c0-5.5 3.6-9 8-9s8 3.5 8 9c0 3.8-3 5.8-8 5.8s-8-2-8-5.8Z" />
        </g>
      </svg>

      <svg className="rosie-yacht-overlay" viewBox="0 0 320 210" aria-hidden="true">
        <defs>
          <linearGradient id="captainGlassOverlay" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#effcff" stopOpacity=".46" />
            <stop offset=".45" stopColor="#95d8e7" stopOpacity=".13" />
            <stop offset="1" stopColor="#0a5476" stopOpacity=".35" />
          </linearGradient>
        </defs>
        <path d="M111 58h98l22 52H90Z" fill="url(#captainGlassOverlay)" stroke="#dbb25d" strokeWidth="3" />
        <path d="M160 58v51M109 59 91 108m120-49 20 49" fill="none" stroke="#dbb25d" strokeWidth="2.5" opacity=".9" />
        <path d="M117 67c20-8 35-10 44-10" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity=".23" />
      </svg>

      <span className="captain-scarf-tail" aria-hidden="true" />
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

function CaptainRosieGame({ soundOn }) {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(45);
  const [lane, setLane] = useState(1);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("Captain Rosie is on the bridge. The coastal passage is clear and the treats are somewhere ahead.");
  const [best, setBest] = useState(() => {
    const value = Number(localStorage.getItem("captainRosieBest") || 0);
    return Number.isFinite(value) ? value : 0;
  });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [combo, setCombo] = useState(1);
  const [turbo, setTurbo] = useState(0);
  const [boost, setBoost] = useState(false);
  const [cheeses, setCheeses] = useState(0);
  const [eventPulse, setEventPulse] = useState(0);
  const [eventKind, setEventKind] = useState("ball");
  const [phaseNotice, setPhaseNotice] = useState("");
  const [ended, setEnded] = useState(false);

  const laneRef = useRef(1);
  const spawnClockRef = useRef(0);
  const itemIdRef = useRef(0);
  const finishedRef = useRef(false);
  const boostRef = useRef(false);
  const streakRef = useRef(0);
  const comboRef = useRef(1);
  const touchStartRef = useRef(null);
  const audioRef = useRef(null);
  const lastPhaseRef = useRef("harbor");

  const phaseKey = timeLeft > 30 ? "harbor" : timeLeft > 15 ? "riviera" : "sunset";
  const phase = CAPTAIN_PHASES[phaseKey];
  const elapsed = 45 - timeLeft;
  const routeProgress = Math.min(100, Math.round(elapsed / 45 * 100));
  const missionProgress = Math.min(100, Math.round(score / 6.5));
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

  function moveCaptain(direction) {
    if (!running) return;
    setLane((current) => {
      const next = Math.max(0, Math.min(2, current + direction));
      laneRef.current = next;
      return next;
    });
  }

  function steerTo(nextLane) {
    if (!running) return;
    const safeLane = Math.max(0, Math.min(2, nextLane));
    laneRef.current = safeLane;
    setLane(safeLane);
  }

  function finishGame(reason) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    boostRef.current = false;
    setBoost(false);
    setRunning(false);
    setEnded(true);
    setMessage(reason);
    captainTone("finish");
  }

  function startGame() {
    audioContext();
    finishedRef.current = false;
    boostRef.current = false;
    streakRef.current = 0;
    comboRef.current = 1;
    spawnClockRef.current = 0;
    laneRef.current = 1;
    lastPhaseRef.current = "harbor";
    setLane(1);
    setItems([]);
    setScore(0);
    setLives(3);
    setTimeLeft(45);
    setStreak(0);
    setBestStreak(0);
    setCombo(1);
    setTurbo(0);
    setBoost(false);
    setCheeses(0);
    setEnded(false);
    setPhaseNotice("GOLDEN HARBOR");
    setMessage("Lines cast off. Tennis balls are 10, treats are 20, Golden Cheese is 40. Keep clear of the red buoys.");
    setRunning(true);
    window.setTimeout(() => setPhaseNotice(""), 1500);
  }

  function engageBoost() {
    if (!running || boostRef.current || turbo < 100) return;
    boostRef.current = true;
    setBoost(true);
    setTurbo(0);
    setMessage("FULL STEAM. Captain Rosie's golden wake doubles every score for six seconds.");
    pulse("boost");
    captainTone("boost");
    window.navigator.vibrate?.([20, 25, 20, 25, 35]);
    window.setTimeout(() => {
      boostRef.current = false;
      setBoost(false);
      setMessage("Boost complete. Return to elegant, responsible yacht speeds.");
    }, 6000);
  }

  function onCoursePointerDown(event) {
    touchStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function onCoursePointerUp(event) {
    if (!running || !touchStartRef.current) return;
    const startPoint = touchStartRef.current;
    touchStartRef.current = null;
    const deltaX = event.clientX - startPoint.x;
    if (Math.abs(deltaX) > 26) {
      moveCaptain(deltaX > 0 ? 1 : -1);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    steerTo(ratio < .333 ? 0 : ratio > .666 ? 2 : 1);
  }

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          finishGame("Port Rosie reached. Captain Rosie has entered the voyage in the official treat ledger.");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (phaseKey === lastPhaseRef.current) return;
    lastPhaseRef.current = phaseKey;
    const next = CAPTAIN_PHASES[phaseKey];
    setPhaseNotice(next.name.toUpperCase());
    setMessage(next.copy);
    captainTone(phaseKey === "sunset" ? "cheese" : "ball");
    window.setTimeout(() => setPhaseNotice(""), 1500);
  }, [phaseKey, running]);

  useEffect(() => {
    if (!running) return undefined;

    const tick = window.setInterval(() => {
      let scoreDelta = 0;
      let turboDelta = 0;
      let lifeLoss = 0;
      let cheeseGain = 0;
      let lastHit = "";
      let missedGood = false;

      setItems((current) => {
        spawnClockRef.current += 70;
        const phaseSpeed = phaseKey === "harbor" ? 0 : phaseKey === "riviera" ? .35 : .75;
        const next = current.map((item) => ({ ...item, y: item.y + item.speed + phaseSpeed }));

        const spawnEvery = phaseKey === "harbor" ? 650 : phaseKey === "riviera" ? 560 : 485;
        if (spawnClockRef.current >= spawnEvery) {
          spawnClockRef.current = 0;
          const roll = secureIndex(100);
          const template = roll < 52
            ? CAPTAIN_PICKUPS[0]
            : roll < 77
              ? CAPTAIN_PICKUPS[1]
              : roll < 86
                ? CAPTAIN_PICKUPS[2]
                : CAPTAIN_PICKUPS[3];
          next.push({
            ...template,
            id: itemIdRef.current += 1,
            lane: secureIndex(3),
            y: -12,
            speed: 1.75 + secureIndex(8) / 10
          });
        }

        return next.filter((item) => {
          const inCatchZone = item.y >= 77 && item.y <= 92;
          if (inCatchZone && item.lane === laneRef.current) {
            if (item.kind === "buoy") {
              lifeLoss += 1;
              lastHit = "buoy";
              streakRef.current = 0;
              comboRef.current = 1;
            } else {
              streakRef.current += 1;
              comboRef.current = Math.min(4, 1 + Math.floor(streakRef.current / 4));
              const multiplier = comboRef.current * (boostRef.current ? 2 : 1);
              scoreDelta += item.points * multiplier;
              turboDelta += item.turbo;
              lastHit = item.kind;
              if (item.kind === "cheese") cheeseGain += 1;
            }
            return false;
          }
          if (item.y >= 108) {
            if (item.kind !== "buoy") missedGood = true;
            return false;
          }
          return true;
        });
      });

      if (missedGood && !scoreDelta) {
        streakRef.current = 0;
        comboRef.current = 1;
        setStreak(0);
        setCombo(1);
      }

      if (scoreDelta) {
        setScore((current) => current + scoreDelta);
        setStreak(streakRef.current);
        setCombo(comboRef.current);
        setBestStreak((current) => Math.max(current, streakRef.current));
        setTurbo((current) => Math.min(100, current + turboDelta));
        if (cheeseGain) setCheeses((current) => current + cheeseGain);
        const phrase = lastHit === "cheese"
          ? "Golden Cheese aboard. Rosie has inventoried it as priceless cargo."
          : lastHit === "treat"
            ? "Premium provisions aboard. Rosie considers this excellent leadership."
            : comboRef.current > 1
              ? "Clean pickup. The captain's streak is building."
              : "Tennis ball aboard. Course maintained.";
        setMessage(phrase);
        pulse(lastHit);
        captainTone(lastHit);
        window.navigator.vibrate?.(lastHit === "cheese" ? [18, 24, 28] : 15);
      }

      if (lifeLoss) {
        setStreak(0);
        setCombo(1);
        setLives((current) => {
          const next = Math.max(0, current - lifeLoss);
          pulse("buoy");
          captainTone("buoy");
          if (next === 0) {
            finishGame("The hull has had enough adventure. Captain Rosie is returning to port under protest.");
          } else {
            setMessage("BUOY STRIKE. Rosie has issued a formal glare from the bridge.");
            window.navigator.vibrate?.([55, 35, 55]);
          }
          return next;
        });
      }
    }, 70);

    return () => window.clearInterval(tick);
  }, [running, phaseKey]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveCaptain(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveCaptain(1);
      }
      if ((event.key === "ArrowUp" || event.key.toLowerCase() === "b") && running) {
        event.preventDefault();
        engageBoost();
      }
      if ((event.key === " " || event.key === "Enter") && !running) {
        event.preventDefault();
        startGame();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [running, turbo]);

  useEffect(() => {
    if (running || !ended) return;
    setBest((current) => {
      const next = Math.max(current, score);
      localStorage.setItem("captainRosieBest", String(next));
      return next;
    });
  }, [running, ended, score]);

  return (
    <main className={"captain-game-page captain-phase-" + phaseKey + (boost ? " captain-boosting" : "")}>
      <section className="captain-hero">
        <div className="captain-hero-rigging" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="captain-portrait">
          <div className="captain-portrait-medallion" aria-hidden="true"><i /><i /><i /></div>
          <CaptainRosieIllustration className="hero-captain-illustration" idPrefix="heroRosie" />
          <span><RosiePawCrest className="portrait-paw" /> CAPTAIN ON DECK</span>
        </div>
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
            <small>Command the ROSIE I through a luminous coastal passage - collect prized cargo, secure the Golden Cheese and bring the captain home in style.</small>
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
        <div className="route-port route-destination"><b><RosiePawCrest className="route-paw-crest" /></b><span>SUNSET COVE</span></div>
      </section>

      <section className="captain-hud" aria-label="Yacht game status">
        <div><span>SCORE</span><strong>{score}</strong></div>
        <div><span>TIME</span><strong>{timeLeft}s</strong></div>
        <div><span>HULL</span><strong className="captain-lives">{Array.from({ length: 3 }, (_, index) => index < lives ? "●" : "○").join(" ")}</strong></div>
        <div><span>STREAK</span><strong>{streak}</strong></div>
        <div className={"combo-cell" + (combo > 1 ? " is-hot" : "")}><span>MULTIPLIER</span><strong>x{combo}{boost ? " ×2" : ""}</strong></div>
      </section>

      <section className="yacht-game-shell">
        <div className="yacht-game-sign">
          <span className="captain-seal"><RosiePawCrest className="game-sign-paw" /></span>
          <div>
            <strong>{phase.eyebrow} · {phase.name.toUpperCase()}</strong>
            <small>{message}</small>
          </div>
          <b>ROSIE I</b>
        </div>

        <div
          className={`yacht-course${running ? " is-underway" : ""}${boost ? " is-boosting" : ""}`}
          style={{ "--course-pace": boost ? "1.25s" : running ? "3.1s" : "8s" }}
          aria-label="Three-lane yacht course. Swipe, tap a lane, or use the controls below to steer."
          onPointerDown={onCoursePointerDown}
          onPointerUp={onCoursePointerUp}
        >
          <RivieraCourseArt />
          <CaptainCourseMotion phaseKey={phaseKey} underway={running} boost={boost} />
          <div className="captain-sky" aria-hidden="true">
            <div className="captain-sky-haze" />
            <div className="captain-sun"><i /></div>
            <div className="captain-cloud cloud-one"><i /><i /><i /></div>
            <div className="captain-cloud cloud-two"><i /><i /><i /></div>
            <div className="captain-cloud cloud-three"><i /><i /><i /></div>
            <div className="captain-gulls"><i /><i /><i /></div>
          </div>
          <div className="riviera-mountains mountains-far" aria-hidden="true" />
          <div className="riviera-mountains mountains-near" aria-hidden="true" />
          <div className="captain-horizon" aria-hidden="true">
            <div className="riviera-cliff cliff-left"><i /><i /><i /><i /></div>
            <div className="riviera-cliff cliff-right"><i /><i /><i /></div>
            <div className="horizon-villas villas-left" />
            <div className="horizon-villas villas-right" />
            <div className="captain-lighthouse"><i /><b /></div>
            <div className="distant-yacht distant-yacht-one"><i /><b /></div>
            <div className="distant-yacht distant-yacht-two"><i /><b /></div>
          </div>
          <div className="sun-glint" aria-hidden="true" />
          <div className="water-depth-bands" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="wake-lines" aria-hidden="true" />
          <div className="lane-line lane-line-a" aria-hidden="true" />
          <div className="lane-line lane-line-b" aria-hidden="true" />
          <div className="sea-sparkles" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i />
          </div>

          <div className="captain-course-banner">
            <span>{phase.eyebrow}</span>
            <strong>{phase.name}</strong>
          </div>

          {phaseNotice && <div className="captain-phase-notice">{phaseNotice}</div>}

          {items.map((item) => (
            <div
              className={"sea-pickup sea-pickup-" + item.kind}
              key={item.id}
              style={{ left: "calc(" + (16.666 + item.lane * 33.333) + "% - 23px)", top: item.y + "%" }}
              aria-label={item.label}
            >
              {item.kind === "cheese" ? <GoldenCheeseIcon /> : <CaptainPickupIcon kind={item.kind} />}
              {item.kind === "cheese" && <small>GOLDEN</small>}
            </div>
          ))}

          {eventPulse > 0 && (
            <div className={"captain-burst burst-" + eventKind} key={eventPulse} aria-hidden="true">
              <i>✦</i><i>·</i><i>✦</i><i>·</i><i>✦</i><i>·</i>
            </div>
          )}

          <div className={"captain-yacht lane-" + lane + (boost ? " yacht-boost" : "")}>
            <CaptainYachtArt boost={boost} />
          </div>

          {!running && (
            <div className={"captain-start-panel" + (ended ? " captain-results-panel" : "")}>
              <CaptainRosieIllustration className="start-panel-rosie" idPrefix="startRosie" />
              {ended ? (
                <>
                  <span>CAPTAIN'S LOG · VOYAGE COMPLETE</span>
                  <div className="voyage-grade">{rank.mark}</div>
                  <strong>{rank.title}</strong>
                  <p>{rank.copy}</p>
                  <div className="voyage-stats">
                    <span><b>{score}</b> score</span>
                    <span><b>{bestStreak}</b> best streak</span>
                    <span><b>{cheeses}</b> Golden Cheese</span>
                  </div>
                  <button type="button" onClick={startGame}>SAIL AGAIN</button>
                </>
              ) : (
                <>
                  <span>CAPTAIN ROSIE AWAITS YOUR ORDERS</span>
                  <strong>Take the Helm</strong>
                  <p>Swipe or tap across three lanes. Build streaks to raise your multiplier. Fill the brass gauge and unleash Full Steam for double points.</p>
                  <div className="start-mission">
                    <span><b>650</b> Admiral target</span>
                    <span><b className="mini-cheese-count"><GoldenCheeseIcon compact /></b> Golden Cheese</span>
                    <span><b>3</b> Hull integrity</span>
                  </div>
                  <button type="button" onClick={startGame}>CAST OFF</button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="captain-command-deck">
          <button type="button" className="helm-button" onClick={() => moveCaptain(-1)} disabled={!running} aria-label="Steer port">
            <span>◀</span><small>PORT</small>
          </button>

          <button
            type="button"
            className={"boost-control" + (turbo >= 100 ? " boost-ready" : "") + (boost ? " boost-active" : "")}
            onClick={engageBoost}
            disabled={!running || turbo < 100 || boost}
            aria-label={"Full Steam boost " + turbo + " percent charged"}
          >
            <span className="boost-ring" style={{ "--boost": turbo + "%" }}>
              <b>{boost ? "2×" : turbo >= 100 ? "GO" : turbo}</b>
            </span>
            <span className="boost-copy">
              <strong>{boost ? "FULL STEAM" : "CAPTAIN'S GAUGE"}</strong>
              <small>{boost ? "DOUBLE SCORE ACTIVE" : turbo >= 100 ? "TAP FOR DOUBLE POINTS" : "COLLECT TO CHARGE"}</small>
            </span>
          </button>

          <button type="button" className="helm-button" onClick={() => moveCaptain(1)} disabled={!running} aria-label="Steer starboard">
            <span>▶</span><small>STARBOARD</small>
          </button>
        </div>

        <div className="captain-cargo-key">
          <span><b className="cargo-ball">🎾</b><i>+10</i>Tennis</span>
          <span><b className="cargo-treat">🦴</b><i>+20</i>Treat</span>
          <span><b className="cargo-cheese"><GoldenCheeseIcon compact /></b><i>+40</i>Cheese</span>
          <span><b className="cargo-buoy">◆</b><i>-1</i>Buoy</span>
          <span className="mission-meter"><i style={{ width: missionProgress + "%" }} /><em>{missionProgress}% to Admiral target</em></span>
        </div>
      </section>
    </main>
  );
}


function App() {
  const [loaded, setLoaded] = useState(false);
  // Captain's audio uses this shared setting. It must exist before the Captain
  // component mounts - an undefined value previously made that tab crash.
  const [soundOn] = useState(true);
  const validPages = ["fortune", "cheese", "captain", "captain2", "vault"];
  const pageFromLocation = () => {
    const requested = window.location.hash.replace("#", "").toLowerCase();
    return validPages.includes(requested) ? requested : "fortune";
  };
  const [page, setPage] = useState(pageFromLocation);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [consulting, setConsulting] = useState(false);
  const [toast, setToast] = useState("");
  const [history, setHistory] = useState([]);
  const [flipped, setFlipped] = useState(false);
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
    const onHashChange = () => setPage(pageFromLocation());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigateTo(nextPage) {
    if (!validPages.includes(nextPage)) return;
    if (window.location.hash !== `#${nextPage}`) {
      window.location.hash = nextPage;
    } else {
      setPage(nextPage);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reshufflePrompts() {
    setQuickQuestions(samplePrompts(4));
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
      window.navigator.vibrate?.([8, 20, 8]);
    }, 520);

    turnEndTimerRef.current = window.setTimeout(() => {
      setTurning(false);
    }, 1320);
  }

  function toggleDictation() {
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

    try {
      recognition.start();
    } catch {
      setListening(false);
      setDictationStatus("idle");
    }
  }

  function askRosie(event) {
    event.preventDefault();
    if (!question.trim() || consulting) {
      inputRef.current?.focus();
      return;
    }

    primeAudio();
    window.clearTimeout(revealTimerRef.current);
    window.clearTimeout(revealFinishTimerRef.current);
    setAnswer(null);
    setAnswerDismissed(false);
    setRevealStage("consulting");
    setConsulting(true);

    const result = chooseFortune();
    const askedQuestion = question.trim();
    const delay = 1350 + secureIndex(650);

    revealTimerRef.current = window.setTimeout(() => {
      setAnswer(result);
      setConsulting(false);
      setRevealStage("manifesting");
      setHistory((items) => [
        { question: askedQuestion, answer: result.text, tone: result.tone },
        ...items
      ].slice(0, 5));

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
    setAnswer(null);
    setAnswerDismissed(false);
    setConsulting(false);
    setRevealStage("idle");
    reshufflePrompts();
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }

  function saveFortune() {
    if (!answer) return;
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("rosieSavedFortunes") || "[]");
    } catch {}

    saved.unshift({
      question: question.trim(),
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
    const text = `I asked Madame Rosie: “${question.trim()}”\nRosie said: “${answer.text}”`;

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
    inputRef.current?.focus();
  }

  return (
    <>
      <div className={`loading-screen ${loaded ? "loading-screen-hidden" : ""}`}>
        <div className="loading-orb"><span>🐾</span></div>
        <div className="loading-title">ROSIE</div>
        <div className="loading-copy">Consulting the ancient treat ledger…</div>
      </div>

      <div className={`app-shell ${loaded ? "app-shell-visible" : ""} ${page === "cheese" ? "is-cheese-page" : ""} ${page === "vault" ? "is-vault-page" : ""}`}>

        {page === "fortune" ? (
        <main>
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
            />

            <div className="console-caption">
              <span>FORTUNES · ADVICE · HIGHLY QUALIFIED OPINIONS</span>
              <button
                type="button"
                className="fortune-whistle-button"
                aria-label="Whistle for Rosie"
                title="Whistle for Rosie"
                onClick={whistleForRosie}
              >
                <b aria-hidden="true">♪</b>
                <small>WHISTLE FOR ROSIE</small>
              </button>
            </div>

            <form className="question-card" onSubmit={askRosie}>
              <div className="console-rivets" aria-hidden="true"><i /><i /><i /><i /></div>
              <div className="question-heading">
                <span className="question-kicker">PETITION THE ORACLE</span>
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
                      setQuestion(event.target.value);
                      if (dictationStatus === "captured") setDictationStatus("idle");
                    }}
                    maxLength={160}
                    autoComplete="off"
                    enterKeyHint="go"
                    placeholder="Should I text them back?"
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

              <div className="quick-row">
                <div className="quick-prompts">
                  {quickQuestions.map((prompt) => (
                    <button type="button" key={prompt} onClick={() => choosePrompt(prompt)}>
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="console-foot">
                <button type="button" className="footer-shuffle" onClick={reshufflePrompts} aria-label="Show different sample questions" title="Different questions">
                  <span aria-hidden="true">↻</span>
                  Different questions
                </button>
                <strong>{consultations} question{consultations === 1 ? "" : "s"} asked tonight</strong>
              </div>
            </form>
          </div>

          <section className={`fortune-ticket ${answer && (revealStage === "revealed" || revealStage === "dismissing") ? "fortune-ticket-visible" : ""}`} aria-live="polite">
            {answer && (
              <div className="ticket-paper">
                <span className="ticket-corner ticket-corner-tl" aria-hidden="true">✦</span>
                <span className="ticket-corner ticket-corner-tr" aria-hidden="true">✦</span>
                <span className="ticket-corner ticket-corner-bl" aria-hidden="true">✦</span>
                <span className="ticket-corner ticket-corner-br" aria-hidden="true">✦</span>

                <div className="ticket-topline">
                  <span>FORTUNE № {String(consultations).padStart(3, "0")}</span>
                  <strong>MADAME ROSIE</strong>
                  <span>PRIVATE ORACLE</span>
                </div>

                <div className="ticket-oracle-mark" aria-hidden="true">
                  <span>✦</span><b>🐾</b><span>✦</span>
                </div>

                <div className="ticket-question">“{question.trim()}”</div>
                <div className="ticket-answer">{answer.text}</div>

                <div className="ticket-stamp"><span aria-hidden="true">🐾</span> THE PAW HAS SPOKEN</div>

                <div className="answer-actions">
                  <button onClick={askAnother}>ASK ANOTHER</button>
                  <button className="secondary" onClick={saveFortune}>SAVE</button>
                  <button className="secondary" onClick={shareFortune}>SHARE</button>
                </div>
              </div>
            )}
          </section>

          {history.length > 1 && (
            <section className="session-history">
              <div className="history-title">RECENT FORTUNES</div>
              <div className="history-list">
                {history.slice(1).map((item, index) => (
                  <div className="history-item" key={`${item.question}-${index}`}>
                    <span className={`history-dot tone-${item.tone}`} />
                    <div>
                      <strong>{item.question}</strong>
                      <small>{item.answer}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="omen-rail bottom-omens" aria-label="Today's omens">
            <div className="omen-title">
              <span>✦</span>
              TODAY'S OMENS
              <span>✦</span>
            </div>
            <div className="omen-grid">
              <div><small>LUCKY TREAT</small><strong>{daily.treat}</strong></div>
              <div><small>AUSPICIOUS HOUR</small><strong>{daily.hour}</strong></div>
              <div><small>AVOID</small><strong>{daily.avoid}</strong></div>
            </div>
          </section>
        </main>
        ) : page === "cheese" ? (
          <CheeseMemoryGame />
        ) : page === "captain" ? (
          <CaptainRosieGame soundOn={soundOn} />
        ) : page === "captain2" ? (
          <Captain2Game soundOn={soundOn} />
        ) : (
          <RosieCardVault onExit={() => navigateTo("fortune")} />
        )}

        <nav className="bottom-nav" aria-label="Primary">
          <button className={page === "fortune" ? "active" : ""} onClick={() => navigateTo("fortune")}><span>✦</span><small>Fortune</small></button>
          <button className={page === "cheese" ? "active" : ""} onClick={() => navigateTo("cheese")}><span>♛</span><small>Cheese</small></button>
          <button className={page === "captain" ? "active" : ""} onClick={() => navigateTo("captain")}><span>⚓</span><small>Captain</small></button>
          <button className={page === "captain2" ? "active" : ""} onClick={() => navigateTo("captain2")}><span>⛩</span><small>Captain 2</small></button>
          <button type="button" className={`vault-nav-button ${page === "vault" ? "active" : ""}`} aria-label="Open Card Vault" title="Card Vault" onClick={() => navigateTo("vault")}><span aria-hidden="true">▣</span><small>Vault</small></button>
        </nav>
      </div>

      <div className={`toast ${toast ? "toast-visible" : ""}`}>{toast}</div>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
