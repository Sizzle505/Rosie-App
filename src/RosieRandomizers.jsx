import React, { useMemo, useState } from "react";
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
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] % length;
  }
  return Math.floor(Math.random() * length);
}

const DIE_POSITIONS = {
  1: "0% 0%",
  2: "50% 0%",
  3: "100% 0%",
  4: "0% 100%",
  5: "50% 100%",
  6: "100% 100%"
};

function DiceFace({ value, rolling }) {
  return (
    <div className={`${styles.dieMotion} ${rolling ? styles.isRolling : ""}`}>
      <div
        className={styles.dieFace}
        style={{ backgroundPosition: DIE_POSITIONS[value] }}
        role="img"
        aria-label={`Die shows ${value}`}
      />
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
    const color = index % 2 === 0 ? "#7B1023" : "#111216";
    slices.push(`${color} ${start}deg ${Math.max(start, end - 1.3)}deg`);
    slices.push(`#D6B765 ${Math.max(start, end - 1.3)}deg ${end}deg`);
  }
  return `conic-gradient(from ${-step / 2}deg, ${slices.join(", ")})`;
}

export default function RosieRandomizers() {
  const [coin, setCoin] = useState("Heads");
  const [coinFlip, setCoinFlip] = useState(false);
  const [coinTurn, setCoinTurn] = useState({ start: 0, end: 1080 });
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
    const start = coin === "Tails" ? 180 : 0;
    const finish = next === "Tails" ? 180 : 0;
    const faceDelta = (finish - start + 360) % 360;
    setCoinTurn({ start, end: start + 1080 + faceDelta });
    setCoin(next);
    setCoinResult("In the air…");
    setCoinFlip(true);
    window.navigator.vibrate?.(14);
    window.setTimeout(() => {
      setCoinResult(next === "Heads" ? "Heads - Rosie takes the room." : "Tails - the curl has spoken.");
      setCoinFlip(false);
      window.navigator.vibrate?.([10, 28, 10]);
    }, 920);
  }

  function rollDice() {
    if (diceRoll) return;
    const next = randomIndex(6) + 1;
    const tumbleFaces = Array.from({ length: 7 }, () => randomIndex(6) + 1);
    setDiceResult("Rolling across the ivory…");
    setDiceRoll(true);
    window.navigator.vibrate?.(12);
    tumbleFaces.forEach((face, index) => {
      window.setTimeout(() => setDice(face), 100 + index * 105);
    });
    window.setTimeout(() => setDice(next), 865);
    window.setTimeout(() => {
      setDiceResult(`${next}. Rosie calls it clean.`);
      setDiceRoll(false);
      window.navigator.vibrate?.([8, 24, 8]);
    }, 1080);
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
              className={`${styles.coin} ${coin === "Tails" ? styles.showTails : ""} ${coinFlip ? styles.coinFlipping : ""}`}
              style={{ "--coin-start": `${coinTurn.start}deg`, "--coin-end": `${coinTurn.end}deg` }}
              aria-label={`Coin shows ${coin}`}
            >
              <span className={`${styles.coinFace} ${styles.coinFront}`} aria-hidden="true">
                <img src="/randomizers/rosie-coin.webp" alt="" />
              </span>
              <span className={`${styles.coinFace} ${styles.coinBack}`} aria-hidden="true">
                <img src="/randomizers/rosie-coin-tail.webp" alt="" />
              </span>
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
                      "--label-angle": `${index * step}deg`
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
          <p>Add up to ten. Tap a seated choice to remove it.</p>

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
              <button
                type="button"
                key={`${entry}-${index}`}
                onClick={() => removeEntry(index)}
                disabled={entries.length <= 2}
                title={entries.length <= 2 ? "Keep at least two choices" : `Remove ${entry}`}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{entry}</b>
                <i aria-hidden="true">×</i>
              </button>
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
