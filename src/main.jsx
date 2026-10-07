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
  { kind: "medal", icon: "✦", label: "Golden captain's star", points: 40, turbo: 30 },
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
  const [medals, setMedals] = useState(0);
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
      medal: [659, 988, 1318],
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
    setMedals(0);
    setEnded(false);
    setPhaseNotice("GOLDEN HARBOR");
    setMessage("Lines cast off. Tennis balls are 10, treats are 20, captain's stars are 40. Keep clear of the red buoys.");
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
    captainTone(phaseKey === "sunset" ? "medal" : "ball");
    window.setTimeout(() => setPhaseNotice(""), 1500);
  }, [phaseKey, running]);

  useEffect(() => {
    if (!running) return undefined;

    const tick = window.setInterval(() => {
      let scoreDelta = 0;
      let turboDelta = 0;
      let lifeLoss = 0;
      let medalGain = 0;
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
              if (item.kind === "medal") medalGain += 1;
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
        if (medalGain) setMedals((current) => current + medalGain);
        const phrase = lastHit === "medal"
          ? "Captain's star recovered. The Admiralty is taking notes."
          : lastHit === "treat"
            ? "Premium provisions aboard. Rosie considers this excellent leadership."
            : comboRef.current > 1
              ? "Clean pickup. The captain's streak is building."
              : "Tennis ball aboard. Course maintained.";
        setMessage(phrase);
        pulse(lastHit);
        captainTone(lastHit);
        window.navigator.vibrate?.(lastHit === "medal" ? [18, 24, 28] : 15);
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
        <div className="captain-hero-compass" aria-hidden="true">
          <span>N</span><i>✦</i>
        </div>
        <div className="captain-portrait">
          <img src="/captain-rosie.webp" alt="Rosie wearing her captain's hat on a yacht deck" />
          <span>CAPTAIN ON DECK</span>
        </div>
        <div className="captain-title">
          <span className="captain-kicker">THE HOUSE OF ROSIE · MARITIME DIVISION</span>
          <h1>CAPTAIN ROSIE</h1>
          <p>Yacht Dash</p>
          <small>Command the ROSIE I through a glittering Riviera run - collect prized cargo, build a flawless streak and bring the captain home in style.</small>
        </div>
        <div className="captain-best">
          <span>CAPTAIN'S RECORD</span>
          <strong>{Math.max(best, score)}</strong>
          <small>BEST VOYAGE</small>
        </div>
      </section>

      <section className="captain-route-strip" aria-label="Voyage progress">
        <div className="route-port"><b>⚓</b><span>PORT ROSIE</span></div>
        <div className="route-line">
          <div className="route-progress" style={{ width: routeProgress + "%" }} />
          <i className="route-yacht" style={{ left: routeProgress + "%" }}>◆</i>
        </div>
        <div className="route-port route-destination"><b>✦</b><span>SUNSET COVE</span></div>
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
          <span className="captain-seal">⚓</span>
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
          <div className="captain-sky" aria-hidden="true">
            <div className="captain-sun" />
            <div className="captain-cloud cloud-one" />
            <div className="captain-cloud cloud-two" />
            <div className="captain-gulls">⌁　⌁</div>
          </div>
          <div className="captain-horizon" aria-hidden="true">
            <div className="horizon-villas villas-left" />
            <div className="horizon-villas villas-right" />
            <div className="captain-lighthouse"><i /><b /></div>
            <div className="distant-sail sail-one">◢</div>
            <div className="distant-sail sail-two">◢</div>
          </div>
          <div className="sun-glint" aria-hidden="true" />
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
              <span>{item.icon}</span>
              {item.kind === "medal" && <small>CAPTAIN</small>}
            </div>
          ))}

          {eventPulse > 0 && (
            <div className={"captain-burst burst-" + eventKind} key={eventPulse} aria-hidden="true">
              <i>✦</i><i>·</i><i>✦</i><i>·</i><i>✦</i><i>·</i>
            </div>
          )}

          <div className={"captain-yacht lane-" + lane + (boost ? " yacht-boost" : "")}>
            <div className="yacht-flag">R</div>
            <div className="yacht-mast" />
            <div className="yacht-rail" />
            <div className="captain-rosie-badge">
              <img src="/captain-rosie.webp" alt="" aria-hidden="true" />
            </div>
            <div className="yacht-cabin"><span>⚓</span><i /><i /></div>
            <div className="yacht-deck" />
            <div className="yacht-hull"><span>ROSIE I</span><b>🐾</b></div>
            <div className="yacht-wake" />
            {boost && <div className="golden-wake" />}
          </div>

          {!running && (
            <div className={"captain-start-panel" + (ended ? " captain-results-panel" : "")}>
              <img src="/captain-rosie.webp" alt="" aria-hidden="true" />
              {ended ? (
                <>
                  <span>CAPTAIN'S LOG · VOYAGE COMPLETE</span>
                  <div className="voyage-grade">{rank.mark}</div>
                  <strong>{rank.title}</strong>
                  <p>{rank.copy}</p>
                  <div className="voyage-stats">
                    <span><b>{score}</b> score</span>
                    <span><b>{bestStreak}</b> best streak</span>
                    <span><b>{medals}</b> stars</span>
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
                    <span><b>✦</b> Rare captain stars</span>
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
          <span><b className="cargo-medal">✦</b><i>+40</i>Star</span>
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
