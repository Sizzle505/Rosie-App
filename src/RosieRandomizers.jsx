import React, { useEffect, useMemo, useState } from "react";
import styles from "./RosieRandomizers.module.css";

const DEFAULT_WHEEL = [
  "Go Out",
  "Stay In",
  "Treat Run",
  "Tiny Adventure",
  "Nap First",
  "Dealer's Choice"
];

function randomIndex(length) {
  if (length <= 1) return 0;

  if (globalThis.crypto?.getRandomValues) {
    const range = 0x100000000;
    const limit = range - (range % length);
    const value = new Uint32Array(1);

    do {
      globalThis.crypto.getRandomValues(value);
    } while (value[0] >= limit);

    return value[0] % length;
  }

  return Math.floor(Math.random() * length);
}

const DIE_ASSETS = Object.freeze([
  "/randomizers/rosie-die-1.webp",
  "/randomizers/rosie-die-2.webp",
  "/randomizers/rosie-die-3.webp",
  "/randomizers/rosie-die-4.webp",
  "/randomizers/rosie-die-5.webp",
  "/randomizers/rosie-die-6.webp"
]);

function DiceFace({ value, rolling }) {
  useEffect(() => {
    DIE_ASSETS.forEach((src) => {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
    });
  }, []);

  return (
    <div className={`${styles.dieRig} ${rolling ? styles.isRolling : ""}`}>
      <span className={styles.dieLandingShadow} aria-hidden="true" />
      <div className={styles.dieBody}>
        <img
          src={DIE_ASSETS[value - 1]}
          className={styles.dieImage}
          alt={`Die shows ${value}`}
          width="384"
          height="384"
          draggable="false"
        />
      </div>
    </div>
  );
}

function makeWheelGradient(count) {
  if (!count) return "#08090B";
  const step = 360 / count;
  const slices = [];

  for (let index = 0; index < count; index += 1) {
    const start = index * step;
    const end = (index + 1) * step;
    const isLastOddSlice = count % 2 === 1 && index === count - 1;
    const color = isLastOddSlice
      ? "#C29A43"
      : index % 2 === 0
        ? "#7B1023"
        : "#111216";

    slices.push(`${color} ${start}deg ${Math.max(start, end - 1.35)}deg`);
    slices.push(`#D9BB68 ${Math.max(start, end - 1.35)}deg ${end}deg`);
  }

  return [
    "radial-gradient(circle at 34% 24%, rgba(255,255,255,.16), transparent 25%)",
    "radial-gradient(circle at 50% 50%, transparent 48%, rgba(0,0,0,.18) 68%, rgba(0,0,0,.58) 100%)",
    `conic-gradient(from ${-step / 2}deg, ${slices.join(", ")})`
  ].join(", ");
}

function wheelLabelColor(index, count) {
  return count % 2 === 1 && index === count - 1 ? "#2C1C0A" : "#FFF7DF";
}

