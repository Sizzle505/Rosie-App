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
  { id: "brie", name: "Brie", note: "Soft-ripened royalty" },
  { id: "swiss", name: "Swiss", note: "The hole truth" },
  { id: "cheddar", name: "Cheddar", note: "Sharp and distinguished" },
  { id: "blue", name: "Blue", note: "Veined with greatness" },
  { id: "gouda", name: "Gouda", note: "Wheel of good decisions" },
  { id: "parmesan", name: "Parmesan", note: "Aged with authority" },
  { id: "mozzarella", name: "Mozzarella", note: "Fresh little clouds" },
  { id: "goat", name: "Goat Cheese", note: "Tangy academic excellence" }
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

function CheeseArt({ id }) {
  const common = { viewBox: "0 0 160 120", role: "img", "aria-hidden": true };

  if (id === "brie") {
    return (
      <svg {...common}>
        <ellipse cx="80" cy="91" rx="55" ry="13" className="cheese-shadow" />
        <path d="M34 70 L78 42 L132 60 L89 91 Z" className="cheese-rind" />
        <path d="M42 68 L80 48 L122 62 L86 84 Z" className="cheese-cream" />
        <path d="M34 70 L42 68 L86 84 L89 91 Z" className="cheese-edge" />
      </svg>
    );
  }

  if (id === "swiss") {
    return (
      <svg {...common}>
        <ellipse cx="80" cy="94" rx="57" ry="12" className="cheese-shadow" />
        <path d="M31 79 L67 34 L132 58 L94 96 Z" className="swiss-body" />
        <ellipse cx="71" cy="58" rx="9" ry="7" className="swiss-hole" />
        <ellipse cx="103" cy="65" rx="7" ry="6" className="swiss-hole" />
        <ellipse cx="84" cy="82" rx="8" ry="6" className="swiss-hole" />
        <ellipse cx="115" cy="82" rx="5" ry="4" className="swiss-hole" />
      </svg>
    );
  }

  if (id === "cheddar") {
    return (
      <svg {...common}>
        <ellipse cx="80" cy="94" rx="58" ry="12" className="cheese-shadow" />
        <path d="M39 50 L101 37 L129 56 L65 70 Z" className="cheddar-top" />
        <path d="M39 50 L65 70 L65 96 L39 78 Z" className="cheddar-side" />
        <path d="M65 70 L129 56 L129 81 L65 96 Z" className="cheddar-face" />
        <path d="M78 72 L111 65" className="cheddar-score" />
      </svg>
    );
  }

  if (id === "blue") {
    return (
      <svg {...common}>
        <ellipse cx="79" cy="95" rx="58" ry="12" className="cheese-shadow" />
        <path d="M31 82 L67 34 L132 60 L94 98 Z" className="blue-body" />
        <path d="M53 62 C66 53, 73 69, 83 58 S105 54, 116 66" className="blue-vein" />
        <path d="M51 79 C65 72, 70 86, 85 76 S108 73, 119 84" className="blue-vein" />
        <path d="M69 44 C80 50, 77 62, 91 66" className="blue-vein thin" />
      </svg>
    );
  }

  if (id === "gouda") {
    return (
      <svg {...common}>
        <ellipse cx="80" cy="94" rx="53" ry="12" className="cheese-shadow" />
        <ellipse cx="80" cy="60" rx="49" ry="31" className="gouda-wax" />
        <rect x="31" y="60" width="98" height="24" className="gouda-side" />
        <ellipse cx="80" cy="84" rx="49" ry="22" className="gouda-side" />
        <path d="M54 54 C69 47, 91 47, 106 54" className="gouda-shine" />
      </svg>
    );
  }

  if (id === "parmesan") {
    return (
      <svg {...common}>
        <ellipse cx="80" cy="95" rx="58" ry="12" className="cheese-shadow" />
        <path d="M29 82 L76 34 L132 60 L91 98 Z" className="parm-body" />
        <path d="M29 82 L76 34 L84 39 L38 88 Z" className="parm-rind" />
        <circle cx="83" cy="61" r="2" className="parm-speck" />
        <circle cx="102" cy="68" r="2.5" className="parm-speck" />
        <circle cx="73" cy="78" r="1.8" className="parm-speck" />
        <circle cx="95" cy="86" r="1.6" className="parm-speck" />
      </svg>
    );
  }

  if (id === "mozzarella") {
    return (
      <svg {...common}>
        <ellipse cx="81" cy="97" rx="55" ry="11" className="cheese-shadow" />
        <path d="M30 86 C44 70, 48 60, 58 48 C51 69, 51 83, 45 94 Z" className="basil-leaf" />
        <path d="M129 86 C116 71, 111 59, 101 49 C108 70, 110 83, 116 94 Z" className="basil-leaf" />
        <circle cx="60" cy="75" r="24" className="mozz-ball" />
        <circle cx="99" cy="71" r="27" className="mozz-ball" />
        <circle cx="82" cy="88" r="21" className="mozz-ball front" />
        <circle cx="91" cy="62" r="6" className="mozz-highlight" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <ellipse cx="80" cy="96" rx="57" ry="11" className="cheese-shadow" />
      <rect x="42" y="48" width="77" height="42" rx="20" className="goat-log" />
      <ellipse cx="43" cy="69" rx="20" ry="21" className="goat-end" />
      <ellipse cx="117" cy="69" rx="20" ry="21" className="goat-end shade" />
      <path d="M51 54 C67 48, 92 48, 108 54" className="goat-ridge" />
    </svg>
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

  const complete = matched.length === CHEESES.length;

  useEffect(() => {
    if (!started || complete) return undefined;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [started, complete]);

  function resetGame() {
    setDeck(shuffleCheeseDeck());
    setOpenCards([]);
    setMatched([]);
    setMoves(0);
    setElapsed(0);
    setStarted(false);
    setLocked(false);
    setMessage("Match every pair to earn Rosie's highest cheese honors.");
  }

  function chooseCard(index) {
    if (locked || complete || openCards.includes(index) || matched.includes(deck[index].id)) return;
    if (!started) setStarted(true);

    if (openCards.length === 0) {
      setOpenCards([index]);
      setMessage("Excellent selection. Now find its scholarly twin.");
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
      window.setTimeout(() => {
        setMatched((items) => [...items, first.id]);
        setOpenCards([]);
        setLocked(false);
        setMessage(first.name + " mastered. Doctor Rosie approves.");
        window.navigator.vibrate?.([18, 26, 18]);
      }, 430);
    } else {
      window.setTimeout(() => {
        setOpenCards([]);
        setLocked(false);
        setMessage("Not a match. Recalibrating the fromage cortex.");
      }, 850);
    }
  }

  return (
    <main className="cheese-game-page">
      <section className="cheese-hero">
        <div className="cheese-hero-copy">
          <div className="cheese-eyebrow">UNIVERSITY OF BARKBRIDGE · FACULTY OF GASTRONOMIC SCIENCES</div>
          <h1>ROSIE'S CHEESE BOARD EXAM</h1>
          <p>You are Rosie the Shiba, Doctor of Cheese (Che.D.). Match every pair before your academic reputation melts.</p>
          <div className="doctor-ribbon">
            <span className="doctor-seal">🐾</span>
            <div>
              <strong>ROSIE THE SHIBA</strong>
              <small>Doctor of Cheese · Board Candidate</small>
            </div>
          </div>
        </div>
        <div className="cheese-diploma-card" aria-hidden="true">
          <div className="diploma-rule" />
          <span>UNIVERSITY OF BARKBRIDGE</span>
          <strong>Doctor of Cheese</strong>
          <em>Che.D.</em>
          <div className="wax-seal">R</div>
        </div>
      </section>

      <section className="cheese-scorebar" aria-label="Game score">
        <div><span>MOVES</span><strong>{moves}</strong></div>
        <div><span>TIME</span><strong>{formatGameTime(elapsed)}</strong></div>
        <div><span>PAIRS</span><strong>{matched.length}/{CHEESES.length}</strong></div>
        <button type="button" onClick={resetGame}>NEW BOARD</button>
      </section>

      <section className="cheese-game-frame">
        <div className="cheese-game-heading">
          <div>
            <span>THE PRACTICAL EXAM</span>
            <h2>Pair the Fromage</h2>
          </div>
          <p>{message}</p>
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
                    <span className="cheese-art"><CheeseArt id={cheese.id} /></span>
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
          <div className="victory-medallion">🐾</div>
          <span>BOARD EXAM PASSED</span>
          <h2>Doctor Rosie has conquered the cheese board.</h2>
          <p>{moves} moves · {formatGameTime(elapsed)} · All {CHEESES.length} cheeses correctly identified.</p>
          <button type="button" onClick={resetGame}>DEFEND THE DISSERTATION AGAIN</button>
        </section>
      )}
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
  const [soundOn, setSoundOn] = useState(true);\n  const [page, setPage] = useState("fortune");
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
            aria-label={soundOn ? "Mute fortune sounds" : "Enable fortune sounds"}
            onClick={() => setSoundOn((value) => !value)}
          >
            {soundOn ? "♪" : "×"}
          </button>
        </header>

        {page === "fortune" ? (\n        <main>
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
        </main>\n        ) : (\n          <CheeseMemoryGame />\n        )}

        <nav className="bottom-nav" aria-label="Primary">
          <button className={page === "fortune" ? "active" : ""} onClick={() => setPage("fortune")}><span>✦</span><small>Fortune</small></button>
          <button className={page === "cheese" ? "active" : ""} onClick={() => setPage("cheese")}><span>♛</span><small>Cheese</small></button>
          <button disabled><span>▧</span><small>Gallery</small></button>
          <button disabled><span>🐾</span><small>Rosie</small></button>
        </nav>
      </div>

      <div className={`toast ${toast ? "toast-visible" : ""}`}>{toast}</div>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
