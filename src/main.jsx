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
    }, 430);

    turnEndTimerRef.current = window.setTimeout(() => {
      setTurning(false);
    }, 1080);
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

      <div className={`app-shell ${loaded ? "app-shell-visible" : ""}`}>
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
