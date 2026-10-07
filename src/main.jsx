import React, { useEffect, useMemo, useState } from "react";
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

function RosiePortrait({ consulting }) {
  return (
    <div className={`rosie-portrait ${consulting ? "is-consulting" : ""}`} aria-label="Stylized portrait of Rosie">
      <div className="ear ear-left" />
      <div className="ear ear-right" />
      <div className="turban">
        <span className="turban-gem" />
      </div>
      <div className="head">
        <span className="brow brow-left" />
        <span className="brow brow-right" />
        <span className="eye eye-left" />
        <span className="eye eye-right" />
        <div className="muzzle">
          <span className="nose" />
          <span className="smile" />
        </div>
      </div>
      <div className="robe">
        <span className="robe-stars">✦ · ✧ · ✦</span>
      </div>
      <div className="paw-hand">🐾</div>
    </div>
  );
}

function FortuneMachine({ consulting }) {
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
          <span className="moon">☾</span>
          <span className="star star-a">✦</span>
          <span className="star star-b">✧</span>
          <RosiePortrait consulting={consulting} />
        </div>

        <div className={`crystal-ball ${consulting ? "is-active" : ""}`}>
          <span className="ball-paw">🐾</span>
          <span className="mist mist-a" />
          <span className="mist mist-b" />
        </div>
        <div className="ball-base"><span>🐾</span></div>
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

  const recent = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("rosieRecent") || "[]");
    } catch {
      return [];
    }
  }, [answer]);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 1150);
    return () => window.clearTimeout(timer);
  }, []);

  function chooseFortune() {
    let candidates = FORTUNES.filter((item) => !recent.includes(item.id));
    if (candidates.length < 10) candidates = FORTUNES;
    const selection = candidates[secureIndex(candidates.length)];
    const next = [...recent.filter((id) => id !== selection.id), selection.id].slice(-5);
    sessionStorage.setItem("rosieRecent", JSON.stringify(next));
    return selection;
  }

  function askRosie(event) {
    event.preventDefault();
    if (!question.trim() || consulting) return;
    setAnswer(null);
    setConsulting(true);
    const result = chooseFortune();
    const delay = 1350 + secureIndex(450);
    window.setTimeout(() => {
      setAnswer(result);
      setConsulting(false);
      window.navigator.vibrate?.(25);
    }, delay);
  }

  function askAnother() {
    setQuestion("");
    setAnswer(null);
    document.querySelector("#question")?.focus();
  }

  function saveFortune() {
    if (!answer) return;
    const saved = JSON.parse(localStorage.getItem("rosieSavedFortunes") || "[]");
    saved.unshift({ question, answer: answer.text, tone: answer.tone, savedAt: new Date().toISOString() });
    localStorage.setItem("rosieSavedFortunes", JSON.stringify(saved.slice(0, 50)));
    setToast("Fortune saved to Rosie's vault.");
    window.setTimeout(() => setToast(""), 1800);
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
          <button className="round-button" aria-label="Rosie profile">🐾</button>
        </header>

        <main>
          <FortuneMachine consulting={consulting} />

          <section className="intro">
            <p className="eyebrow">FORTUNES · ADVICE · HIGHLY QUALIFIED OPINIONS</p>
            <h2>Ask Madame Rosie</h2>
            <p>Ask your question. Rosie will consult the ball, the universe, and possibly the kitchen.</p>
          </section>

          <form className="question-card" onSubmit={askRosie}>
            <label htmlFor="question">WHAT TROUBLES YOU?</label>
            <div className="question-row">
              <input
                id="question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={160}
                autoComplete="off"
                placeholder="Should I text them back?"
              />
              <button className="ask-button" type="submit" disabled={consulting}>
                {consulting ? "CONSULTING…" : "ASK ROSIE"}
              </button>
            </div>
            <p>No question too difficult. No snack too small.</p>
          </form>

          <section className={`answer-card ${answer ? "answer-card-visible" : ""}`} aria-live="polite">
            {answer && (
              <>
                <small>THE PAW HAS SPOKEN</small>
                <blockquote>“{answer.text}”</blockquote>
                <div className="answer-actions">
                  <button onClick={askAnother}>ASK ANOTHER</button>
                  <button className="secondary" onClick={saveFortune}>SAVE FORTUNE</button>
                </div>
              </>
            )}
          </section>
        </main>

        <nav className="bottom-nav" aria-label="Primary">
          <button className="active"><span>✦</span><small>Fortune</small></button>
          <button disabled><span>♛</span><small>Cards</small></button>
          <button disabled><span>✧</span><small>Gallery</small></button>
          <button disabled><span>🐾</span><small>Rosie</small></button>
        </nav>
      </div>

      <div className={`toast ${toast ? "toast-visible" : ""}`}>{toast}</div>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
