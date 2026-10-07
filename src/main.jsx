import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./fortune-effects.css";

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

          <div className="lantern-life" aria-hidden="true">
            <span className="lantern-glow lantern-glow-left"><i /></span>
            <span className="lantern-glow lantern-glow-right"><i /></span>
          </div>

          <div className="living-set" aria-hidden="true">
            <img className="set-piece set-piece-moon" src="/rosie-fortune-stage.webp" alt="" draggable="false" />
            <img className="set-piece set-piece-lantern-left" src="/rosie-fortune-stage.webp" alt="" draggable="false" />
            <img className="set-piece set-piece-lantern-right" src="/rosie-fortune-stage.webp" alt="" draggable="false" />
          </div>

          <span
            className={`rosie-turn-backdrop ${flipped ? "is-flipped" : ""} ${turning ? "is-turning" : ""}`}
            aria-hidden="true"
          />
          <img
            className={`rosie-turn-layer ${flipped ? "is-flipped" : ""} ${turning ? "is-turning" : ""}`}
            src="/rosie-turn-head.svg"
            alt=""
            aria-hidden="true"
            draggable="false"
          />
          <span className={`turn-seam-haze ${flipped ? "is-flipped" : ""}`} aria-hidden="true" />

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
  pleased: "/rosie-mood-pleased.webp",
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
    setRosieMood("watching");
    setMessage("A fresh examination board. Doctor Rosie is ready when you are.");
  }

  function chooseCard(index) {
    if (locked || complete || openCards.includes(index) || matched.includes(deck[index].id)) return;
    if (!started) setStarted(true);

    if (openCards.length === 0) {
      setOpenCards([index]);
      setRosieMood("amused");
      setMessage("Interesting. Continue, if you dare.");
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
        setRosieMood(matched.length + 1 === CHEESES.length ? "elated" : "pleased");
        setMessage(matched.length + 1 === CHEESES.length
          ? "You pass. Rosie is genuinely impressed."
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
      <section className="cheese-hero">
        <div className="cheese-hero-photo">
          <img
            src="/rosie-doctor-cheese-hero.webp"
            alt="Rosie, Doctor of Cheese, presiding over a candlelit cheese examination"
          />
        </div>

        <div className="cheese-hero-copy">
          <div className="cheese-eyebrow">UNIVERSITY OF BARKBRIDGE · FACULTY OF GASTRONOMIC SCIENCES</div>
          <h1>ROSIE'S CHEESE BOARD EXAM</h1>
          <p>A memory test for true cheese aficionados. Match every pair and prove yourself worthy.</p>
          <div className="doctor-ribbon">
            <img src="/rosie-doctor-cheese-hero.webp" alt="" aria-hidden="true" />
            <div>
              <strong>ROSIE THE SHIBA, Che.D.</strong>
              <small>Doctor Rosie is administering the exam</small>
            </div>
            <span className="doctor-seal">🐾</span>
          </div>
        </div>
      </section>

      <section className="cheese-game-frame">
        <div className="cheese-game-heading">
          <div>
            <span>THE PRACTICAL EXAM</span>
            <h2>Pair the Fromage</h2>
          </div>
          <p>Eight cheeses. Sixteen cards. Rosie will decide whether you pass.</p>
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
                    <img src="/cheese-exam-card-back.webp" alt="" draggable="false" />
                  </span>
                  <span className="cheese-card-front">
                    <span className="cheese-art"><CheesePhoto cheese={cheese} /></span>
                    <strong>{cheese.name}</strong>
                    <small>{cheese.note}</small>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="cheese-bottom-console">
        <div className={`rosie-reaction mood-${rosieMood}`} aria-live="polite">
          <div className="reaction-effects" aria-hidden="true"><b /><b /><b /><b /><b /></div>
          <div className="rosie-reaction-portrait">
            <img key={rosieMood} src={ROSIE_MOOD_ART[rosieMood]} alt={`Doctor Rosie looking ${rosieMood}`} />
          </div>
          <div className="reaction-copy"><span>DOCTOR ROSIE'S FIELD NOTES · {rosieMood.toUpperCase()}</span><strong>{message}</strong></div>
          <i aria-hidden="true">{rosieMood === "elated" ? "✦" : rosieMood === "distraught" ? "!" : rosieMood === "pleased" ? "✦" : rosieMood === "embarrassed" ? "♡" : "◌"}</i>
        </div>
        <section className="cheese-scorebar" aria-label="Game score">
          <div><span>MOVES</span><strong>{moves}</strong></div>
          <div><span>TIME</span><strong>{formatGameTime(elapsed)}</strong></div>
          <div><span>PAIRS</span><strong>{matched.length}/{CHEESES.length}</strong></div>
          <button type="button" onClick={resetGame}>NEW BOARD</button>
        </section>
      </section>

      {complete && (
        <section className="cheese-victory" aria-live="polite">
          <img className="victory-rosie" src="/rosie-doctor-cheese-hero.webp" alt="Rosie, Doctor of Cheese" />
          <span>BOARD EXAM PASSED</span>
          <h2>You pass. Doctor Rosie is pleased.</h2>
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
    <svg className="riviera-course-art" viewBox="0 0 1000 760" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="courseSkyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--course-sky-top)" />
          <stop offset=".64" stopColor="var(--course-sky-mid)" />
          <stop offset="1" stopColor="var(--course-sky-horizon)" />
        </linearGradient>
        <linearGradient id="courseSeaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--course-sea-top)" />
          <stop offset=".42" stopColor="var(--course-sea-mid)" />
          <stop offset="1" stopColor="var(--course-sea-bottom)" />
        </linearGradient>
        <linearGradient id="courseCliffGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d6b578" />
          <stop offset=".44" stopColor="#9d7748" />
          <stop offset="1" stopColor="#63492f" />
        </linearGradient>
        <linearGradient id="courseVillaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff5d9" />
          <stop offset="1" stopColor="#d9b77e" />
        </linearGradient>
        <linearGradient id="courseGreenGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#77935c" />
          <stop offset="1" stopColor="#315241" />
        </linearGradient>
        <radialGradient id="courseSunGlow">
          <stop offset="0" stopColor="#fff8c9" stopOpacity=".92" />
          <stop offset=".34" stopColor="#ffe39a" stopOpacity=".46" />
          <stop offset="1" stopColor="#ffe39a" stopOpacity="0" />
        </radialGradient>
        <pattern id="courseWaterPattern" width="160" height="70" patternUnits="userSpaceOnUse">
          <path d="M-20 34c35-15 70-15 105 0s70 15 105 0" fill="none" stroke="#dffcff" strokeOpacity=".14" strokeWidth="4" />
          <path d="M25 58c26-10 52-10 78 0s52 10 78 0" fill="none" stroke="#ffffff" strokeOpacity=".07" strokeWidth="2" />
        </pattern>
        <filter id="courseSoftCloud" x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <rect width="1000" height="330" fill="url(#courseSkyGradient)" />
      <circle className="riviera-sun-glow" cx="775" cy="112" r="118" fill="url(#courseSunGlow)" />
      <circle className="riviera-sun-disc" cx="775" cy="112" r="34" fill="var(--course-sun)" />

      <g className="riviera-clouds" fill="#fff8e9" opacity=".64" filter="url(#courseSoftCloud)">
        <path d="M95 98c30-30 70-21 80 8 27-17 63 2 58 31H52c2-25 21-40 43-39Z" />
        <path d="M563 74c20-23 52-18 61 5 22-13 49 2 47 25H526c2-19 17-31 37-30Z" opacity=".52" />
        <path d="M810 190c23-21 55-15 64 7 21-11 46 4 43 26H770c2-19 18-31 40-33Z" opacity=".4" />
      </g>

      <path d="M0 248c84-69 154-74 235-32 54-57 123-63 196-24 65-52 142-48 213 2 77-62 173-52 263 30 34-20 65-24 93-18v124H0Z" fill="#65868a" opacity=".4" />
      <path d="M0 279c95-62 189-58 282-4 79-59 172-61 278-6 86-45 174-44 264 2 66-33 125-35 176-9v68H0Z" fill="#6f8e82" opacity=".45" />

      <rect y="300" width="1000" height="460" fill="url(#courseSeaGradient)" />
      <rect y="300" width="1000" height="460" fill="url(#courseWaterPattern)" opacity=".72" />
      <path d="M0 304c210 13 359 13 503 0 164-15 325-14 497 2" fill="none" stroke="#fff4d5" strokeOpacity=".62" strokeWidth="5" />
      <path d="M610 315c72 30 123 78 156 143" fill="none" stroke="#fff8cd" strokeOpacity=".11" strokeWidth="34" strokeLinecap="round" />
      <path d="M618 314c72 35 117 82 148 140" fill="none" stroke="#fffbe5" strokeOpacity=".2" strokeWidth="8" strokeLinecap="round" />

      <g className="riviera-left-coast">
        <path d="M0 259c82 0 135 24 183 74 28 29 61 52 112 69-16 34-33 67-59 92-80-16-152-32-236-28Z" fill="url(#courseCliffGradient)" />
        <path d="M0 244c79-5 144 21 199 75 16 15 35 29 58 41-56-15-111-15-169-1-27-22-57-37-88-43Z" fill="url(#courseGreenGradient)" />
        <path d="M0 397c72-13 136-7 197 14 22 8 43 18 64 30-28 17-54 36-76 57-75-20-130-24-185-14Z" fill="#705239" opacity=".62" />
      </g>

      <g className="riviera-right-coast">
        <path d="M1000 246c-86 3-151 33-201 86-35 36-67 57-112 72 17 34 35 67 62 96 89-28 169-38 251-32Z" fill="url(#courseCliffGradient)" />
        <path d="M1000 232c-92 3-161 31-218 87-20 20-41 34-65 46 64-18 124-17 179 0 31-24 65-40 104-48Z" fill="url(#courseGreenGradient)" />
        <path d="M1000 392c-84-12-156-1-219 29-17 8-33 17-48 28 32 16 60 35 84 57 68-23 127-31 183-23Z" fill="#71533a" opacity=".62" />
      </g>

      <g className="riviera-villas" stroke="#8d6c44" strokeWidth="3">
        <g transform="translate(72 225)">
          <rect x="0" y="22" width="82" height="52" rx="3" fill="url(#courseVillaGradient)" />
          <path d="M-7 24 41 0l48 24Z" fill="#b96648" />
          <rect x="13" y="37" width="13" height="19" fill="#46788b" />
          <rect x="55" y="37" width="13" height="19" fill="#46788b" />
          <path d="M36 74V44h13v30" fill="#70523a" />
        </g>
        <g transform="translate(177 256) scale(.78)">
          <rect x="0" y="18" width="72" height="47" rx="3" fill="url(#courseVillaGradient)" />
          <path d="M-5 20 36 1l41 19Z" fill="#ca7754" />
          <rect x="10" y="32" width="12" height="16" fill="#487f91" />
          <rect x="50" y="32" width="12" height="16" fill="#487f91" />
        </g>
        <g transform="translate(832 235)">
          <rect x="0" y="20" width="92" height="58" rx="3" fill="url(#courseVillaGradient)" />
          <path d="M-7 22 46 0l53 22Z" fill="#b65c45" />
          <rect x="14" y="38" width="15" height="20" fill="#477b8d" />
          <rect x="63" y="38" width="15" height="20" fill="#477b8d" />
          <path d="M40 78V43h15v35" fill="#6e5138" />
        </g>
        <g transform="translate(745 267) scale(.7)">
          <rect x="0" y="16" width="70" height="44" rx="3" fill="url(#courseVillaGradient)" />
          <path d="M-4 18 35 0l39 18Z" fill="#ce7755" />
          <rect x="10" y="31" width="11" height="14" fill="#47798d" />
          <rect x="49" y="31" width="11" height="14" fill="#47798d" />
        </g>
      </g>

      <g className="riviera-palms" stroke="#345445" strokeWidth="5" strokeLinecap="round">
        <path d="M222 304c0-27 3-48 11-68" />
        <path d="M233 236c-18-9-29-11-41-6m41 6c14-13 28-18 44-16m-44 16c0-17-5-29-15-39" fill="none" />
        <path d="M793 308c1-27-2-49-9-69" />
        <path d="M784 239c18-10 31-12 43-7m-43 7c-14-13-30-18-46-15m46 15c1-17 6-30 16-40" fill="none" />
      </g>

      <g className="riviera-lighthouse" transform="translate(912 190)">
        <path d="M7 92 20 17h30l13 75Z" fill="#f2e8cf" stroke="#7d684b" strokeWidth="3" />
        <path d="M14 53h43" stroke="#bd4f43" strokeWidth="11" />
        <rect x="14" y="5" width="42" height="20" rx="3" fill="#263f55" stroke="#755729" strokeWidth="3" />
        <path d="M9 6 35-10 61 6Z" fill="#b65a45" stroke="#70442d" strokeWidth="3" />
        <circle cx="35" cy="15" r="7" fill="#ffeaa1" />
      </g>

      <g className="riviera-distant-boats" fill="#f7f0dd" stroke="#40677a" strokeWidth="2">
        <path d="M353 321h66l-11 17h-43Z" />
        <path d="M379 320v-34l28 31h-28Z" fill="#fff6db" />
        <path d="M638 337h49l-8 13h-33Z" opacity=".72" />
        <path d="M658 336v-24l19 22h-19Z" fill="#fff6db" opacity=".72" />
      </g>

      <g className="riviera-lane-guides" fill="none" stroke="#e4fbff" strokeLinecap="round">
        <path d="M474 326C445 448 398 590 329 748" strokeOpacity=".2" strokeWidth="5" strokeDasharray="4 26" />
        <path d="M526 326C555 448 602 590 671 748" strokeOpacity=".2" strokeWidth="5" strokeDasharray="4 26" />
      </g>

      <g className="riviera-water-highlights" fill="none" stroke="#efffff" strokeLinecap="round">
        <path d="M105 392c61-13 118-13 171 0" strokeOpacity=".19" strokeWidth="5" />
        <path d="M712 430c59-16 111-16 157-1" strokeOpacity=".17" strokeWidth="5" />
        <path d="M243 530c78-17 147-16 207 2" strokeOpacity=".13" strokeWidth="6" />
        <path d="M540 605c74-18 144-17 210 2" strokeOpacity=".14" strokeWidth="7" />
        <path d="M66 676c64-14 122-12 176 4" strokeOpacity=".1" strokeWidth="7" />
      </g>

      <g className="riviera-sparkles" fill="#fffbed">
        <circle cx="170" cy="357" r="3" opacity=".55" />
        <circle cx="302" cy="444" r="2.5" opacity=".46" />
        <circle cx="558" cy="380" r="3" opacity=".56" />
        <circle cx="690" cy="512" r="3.5" opacity=".43" />
        <circle cx="838" cy="588" r="2.6" opacity=".46" />
        <circle cx="427" cy="652" r="3" opacity=".4" />
        <path d="m598 470 4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" opacity=".42" />
        <path d="m252 610 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" opacity=".34" />
      </g>
    </svg>
  );
}

function CaptainYachtArt({ boost }) {
  return (
    <div className="yacht-illustration" aria-label="Captain Rosie commanding the ROSIE I">
      <div className="yacht-vector-shadow" aria-hidden="true" />
      <svg className="rosie-yacht-base" viewBox="0 0 320 220" aria-hidden="true">
        <defs>
          <linearGradient id="captainHullIvory" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffef6" />
            <stop offset=".42" stopColor="#f6ecd9" />
            <stop offset=".72" stopColor="#dcc6a2" />
            <stop offset="1" stopColor="#ad8e64" />
          </linearGradient>
          <linearGradient id="captainHullNavy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#175479" />
            <stop offset=".45" stopColor="#0a3659" />
            <stop offset="1" stopColor="#031c33" />
          </linearGradient>
          <linearGradient id="captainTeak" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8f522d" />
            <stop offset=".25" stopColor="#d5a469" />
            <stop offset=".55" stopColor="#f0ce97" />
            <stop offset=".78" stopColor="#ba7841" />
            <stop offset="1" stopColor="#754126" />
          </linearGradient>
          <linearGradient id="captainBrass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff0a9" />
            <stop offset=".36" stopColor="#d6a64d" />
            <stop offset=".7" stopColor="#83501d" />
            <stop offset="1" stopColor="#edc871" />
          </linearGradient>
        </defs>

        <ellipse cx="160" cy="190" rx="128" ry="19" fill="rgba(0,35,56,.22)" />
        <path d="M22 128c32-11 68-16 110-17h134c16 0 28 6 38 17l-27 52c-33 19-76 28-128 28-48 0-87-9-118-27Z" fill="url(#captainHullIvory)" stroke="#9a6828" strokeWidth="3" />
        <path d="M36 153c58 12 166 11 249-5l-12 31c-36 18-77 26-124 26-45 0-83-8-113-24Z" fill="url(#captainHullNavy)" />
        <path d="M39 148c73 9 166 8 248-5" fill="none" stroke="url(#captainBrass)" strokeWidth="5" />
        <path d="M61 116c41-15 83-21 126-19 33 1 61 7 84 18l-12 17H75Z" fill="url(#captainTeak)" stroke="#6e4328" strokeWidth="3" />
        <path d="M89 109 102 57c4-13 14-22 29-27h80c15 5 25 15 29 29l11 50Z" fill="#f7eedb" stroke="#a87532" strokeWidth="3" />
        <path d="M111 56h111" stroke="#d7ad61" strokeWidth="3" />
        <path d="M80 117h184" stroke="#fff9e9" strokeWidth="3" opacity=".8" />
        <path d="M56 172c49 12 148 13 210-1" fill="none" stroke="#a9d4df" strokeWidth="3" opacity=".7" />

        <g fill="#76b6cb" stroke="#e2ca92" strokeWidth="2">
          <rect x="61" y="163" width="25" height="10" rx="5" />
          <rect x="99" y="171" width="20" height="8" rx="4" />
          <rect x="200" y="171" width="20" height="8" rx="4" />
          <rect x="237" y="162" width="24" height="10" rx="5" />
        </g>

        <g stroke="url(#captainBrass)" strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M78 110V90m172 20V90M72 91h185" />
          <path d="M92 91v20m38-20v20m54-20v20m43-20v20" opacity=".82" />
        </g>

        <path d="M251 80V23" stroke="#b98737" strokeWidth="4" />
        <path d="M254 27c21 2 37 7 52 17-15 8-32 11-52 11Z" fill="#0b3556" stroke="#d5aa52" strokeWidth="2" />
        <text x="270" y="46" fontSize="13" fontWeight="900" fill="#f7d984">R</text>

        <text x="160" y="192" textAnchor="middle" fontSize="12" fontWeight="900" letterSpacing="4" fill="#f5d584">ROSIE I</text>
        <g fill="#d1a44d">
          <circle cx="151" cy="145" r="3" />
          <circle cx="160" cy="141" r="3" />
          <circle cx="169" cy="145" r="3" />
          <path d="M152 156c0-6 3.7-10 8-10s8 4 8 10c0 4-3.1 6-8 6s-8-2-8-6Z" />
        </g>
      </svg>

      <div className="captain-at-helm" aria-hidden="true">
        <CaptainRosieIllustration className="helm-rosie-art" idPrefix="helmRosie" />
        <span className="captain-window-glint" />
      </div>

      <svg className="rosie-yacht-overlay" viewBox="0 0 320 220" aria-hidden="true">
        <defs>
          <linearGradient id="captainGlassOverlay" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f1fdff" stopOpacity=".5" />
            <stop offset=".43" stopColor="#8ad1e6" stopOpacity=".16" />
            <stop offset="1" stopColor="#0a5375" stopOpacity=".42" />
          </linearGradient>
        </defs>
        <path d="M104 57 124 34h86l21 25 10 48H91Z" fill="url(#captainGlassOverlay)" stroke="#d9b35f" strokeWidth="3" />
        <path d="M167 35v72M104 58h127" fill="none" stroke="#d9b35f" strokeWidth="3" opacity=".9" />
        <circle cx="166" cy="94" r="16" fill="rgba(5,39,60,.2)" stroke="#d3a64c" strokeWidth="3" />
        <circle cx="166" cy="94" r="3.5" fill="#e3b85f" />
        <path d="M166 78v32m-14-24 28 16m-28 0 28-16" stroke="#d3a64c" strokeWidth="2" />
        <path d="M112 63c25-11 43-13 53-13" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity=".22" />
        <path d="M47 132c59-14 167-14 239-4" fill="none" stroke="rgba(255,255,255,.72)" strokeWidth="2" />
      </svg>

      <span className="captain-scarf-tail" aria-hidden="true" />
      <div className="yacht-wake-stack" aria-hidden="true"><i /><i /><i /></div>
      {boost && <div className="golden-wake" aria-hidden="true" />}
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
  const [message, setMessage] = useState("Captain Rosie is on the bridge. The Riviera is clear and the treats are somewhere ahead.");
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
            <small>Command the ROSIE I through a glittering Riviera run - collect prized cargo, secure the Golden Cheese and bring the captain home in style.</small>
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
          className="yacht-course"
          aria-label="Three-lane yacht course. Swipe, tap a lane, or use the controls below to steer."
          onPointerDown={onCoursePointerDown}
          onPointerUp={onCoursePointerUp}
        >
          <RivieraCourseArt />
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
              {item.kind === "cheese" ? <GoldenCheeseIcon /> : <span>{item.icon}</span>}
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
  const [page, setPage] = useState("fortune");
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

      <div className={`app-shell ${loaded ? "app-shell-visible" : ""} ${page === "cheese" ? "is-cheese-page" : ""}`}>
        <header className="topbar">
          <button className="round-button" aria-label="Menu">☰</button>
          <div className="brand">
            <small>THE HOUSE OF</small>
            <strong>ROSIE</strong>
          </div>
          <button
            className="round-button whistle-button"
            aria-label="Whistle for Rosie"
            title="Whistle for Rosie"
            onClick={whistleForRosie}
          >
            ♪
          </button>
        </header>

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
        ) : (
          <CaptainRosieGame soundOn={soundOn} />
        )}

        <nav className="bottom-nav" aria-label="Primary">
          <button className={page === "fortune" ? "active" : ""} onClick={() => setPage("fortune")}><span>✦</span><small>Fortune</small></button>
          <button className={page === "cheese" ? "active" : ""} onClick={() => setPage("cheese")}><span>♛</span><small>Cheese</small></button>
          <button className={page === "captain" ? "active" : ""} onClick={() => setPage("captain")}><span>⚓</span><small>Captain</small></button>
          <button disabled><span>🐾</span><small>Rosie</small></button>
        </nav>
      </div>

      <div className={`toast ${toast ? "toast-visible" : ""}`}>{toast}</div>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
