import React, { useEffect, useMemo, useRef, useState } from "react";
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

const QUICK_QUESTIONS = [
  "Should I text them back?",
  "Should I buy it?",
  "Should I go out tonight?",
  "Should I trust my instincts?",
  "Should I take the trip?",
  "Should I say yes?",
  "Should I wait?",
  "Is this a terrible idea?",
  "Should I order dessert?"
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
    <section className={`machine ${consulting ? "machine-consulting" : ""}`} aria-label="Madame Rosie fortune teller">
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

        <div className="stage">
          <img
            className={`stage-art ${consulting ? "stage-art-consulting" : ""}`}
            src="/rosie-fortune-stage.webp"
            alt="Rosie dressed as a jeweled fortune teller at her crystal ball"
          />
          <div className={`stage-glow ${answer ? `tone-${answer.tone}` : ""}`} aria-hidden="true" />
          <div className="star-dust" aria-hidden="true">
            <i /><i /><i /><i /><i /><i />
          </div>
        </div>

        <FortuneLens consulting={consulting} answer={answer} />
      </div>
    </section>
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
  const [consultations, setConsultations] = useState(() => {
    const value = Number(sessionStorage.getItem("rosieConsultations") || 0);
    return Number.isFinite(value) ? value : 0;
  });
  const inputRef = useRef(null);
  const audioRef = useRef(null);

  const daily = useMemo(() => {
    const seed = dayNumber();
    return {
      treat: OMENS.treat[seed % OMENS.treat.length],
      hour: OMENS.hour[(seed * 3 + 1) % OMENS.hour.length],
      avoid: OMENS.avoid[(seed * 5 + 2) % OMENS.avoid.length]
    };
  }, []);

  const quickQuestions = useMemo(() => {
    const seed = dayNumber();
    return [0, 1, 2].map((offset) => QUICK_QUESTIONS[(seed + offset * 3) % QUICK_QUESTIONS.length]);
  }, []);

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
      const nextCount = consultations + 1;
      setConsultations(nextCount);
      sessionStorage.setItem("rosieConsultations", String(nextCount));
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

        <main>
          <div className="fortune-console">
            <FortuneMachine consulting={consulting} answer={answer} />

            <div className="console-caption">
              <span>FORTUNES · ADVICE · HIGHLY QUALIFIED OPINIONS</span>
            </div>

            <section className="omen-rail" aria-label="Today's omens">
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
                    onChange={(event) => setQuestion(event.target.value)}
                    maxLength={160}
                    autoComplete="off"
                    enterKeyHint="go"
                    placeholder="Should I text them back?"
                  />
                </div>

                <button className="ask-button" type="submit" disabled={consulting}>
                  <span className="button-paw">🐾</span>
                  {consulting ? "CONSULTING…" : "ASK ROSIE"}
                </button>
              </div>

              <div className="quick-row">
                <span>TRY ONE</span>
                <div className="quick-prompts">
                  {quickQuestions.map((prompt) => (
                    <button type="button" key={prompt} onClick={() => choosePrompt(prompt)}>
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="console-foot">
                <span>No question too difficult. No snack too small.</span>
                <strong>{consultations} consultation{consultations === 1 ? "" : "s"} tonight</strong>
              </div>
            </form>
          </div>

          <section className={`fortune-ticket ${answer ? "fortune-ticket-visible" : ""}`} aria-live="polite">
            {answer && (
              <div className="ticket-paper">
                <div className="ticket-tear ticket-tear-left" />
                <div className="ticket-tear ticket-tear-right" />
                <div className="ticket-topline">
                  <span>№ {String(consultations).padStart(3, "0")}</span>
                  <strong>MADAME ROSIE</strong>
                  <span>🐾</span>
                </div>
                <div className="ticket-question">“{question.trim()}”</div>
                <div className="ticket-answer">{answer.text}</div>
                <div className="ticket-stamp">THE PAW HAS SPOKEN</div>
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
        </main>

        <nav className="bottom-nav" aria-label="Primary">
          <button className="active"><span>✦</span><small>Fortune</small></button>
          <button disabled><span>♛</span><small>Cards</small></button>
          <button disabled><span>▧</span><small>Gallery</small></button>
          <button disabled><span>🐾</span><small>Rosie</small></button>
        </nav>
      </div>

      <div className={`toast ${toast ? "toast-visible" : ""}`}>{toast}</div>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
