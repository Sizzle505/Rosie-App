import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

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

function secureIndex(length) {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] % length;
}

function readRecent() {
  try {
    return JSON.parse(sessionStorage.getItem("rosieRecent") || "[]");
  } catch {
    return [];
  }
}

function FortuneLens({ consulting, answer }) {
  const state = answer ? `has-answer tone-${answer.tone}` : consulting ? "is-consulting" : "";
  return (
    <div className={`fortune-lens ${state}`} aria-live="polite">
      {consulting && (
        <div className="lens-consulting">
          <span className="lens-orbit">✦</span>
          <small>CONSULTING THE TREATS…</small>
        </div>
      )}
      {answer && (
        <div className="lens-answer" key={answer.id}>
          <span>ROSIE SAYS</span>
          <strong>{answer.text}</strong>
        </div>
      )}
    </div>
  );
}

function FortuneMachine({ consulting, answer }) {
  return (
    <section className="machine" aria-label="Madame Rosie fortune teller">
      <div className="booth">
        <div className="cabinet-lights cabinet-lights-left" />
        <div className="cabinet-lights cabinet-lights-right" />
        <div className="curtain curtain-left" />
        <div className="curtain curtain-right" />

        <div className="sign">
          <div className="sign-paw">🐾</div>
          <h1>MADAME ROSIE</h1>
          <p>SEER OF TREATS · KNOWER OF THINGS</p>
        </div>

        <div className="stage">
          <img
            className={`stage-art ${consulting ? "stage-art-consulting" : ""}`}
            src="/rosie-fortune-stage.webp"
            alt="Rosie dressed as a jeweled fortune teller at her crystal ball"
          />
          <div className={`stage-glow ${answer ? `tone-${answer.tone}` : ""}`} aria-hidden="true" />
        </div>

        <FortuneLens consulting={consulting} answer={answer} />
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

function CheeseMemoryGame() {
  const [deck, setDeck] = useState(() => shuffleCheeseDeck());
  const [openCards, setOpenCards] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState("Match every pair to earn Rosie's highest cheese honors.");
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
    setMessage("You are Rosie. Trust the beret, trust the nose, match the cheese.");
  }

  function chooseCard(index) {
    if (locked || complete || openCards.includes(index) || matched.includes(deck[index].id)) return;
    if (!started) setStarted(true);

    if (openCards.length === 0) {
      setOpenCards([index]);
      setMessage("Good sniff. Rosie has the scent - now find its matching fromage.");
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
        setMessage(first.name + " identified. Doctor Rosie remains academically unstoppable.");
        window.navigator.vibrate?.([18, 26, 18]);
      }, 430);
    } else {
      pendingFlipRef.current = window.setTimeout(() => {
        setOpenCards([]);
        setLocked(false);
        setMessage("Not a match. Rosie is classifying that as a control sample.");
      }, 850);
    }
  }

  return (
    <main className="cheese-game-page">
      <section className="cheese-hero">
        <div className="cheese-hero-photo">
          <img
            src="/rosie-doctor-cheese.webp"
            alt="Rosie wearing her red beret and striped French outfit beside her Doctor of Cheese diploma"
          />
          <div className="player-identity">
            <span>YOU ARE PLAYING AS</span>
            <strong>ROSIE · DOCTOR OF CHEESE</strong>
          </div>
        </div>

        <div className="cheese-hero-copy">
          <div className="cheese-eyebrow">UNIVERSITY OF BARKBRIDGE · FACULTY OF GASTRONOMIC SCIENCES</div>
          <h1>ROSIE'S CHEESE BOARD EXAM</h1>
          <p>Put on the beret. Deploy the doctoral nose. Match all eight cheeses before Rosie's academic reputation melts.</p>
          <div className="doctor-ribbon">
            <img src="/rosie-doctor-cheese.webp" alt="" aria-hidden="true" />
            <div>
              <strong>ROSIE THE SHIBA, Che.D.</strong>
              <small>Beret on · Credentials verified · Cheese authority absolute</small>
            </div>
            <span className="doctor-seal">🐾</span>
          </div>
        </div>
      </section>

      <section className="cheese-scorebar" aria-label="Game score">
        <div><span>MOVES</span><strong>{moves}</strong></div>
        <div><span>TIME</span><strong>{formatGameTime(elapsed)}</strong></div>
        <div><span>PAIRS</span><strong>{matched.length}/{CHEESES.length}</strong></div>
        <button type="button" onClick={resetGame}>NEW BOARD</button>
      </section>

      <section className="cheese-game-frame">
        <div className="rosie-player-status" aria-live="polite">
          <img src="/rosie-doctor-cheese.webp" alt="Beret Rosie" />
          <div>
            <span>DR. ROSIE'S FIELD NOTES</span>
            <strong>{message}</strong>
          </div>
          <b>Che.D.</b>
        </div>

        <div className="cheese-game-heading">
          <div>
            <span>THE PRACTICAL EXAM</span>
            <h2>Pair the Fromage</h2>
          </div>
          <p>Eight cheeses. Sixteen cards. One extremely qualified Shiba.</p>
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
                    <span className="card-corner top">✦</span>
                    <span className="card-corner bottom">✦</span>
                    <span className="card-seal"><b>Che.D.</b><i>🐾</i></span>
                    <small>ROSIE'S<br />CHEESE BOARD</small>
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

      {complete && (
        <section className="cheese-victory" aria-live="polite">
          <img className="victory-rosie" src="/rosie-doctor-cheese.webp" alt="Rosie, Doctor of Cheese" />
          <span>BOARD EXAM PASSED</span>
          <h2>Doctor Rosie has conquered the cheese board.</h2>
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

function CaptainRosieIllustration({ className = "", idPrefix = "captainRosie" }) {
  const furId = idPrefix + "-fur";
  const creamId = idPrefix + "-cream";
  const jacketId = idPrefix + "-jacket";
  const hatId = idPrefix + "-hat";
  const goldId = idPrefix + "-gold";
  const shadowId = idPrefix + "-shadow";

  return (
    <svg className={"captain-rosie-illustration " + className} viewBox="0 0 260 300" role="img" aria-label="Illustrated Captain Rosie">
      <defs>
        <linearGradient id={furId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#efad5a" />
          <stop offset=".46" stopColor="#d88439" />
          <stop offset="1" stopColor="#9d4f26" />
        </linearGradient>
        <linearGradient id={creamId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff8de" />
          <stop offset=".62" stopColor="#f5dfb7" />
          <stop offset="1" stopColor="#dab989" />
        </linearGradient>
        <linearGradient id={jacketId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#133e67" />
          <stop offset=".56" stopColor="#082843" />
          <stop offset="1" stopColor="#031728" />
        </linearGradient>
        <linearGradient id={hatId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffef7" />
          <stop offset=".62" stopColor="#efe5cf" />
          <stop offset="1" stopColor="#cdbb99" />
        </linearGradient>
        <linearGradient id={goldId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0b5" />
          <stop offset=".38" stopColor="#e4b85d" />
          <stop offset=".72" stopColor="#a76b24" />
          <stop offset="1" stopColor="#f0cf7f" />
        </linearGradient>
        <filter id={shadowId} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#021523" floodOpacity=".35" />
        </filter>
      </defs>

      <g className="captain-rosie-bob" filter={"url(#" + shadowId + ")"}>
        <path className="captain-scarf-back" d="M191 221c31 7 46 17 55 34-25-2-45-8-64-20Z" fill="#d13f3c" stroke="#79252a" strokeWidth="3" />
        <path d="M73 218c15-18 37-28 57-28s42 10 57 28l19 62H54Z" fill={"url(#" + jacketId + ")"} stroke="#d8aa54" strokeWidth="4" />
        <path d="M95 218 130 285l35-67-19-19h-32Z" fill="#f8f0de" />
        <path d="M110 207h40l-9 21h-22Z" fill="#b92f31" stroke="#702023" strokeWidth="2" />
        <path d="M79 236c10 5 18 7 29 8m44 0c11-1 19-3 29-8" fill="none" stroke="#ddb35f" strokeWidth="4" strokeLinecap="round" opacity=".85" />
        <circle cx="83" cy="251" r="5" fill={"url(#" + goldId + ")"} />
        <circle cx="177" cy="251" r="5" fill={"url(#" + goldId + ")"} />

        <path d="M73 87 49 27c34 8 49 25 61 50Z" fill={"url(#" + furId + ")"} stroke="#71381f" strokeWidth="5" strokeLinejoin="round" />
        <path d="m66 70-9-31c17 7 27 17 36 34Z" fill="#8c4436" opacity=".9" />
        <path d="m187 87 24-60c-34 8-49 25-61 50Z" fill={"url(#" + furId + ")"} stroke="#71381f" strokeWidth="5" strokeLinejoin="round" />
        <path d="m194 70 9-31c-17 7-27 17-36 34Z" fill="#8c4436" opacity=".9" />

        <path d="M57 123c0-53 31-84 73-84s73 31 73 84c0 61-31 101-73 101S57 184 57 123Z" fill={"url(#" + furId + ")"} stroke="#6f381f" strokeWidth="5" />
        <path d="M62 126c4-18 13-34 27-44 4 25 17 40 41 43-21 4-36 18-45 42-13-10-21-24-23-41Z" fill={"url(#" + creamId + ")"} opacity=".98" />
        <path d="M198 126c-4-18-13-34-27-44-4 25-17 40-41 43 21 4 36 18 45 42 13-10 21-24 23-41Z" fill={"url(#" + creamId + ")"} opacity=".98" />
        <path d="M91 151c6-20 20-31 39-31s33 11 39 31c5 18 0 44-12 57-9 10-18 15-27 15s-18-5-27-15c-12-13-17-39-12-57Z" fill={"url(#" + creamId + ")"} />

        <path d="M84 118c10-8 22-9 31-2" fill="none" stroke="#6f351f" strokeWidth="5" strokeLinecap="round" />
        <path d="M176 118c-10-8-22-9-31-2" fill="none" stroke="#6f351f" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="103" cy="132" rx="8.5" ry="10" fill="#251b18" />
        <ellipse cx="157" cy="132" rx="8.5" ry="10" fill="#251b18" />
        <circle cx="100" cy="128" r="2.6" fill="#fff9df" />
        <circle cx="154" cy="128" r="2.6" fill="#fff9df" />
        <path d="M116 164c8-7 20-7 28 0-2 10-7 15-14 15s-12-5-14-15Z" fill="#251918" />
        <path d="M130 178v10" stroke="#5f3228" strokeWidth="3" strokeLinecap="round" />
        <path d="M130 188c-9 0-16 5-20 11m20-11c9 0 16 5 20 11" fill="none" stroke="#6d3b2f" strokeWidth="3" strokeLinecap="round" />
        <path d="M111 203c13 8 25 8 38 0" fill="none" stroke="#a45c4b" strokeWidth="2.5" strokeLinecap="round" opacity=".75" />
        <ellipse cx="82" cy="157" rx="12" ry="7" fill="#d36857" opacity=".19" />
        <ellipse cx="178" cy="157" rx="12" ry="7" fill="#d36857" opacity=".19" />

        <g className="captain-hat">
          <path d="M72 74c17-18 38-28 58-28s41 10 58 28l-12 26H84Z" fill={"url(#" + hatId + ")"} stroke="#77532b" strokeWidth="4" />
          <path d="M82 77c31-12 65-12 96 0l-3 17H85Z" fill="#123555" stroke="#7c552b" strokeWidth="3" />
          <path d="M91 54c4-22 18-34 39-34s35 12 39 34c-26-8-52-8-78 0Z" fill={"url(#" + hatId + ")"} stroke="#77532b" strokeWidth="4" />
          <path d="M89 96c27 9 55 9 82 0-8 17-74 17-82 0Z" fill="#06233c" stroke="#d0a34e" strokeWidth="3" />
          <circle cx="130" cy="70" r="14" fill={"url(#" + goldId + ")"} stroke="#704719" strokeWidth="2" />
          <path d="M130 59v18m-9-8h18m-13 8c-5 4-5 9 4 10 9-1 9-6 4-10" fill="none" stroke="#123554" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="130" cy="57" r="3.2" fill="#123554" />
        </g>

        <path d="M86 217c18 10 32 14 44 14s26-4 44-14" fill="none" stroke="#efcf7c" strokeWidth="4" strokeLinecap="round" />
        <circle cx="130" cy="235" r="12" fill={"url(#" + goldId + ")"} stroke="#7b501d" strokeWidth="2" />
        <path d="M125 235c0-5 2-8 5-8s5 3 5 8c0 4-2 7-5 7s-5-3-5-7Z" fill="#123555" />
      </g>
    </svg>
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
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [consulting, setConsulting] = useState(false);
  const [toast, setToast] = useState("");
  const [history, setHistory] = useState([]);
  const [soundOn, setSoundOn] = useState(true);
  const [page, setPage] = useState("fortune");
  const inputRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 950);
    return () => window.clearTimeout(timer);
  }, []);

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
    if (!soundOn) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioRef.current) audioRef.current = new AudioContext();
    audioRef.current.resume?.();
    return audioRef.current;
  }

  function playRevealChime() {
    const context = audioRef.current;
    if (!soundOn || !context) return;

    const now = context.currentTime;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.045, now + index * 0.07 + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.07 + 0.42);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + index * 0.07);
      oscillator.stop(now + index * 0.07 + 0.45);
    });
  }

  function askRosie(event) {
    event.preventDefault();
    if (!question.trim() || consulting) {
      inputRef.current?.focus();
      return;
    }

    primeAudio();
    setAnswer(null);
    setConsulting(true);

    const result = chooseFortune();
    const askedQuestion = question.trim();
    const delay = 1450 + secureIndex(650);

    window.setTimeout(() => {
      setAnswer(result);
      setHistory((items) => [
        { question: askedQuestion, answer: result.text, tone: result.tone },
        ...items
      ].slice(0, 5));
      setConsulting(false);
      playRevealChime();
      window.navigator.vibrate?.([22, 35, 22]);
    }, delay);
  }

  function askAnother() {
    setQuestion("");
    setAnswer(null);
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

  return (
    <>
      <div className={`loading-screen ${loaded ? "loading-screen-hidden" : ""}`}>
        <div className="loading-orb"><span>🐾</span></div>
        <div className="loading-title">ROSIE</div>
        <div className="loading-copy">Consulting the ancient treat ledger…</div>
      </div>

      <div className={`app-shell ${loaded ? "app-shell-visible" : ""}`}>
        <header className="topbar">
          <button className="round-button" aria-label="Menu">☰</button>
          <div className="brand">
            <small>THE HOUSE OF</small>
            <strong>ROSIE</strong>
          </div>
          <button
            className={`round-button sound-button ${soundOn ? "is-on" : ""}`}
            aria-label={soundOn ? "Mute Rosie app sounds" : "Enable Rosie app sounds"}
            onClick={() => setSoundOn((value) => !value)}
          >
            {soundOn ? "♪" : "×"}
          </button>
        </header>

        {page === "fortune" ? (
        <main>
          <div className="fortune-console">
            <FortuneMachine consulting={consulting} answer={answer} />

            <div className="console-caption">
              <span>FORTUNES · ADVICE · HIGHLY QUALIFIED OPINIONS</span>
            </div>

            <form className="question-card" onSubmit={askRosie}>
              <label htmlFor="question">Ask Rosie what you should do…</label>
              <div className="question-row">
                <input
                  ref={inputRef}
                  id="question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  maxLength={160}
                  autoComplete="off"
                  enterKeyHint="go"
                  placeholder="Should I text them back?"
                />
                <button className="ask-button" type="submit" disabled={consulting}>
                  <span className="button-paw">🐾</span>
                  {consulting ? "CONSULTING…" : "ASK ROSIE"}
                </button>
              </div>
              <p>No question too difficult. No snack too small.</p>
            </form>
          </div>

          <section className={`fortune-slip ${answer ? "fortune-slip-visible" : ""}`}>
            {answer && (
              <>
                <div className="fortune-slip-heading"><span>✦</span> THE PAW HAS SPOKEN <span>✦</span></div>
                <p className="question-echo">You asked: “{question.trim()}”</p>
                <div className="answer-actions">
                  <button onClick={askAnother}>ASK ANOTHER</button>
                  <button className="secondary" onClick={saveFortune}>SAVE FORTUNE</button>
                </div>
              </>
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
