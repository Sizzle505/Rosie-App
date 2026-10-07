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
  2: [[0.28, 0.28], [0.72, 0.72]],
  3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
  6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]]
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

function drawRubyPip(ctx, x, y, radius, scaleY = 1, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(1, scaleY);

  const rim = ctx.createRadialGradient(-radius * 0.26, -radius * 0.3, radius * 0.18, 0, 0, radius * 1.35);
  rim.addColorStop(0, "#fff1aa");
  rim.addColorStop(0.48, "#d4a73d");
  rim.addColorStop(1, "#6d430d");
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.32, 0, Math.PI * 2);
  ctx.fill();

  const ruby = ctx.createRadialGradient(-radius * 0.28, -radius * 0.34, radius * 0.08, 0, 0, radius);
  ruby.addColorStop(0, "#ffd9df");
  ruby.addColorStop(0.13, "#ff8d9b");
  ruby.addColorStop(0.34, "#d52542");
  ruby.addColorStop(0.68, "#8e071d");
  ruby.addColorStop(1, "#3c020b");
  ctx.fillStyle = ruby;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,248,244,.78)";
  ctx.beginPath();
  ctx.ellipse(-radius * 0.29, -radius * 0.34, radius * 0.16, radius * 0.1, -0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPhysicalDie(canvas, value) {
  const width = 640;
  const height = 600;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const front = { x: 166, y: 154, w: 400, h: 400, r: 64 };
  const backX = -74;
  const backY = -66;

  ctx.save();
  ctx.shadowColor = "rgba(74,43,8,.22)";
  ctx.shadowBlur = 21;
  ctx.fillStyle = "rgba(75,44,9,.24)";
  ctx.beginPath();
  ctx.ellipse(344, 562, 176, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const topGradient = ctx.createLinearGradient(front.x + backX, front.y + backY, front.x + front.w, front.y);
  topGradient.addColorStop(0, "#f4dfaa");
  topGradient.addColorStop(0.42, "#fff8df");
  topGradient.addColorStop(0.74, "#e0bd66");
  topGradient.addColorStop(1, "#9b6a20");
  ctx.fillStyle = topGradient;
  ctx.strokeStyle = "#6b430e";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(front.x + 54, front.y);
  ctx.lineTo(front.x + front.w - 52, front.y);
  ctx.lineTo(front.x + front.w - 52 + backX, front.y + backY);
  ctx.lineTo(front.x + 54 + backX, front.y + backY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const leftGradient = ctx.createLinearGradient(front.x + backX, front.y, front.x, front.y + front.h);
  leftGradient.addColorStop(0, "#d6ad53");
  leftGradient.addColorStop(0.36, "#f1db9a");
  leftGradient.addColorStop(0.72, "#b47c28");
  leftGradient.addColorStop(1, "#74450d");
  ctx.fillStyle = leftGradient;
  ctx.beginPath();
  ctx.moveTo(front.x, front.y + 54);
  ctx.lineTo(front.x, front.y + front.h - 54);
  ctx.lineTo(front.x + backX, front.y + front.h - 54 + backY);
  ctx.lineTo(front.x + backX, front.y + 54 + backY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  roundedRectPath(ctx, front.x - 5, front.y - 5, front.w + 10, front.h + 10, front.r + 7);
  const bevel = ctx.createLinearGradient(front.x, front.y, front.x + front.w, front.y + front.h);
  bevel.addColorStop(0, "#fff0a9");
  bevel.addColorStop(0.18, "#c89531");
  bevel.addColorStop(0.42, "#75470d");
  bevel.addColorStop(0.67, "#f1d477");
  bevel.addColorStop(1, "#99631a");
  ctx.fillStyle = bevel;
  ctx.fill();
  ctx.strokeStyle = "#5c370b";
  ctx.lineWidth = 5;
  ctx.stroke();

  const inner = { x: front.x + 13, y: front.y + 13, w: front.w - 26, h: front.h - 26, r: front.r - 12 };
  roundedRectPath(ctx, inner.x, inner.y, inner.w, inner.h, inner.r);
  const ivory = ctx.createLinearGradient(inner.x, inner.y, inner.x + inner.w, inner.y + inner.h);
  ivory.addColorStop(0, "#fffefa");
  ivory.addColorStop(0.34, "#fffaf0");
  ivory.addColorStop(0.76, "#f4e8cb");
  ivory.addColorStop(1, "#e2c992");
  ctx.fillStyle = ivory;
  ctx.fill();
  ctx.strokeStyle = "#e8c86f";
  ctx.lineWidth = 5;
  ctx.stroke();

  roundedRectPath(ctx, inner.x + 12, inner.y + 12, inner.w - 24, inner.h - 24, inner.r - 9);
  ctx.strokeStyle = "rgba(255,247,211,.92)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.save();
  roundedRectPath(ctx, inner.x + 7, inner.y + 7, inner.w - 14, inner.h - 14, inner.r - 6);
  ctx.clip();
  const shine = ctx.createLinearGradient(inner.x + 20, inner.y + 12, inner.x + inner.w - 35, inner.y + 190);
  shine.addColorStop(0, "rgba(255,255,255,.72)");
  shine.addColorStop(0.4, "rgba(255,255,255,.14)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h * 0.6);
  ctx.restore();

  drawRubyPip(ctx, 275, 118, 17, 0.56, -0.06);
  drawRubyPip(ctx, 394, 112, 17, 0.56, -0.06);
  drawRubyPip(ctx, 126, 256, 16, 0.7, -0.12);
  drawRubyPip(ctx, 120, 358, 16, 0.7, -0.12);
  drawRubyPip(ctx, 114, 459, 16, 0.7, -0.12);

  const pipZone = { x: inner.x + 53, y: inner.y + 53, w: inner.w - 106, h: inner.h - 106 };
  DIE_PIPS[value].forEach(([px, py]) => {
    drawRubyPip(
      ctx,
      pipZone.x + pipZone.w * px,
      pipZone.y + pipZone.h * py,
      22
    );
  });
}

function DiceFace({ value, rolling }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawPhysicalDie(canvasRef.current, value);
    }
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