export default function RosieRandomizers() {
  const [coin, setCoin] = useState("Heads");
  const [coinFlip, setCoinFlip] = useState(false);
  const [coinVisual, setCoinVisual] = useState("Heads");
  const [dice, setDice] = useState(5);
  const [diceRoll, setDiceRoll] = useState(false);
  const [entries, setEntries] = useState(DEFAULT_WHEEL);
  const [draft, setDraft] = useState("");
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState("Rosie is taking wagers.");
  const [coinResult, setCoinResult] = useState("Heads is on the table.");
  const [diceResult, setDiceResult] = useState("Showing a five.");

  const sectors = useMemo(
    () => entries.map((entry, index) => ({ entry, index })),
    [entries]
  );
  const wheelBackground = useMemo(
    () => makeWheelGradient(entries.length),
    [entries.length]
  );

  function flipCoin() {
    if (coinFlip) return;

    const next = randomIndex(2) === 0 ? "Heads" : "Tails";
    setCoinResult("In the air…");
    setCoinFlip(true);
    window.navigator.vibrate?.(14);

    window.setTimeout(() => {
      setCoinVisual(next);
    }, 455);

    window.setTimeout(() => {
      setCoin(next);
      setCoinVisual(next);
      setCoinResult(next === "Heads" ? "Heads - Rosie takes the room." : "Tails - the curl has spoken.");
      setCoinFlip(false);
      window.navigator.vibrate?.([10, 28, 10]);
    }, 980);
  }

  function rollDice() {
    if (diceRoll) return;
    const next = randomIndex(6) + 1;
    const tumbleFaces = Array.from({ length: 8 }, () => randomIndex(6) + 1);
    setDiceResult("Rolling across the ivory…");
    setDiceRoll(true);
    window.navigator.vibrate?.(12);
    tumbleFaces.forEach((face, index) => {
      window.setTimeout(() => setDice(face), 95 + index * 112);
    });
    window.setTimeout(() => setDice(next), 1040);
    window.setTimeout(() => {
      setDiceResult(`${next}. Rosie calls it clean.`);
      setDiceRoll(false);
      window.navigator.vibrate?.([8, 24, 8]);
    }, 1260);
  }

  function spinWheel() {
    if (spinning || !entries.length) return;
    const pick = randomIndex(entries.length);
    const step = 360 / entries.length;
    const currentMod = ((angle % 360) + 360) % 360;
    const desiredMod = (360 - pick * step) % 360;
    const delta = (desiredMod - currentMod + 360) % 360;
    const nextAngle = angle + 360 * 6 + delta;

    setSpinning(true);
    setWheelResult("Rosie gives the wheel a proper spin…");
    setAngle(nextAngle);
    window.navigator.vibrate?.(16);
    window.setTimeout(() => {
      setWheelResult(entries[pick]);
      setSpinning(false);
      window.navigator.vibrate?.([12, 34, 12]);
    }, 2280);
  }

  function addEntry(event) {
    event.preventDefault();
    const value = draft.trim();
    if (!value || entries.length >= 10) return;
    setEntries((items) => [...items, value]);
    setDraft("");
    setWheelResult("New choice seated at the table.");
  }

  function updateEntry(index, value) {
    setEntries((items) => items.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  function finalizeEntry(index) {
    setEntries((items) => items.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const clean = item.trim();
      return clean || `Choice ${index + 1}`;
    }));
  }

  function removeEntry(index) {
    if (entries.length <= 2) return;
    setEntries((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setAngle(0);
    setWheelResult("Wheel recalibrated.");
  }

  function resetWheel() {
    setEntries(DEFAULT_WHEEL);
    setAngle(0);
    setWheelResult("House wheel restored.");
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.kicker}><span /> ROSIE'S PRIVATE SALON <span /></div>
          <h1>Rosie’s Randomizers</h1>
          <p>For decisions too important to leave to humans.</p>
          <div className={styles.houseRule}>Decisive · impartial · occasionally snack-motivated</div>
        </div>
        <div className={styles.hostPortrait} aria-label="Rosie, your casino host">
          <img src="/randomizers/rosie-casino.webp" alt="Rosie dressed as an elegant casino host" />
          <span className={styles.portraitGlow} />
        </div>
        <img className={styles.heroSignet} src="/randomizers/rosie-signet.webp" alt="" aria-hidden="true" />
      </header>

      <section className={styles.ivoryRow} aria-label="Quick randomizers">
        <article className={styles.ivoryCard}>
          <div className={styles.cardTopline}>
            <span>THE HOUSE COIN</span>
            <i>01</i>
          </div>
          <h2>Leave it to chance.</h2>
          <div className={styles.coinScene}>
            <span className={styles.coinShadow} />
            <div
              className={`${styles.coin} ${coinFlip ? styles.coinFlipping : ""}`}
              aria-label={`Coin shows ${coinFlip ? "flipping" : coin}`}
            >
              <img
                src={coinVisual === "Heads" ? "/randomizers/rosie-coin.webp" : "/randomizers/rosie-coin-tail.webp"}
                alt={coinVisual === "Heads" ? "Rosie cameo - heads" : "Rosie tail - tails"}
              />
            </div>
          </div>
          <div className={styles.readout} aria-live="polite">
            <strong>{coinFlip ? "FLIPPING" : coin.toUpperCase()}</strong>
            <span>{coinResult}</span>
          </div>
          <button className={styles.goldButton} onClick={flipCoin} disabled={coinFlip}>
            <span aria-hidden="true">✦</span> FLIP THE COIN
          </button>
        </article>

        <article className={styles.ivoryCard}>
          <div className={styles.cardTopline}>
            <span>ROSIE'S DICE</span>
            <i>02</i>
          </div>
          <h2>A roll with standards.</h2>
          <div className={styles.diceScene}>
            <img className={`${styles.decorativeDie} ${styles.decorativeDieLeft}`} src="/randomizers/rosie-decorative-die.webp" alt="" aria-hidden="true" />
            <img className={`${styles.decorativeDie} ${styles.decorativeDieRight}`} src="/randomizers/rosie-decorative-die.webp" alt="" aria-hidden="true" />
            <DiceFace value={dice} rolling={diceRoll} />
          </div>
          <div className={styles.readout} aria-live="polite">
            <strong>{diceRoll ? "ROLLING" : `ROLLED ${dice}`}</strong>
            <span>{diceResult}</span>
          </div>
          <button className={styles.goldButton} onClick={rollDice} disabled={diceRoll}>
            <span aria-hidden="true">◆</span> ROLL THE DIE
          </button>
        </article>
      </section>

      <section className={styles.wheelSalon} aria-label="Custom decision wheel">
        <div className={styles.wheelStage}>
          <div className={styles.wheelHeading}>
            <span>THE PRIVATE WHEEL</span>
            <h2>Dealer’s choice.</h2>
            <p>Rosie spins. Everyone lives with it.</p>
          </div>

          <div className={styles.wheelWrap}>
            <div className={styles.pointer} aria-hidden="true"><i /></div>
            <div
              className={styles.wheel}
              style={{
                "--rotation": `${angle}deg`,
                background: wheelBackground
              }}
            >
              {sectors.map(({ entry, index }) => {
                const step = 360 / sectors.length;
                return (
                  <span
                    key={`${entry}-${index}`}
                    className={styles.wheelLabel}
                    style={{
                      "--label-angle": `${index * step}deg`,
                      color: wheelLabelColor(index, sectors.length)
                    }}
                  >
                    <b>{entry}</b>
                  </span>
                );
              })}
              <div className={styles.wheelHub}>
                <img src="/randomizers/rosie-signet.webp" alt="" aria-hidden="true" />
              </div>
            </div>
            <div className={styles.wheelBase} aria-hidden="true" />
          </div>

          <div className={styles.wheelVerdict} aria-live="polite">
            <small>{spinning ? "THE HOUSE IS DECIDING" : "ROSIE'S VERDICT"}</small>
            <strong>{wheelResult}</strong>
          </div>
          <button className={styles.spinButton} onClick={spinWheel} disabled={spinning || entries.length < 2}>
            <span aria-hidden="true">✦</span> {spinning ? "SPINNING…" : "SPIN THE WHEEL"} <span aria-hidden="true">✦</span>
          </button>
        </div>

        <aside className={styles.wheelEditor}>
          <div className={styles.editorHead}>
            <img src="/randomizers/rosie-signet.webp" alt="" aria-hidden="true" />
            <div>
              <span>YOUR TABLE</span>
              <h3>Set the choices</h3>
            </div>
          </div>
          <p>Add up to ten. Every seated choice is editable; changes update the wheel instantly.</p>

          <form className={styles.addForm} onSubmit={addEntry}>
            <label htmlFor="rosie-wheel-choice">NEW CHOICE</label>
            <div>
              <input
                id="rosie-wheel-choice"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Dinner, movie, tiny adventure…"
                maxLength={28}
                disabled={entries.length >= 10}
              />
              <button type="submit" disabled={!draft.trim() || entries.length >= 10}>ADD</button>
            </div>
          </form>

          <div className={styles.chips}>
            {entries.map((entry, index) => (
              <div className={styles.choiceRow} key={`choice-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <input
                  value={entry}
                  onChange={(event) => updateEntry(index, event.target.value)}
                  onBlur={() => finalizeEntry(index)}
                  maxLength={28}
                  aria-label={`Wheel choice ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  disabled={entries.length <= 2}
                  title={entries.length <= 2 ? "Keep at least two choices" : `Remove ${entry || `choice ${index + 1}`}`}
                  aria-label={`Remove ${entry || `choice ${index + 1}`}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className={styles.editorFooter}>
            <small>{entries.length}/10 SEATS FILLED</small>
            <button type="button" onClick={resetWheel}>RESTORE HOUSE WHEEL</button>
          </div>
        </aside>
      </section>

      <footer className={styles.salonsFooter}>
        <span />
        <p><b>HOUSE NOTE</b> Rosie accepts no appeals, but she may accept cheese.</p>
        <span />
      </footer>
    </main>
  );
}
