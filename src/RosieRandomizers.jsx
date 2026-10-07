import React, { useEffect, useMemo, useRef, useState } from "react";
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

const DIE_PIPS = {
  1: [[0.5, 0.5]],
  2: [[0.3, 0.3], [0.7, 0.7]],
  3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
  4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]],
  5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
  6: [[0.3, 0.23], [0.7, 0.23], [0.3, 0.5], [0.7, 0.5], [0.3, 0.77], [0.7, 0.77]]
};

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawRubyPip(ctx, x, y, radius) {
  const recess = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.35, radius * 0.15, x, y, radius * 1.25);
  recess.addColorStop(0, "#f7dc83");
  recess.addColorStop(0.48, "#c39431");
  recess.addColorStop(1, "#68400e");
  ctx.fillStyle = recess;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.28, 0, Math.PI * 2);
  ctx.fill();

  const ruby = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.38, radius * 0.08, x, y, radius);
  ruby.addColorStop(0, "#ff9aa2");
  ruby.addColorStop(0.18, "#d82f45");
  ruby.addColorStop(0.58, "#9f1028");
  ruby.addColorStop(1, "#4a0310");
  ctx.fillStyle = ruby;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,244,238,.82)";
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.27, y - radius * 0.34, radius * 0.18, radius * 0.12, -0.45, 0, Math.PI * 2);
  ctx.fill();
}

function drawCasinoDie(canvas, value) {
  const ctx = canvas.getContext("2d");
  const size = 640;
  canvas.width = size;
  canvas.height = size;
  ctx.clearRect(0, 0, size, size);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const front = { x: 142, y: 188, w: 330, h: 330, r: 54 };
  const depthX = 64;
  const depthY = -58;

  ctx.save();
  ctx.shadowColor = "rgba(74,42,7,.24)";
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 23;
  ctx.fillStyle = "rgba(85,50,10,.22)";
  ctx.beginPath();
  ctx.ellipse(323, 536, 188, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const topGradient = ctx.createLinearGradient(front.x, front.y + depthY, front.x + front.w + depthX, front.y);
  topGradient.addColorStop(0, "#fff7dc");
  topGradient.addColorStop(0.48, "#efd99e");
  topGradient.addColorStop(1, "#c99a3d");
  ctx.fillStyle = topGradient;
  ctx.strokeStyle = "#765019";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(front.x + 35, front.y);
  ctx.lineTo(front.x + front.w - 14, front.y);
  ctx.quadraticCurveTo(front.x + front.w + 17, front.y - 2, front.x + front.w + depthX, front.y + depthY + 24);
  ctx.lineTo(front.x + 80, front.y + depthY);
  ctx.quadraticCurveTo(front.x + 50, front.y + depthY + 2, front.x + 35, front.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const sideGradient = ctx.createLinearGradient(front.x + front.w, front.y, front.x + front.w + depthX, front.y + front.h);
  sideGradient.addColorStop(0, "#e9ca79");
  sideGradient.addColorStop(0.55, "#c89b40");
  sideGradient.addColorStop(1, "#8e641e");
  ctx.fillStyle = sideGradient;
  ctx.beginPath();
  ctx.moveTo(front.x + front.w - 4, front.y + 29);
  ctx.quadraticCurveTo(front.x + front.w + 15, front.y + 5, front.x + front.w + depthX, front.y + depthY + 24);
  ctx.lineTo(front.x + front.w + depthX, front.y + front.h - 32);
  ctx.quadraticCurveTo(front.x + front.w + depthX - 2, front.y + front.h - 7, front.x + front.w - 9, front.y + front.h + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const faceGradient = ctx.createLinearGradient(front.x, front.y, front.x + front.w, front.y + front.h);
  faceGradient.addColorStop(0, "#fffef9");
  faceGradient.addColorStop(0.4, "#fffaf0");
  faceGradient.addColorStop(1, "#ead6a4");
  roundedRectPath(ctx, front.x, front.y, front.w, front.h, front.r);
  ctx.fillStyle = faceGradient;
  ctx.fill();
  ctx.strokeStyle = "#765019";
  ctx.lineWidth = 10;
  ctx.stroke();

  roundedRectPath(ctx, front.x + 8, front.y + 8, front.w - 16, front.h - 16, front.r - 7);
  ctx.strokeStyle = "#e5bc54";
  ctx.lineWidth = 8;
  ctx.stroke();

  roundedRectPath(ctx, front.x + 21, front.y + 21, front.w - 42, front.h - 42, front.r - 15);
  ctx.strokeStyle = "rgba(255,239,180,.96)";
  ctx.lineWidth = 4;
  ctx.stroke();

  const sheen = ctx.createLinearGradient(front.x + 35, front.y + 30, front.x + front.w - 20, front.y + 155);
  sheen.addColorStop(0, "rgba(255,255,255,.74)");
  sheen.addColorStop(0.5, "rgba(255,255,255,.10)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.strokeStyle = sheen;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(front.x + 54, front.y + 79);
  ctx.quadraticCurveTo(front.x + 170, front.y + 12, front.x + 281, front.y + 62);
  ctx.stroke();

  drawRubyPip(ctx, 274, 151, 16);
  drawRubyPip(ctx, 365, 151, 16);
  drawRubyPip(ctx, 505, 273, 15);
  drawRubyPip(ctx, 517, 354, 15);
  drawRubyPip(ctx, 526, 433, 15);

  const inner = { x: 187, y: 231, w: 238, h: 238 };
  DIE_PIPS[value].forEach(([px, py]) => {
    drawRubyPip(ctx, inner.x + inner.w * px, inner.y + inner.h * py, 20);
  });
}

function DiceFace({ value, rolling }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) drawCasinoDie(canvasRef.current, value);
  }, [value]);

  return (
    <div className={`${styles.dieRig} ${rolling ? styles.isRolling : ""}`}>
      <span className={styles.dieLandingShadow} aria-hidden="true" />
      <div className={styles.dieBody}>
        <canvas
          ref={canvasRef}
          className={styles.dieCanvas}
          role="img"
          aria-label={`Die shows ${value}`}
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

  return `conic-gradient(from ${-step / 2}deg, ${slices.join(", ")})`;
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
