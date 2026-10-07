import { useMemo, useState } from "react";
import styles from "./RosieRandomizers.module.css";

const DEFAULT_WHEEL = ["Treat Run", "Walk First", "Cheese Course", "Nap Break", "Tiny Adventure", "Dealer's Choice"];

function Die({ value, rolling }) {
  const dots = { 1:[4], 2:[0,8], 3:[0,4,8], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] }[value];
  return <div className={`${styles.die} ${rolling ? styles.rolling : ""}`} aria-label={`Die shows ${value}`}>
    {Array.from({ length: 9 }, (_, index) => <i key={index} className={dots.includes(index) ? styles.dot : ""} />)}
  </div>;
}

export default function RosieRandomizers() {
  const [coin, setCoin] = useState("Heads");
  const [coinFlip, setCoinFlip] = useState(false);
  const [dice, setDice] = useState([3, 5]);
  const [diceRoll, setDiceRoll] = useState(false);
  const [entries, setEntries] = useState(DEFAULT_WHEEL);
  const [draft, setDraft] = useState("");
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState("Rosie is ready to decide.");
  const sectors = useMemo(() => entries.map((entry, index) => ({ entry, index })), [entries]);

  function flipCoin() {
    if (coinFlip) return;
    setCoinFlip(true); setResult("The house flips for you…");
    window.setTimeout(() => { const next = Math.random() < .5 ? "Heads" : "Tails"; setCoin(next); setResult(`${next}. Rosie calls it with authority.`); setCoinFlip(false); }, 760);
  }
  function rollDice() {
    if (diceRoll) return;
    setDiceRoll(true); setResult("Dice across the ivory felt…");
    window.setTimeout(() => { const next=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)]; setDice(next); setResult(`${next[0]} + ${next[1]} = ${next[0]+next[1]}. A civilized roll.`); setDiceRoll(false); }, 740);
  }
  function spinWheel() {
    if (spinning || !entries.length) return;
    const pick = Math.floor(Math.random() * entries.length);
    const step = 360 / entries.length;
    const target = 360 * 6 + (360 - pick * step - step / 2);
    setSpinning(true); setResult("Rosie consults the crimson wheel…"); setAngle((current) => current + target);
    window.setTimeout(() => { setResult(`The wheel chooses: ${entries[pick]}.`); setSpinning(false); }, 1550);
  }
  function addEntry(event) { event.preventDefault(); const value=draft.trim(); if (!value || entries.length >= 10) return; setEntries((items)=>[...items,value]); setDraft(""); }
  function resetWheel() { setEntries(DEFAULT_WHEEL); setAngle(0); setResult("The house wheel has been restored."); }

  return <main className={styles.page}>
    <header className={styles.hero}>
      <div><span className={styles.eyebrow}>THE HOUSE OF ROSIE · PRIVATE GAMING ROOM</span><h1>Rosie’s Randomizers</h1><p>Elegant odds. Immediate answers. No appeals to the pit boss.</p></div>
      <div className={styles.crest} aria-hidden="true">🐾<small>R</small></div>
    </header>
    <p className={styles.result} aria-live="polite">{result}</p>
    <section className={styles.table} aria-label="Rosie's randomizers">
      <article className={styles.card}><div className={styles.cardHead}><span>01 · COIN</span><b>FATE CALL</b></div><div className={`${styles.coin} ${coinFlip ? styles.coinFlip : ""}`}><span>{coin === "Heads" ? "R" : "🐾"}</span></div><strong>{coin}</strong><button onClick={flipCoin} disabled={coinFlip}>FLIP THE COIN</button></article>
      <article className={styles.card}><div className={styles.cardHead}><span>02 · DICE</span><b>DOUBLE SIX</b></div><div className={styles.dice}><Die value={dice[0]} rolling={diceRoll}/><Die value={dice[1]} rolling={diceRoll}/></div><strong>{dice[0] + dice[1]} total</strong><button onClick={rollDice} disabled={diceRoll}>ROLL THE DICE</button></article>
      <article className={`${styles.card} ${styles.wheelCard}`}><div className={styles.cardHead}><span>03 · WHEEL</span><b>DEALER’S CHOICE</b></div><div className={styles.wheelWrap}><i className={styles.pointer}>◆</i><div className={styles.wheel} style={{ "--rotation": `${angle}deg`, "--slices": sectors.length }}>
        {sectors.map(({entry,index}) => <span key={`${entry}-${index}`} style={{ "--i": index, "--count": sectors.length }}>{entry}</span>)}
      </div></div><button onClick={spinWheel} disabled={spinning}>SPIN THE WHEEL</button></article>
    </section>
    <section className={styles.wheelEditor}><div><span>HOUSE WHEEL</span><strong>Make the call yours</strong><small>Up to ten choices. The wheel recalibrates instantly.</small></div><form onSubmit={addEntry}><input value={draft} onChange={(event)=>setDraft(event.target.value)} placeholder="Add a choice" maxLength="28"/><button type="submit">ADD</button><button type="button" className={styles.ghost} onClick={resetWheel}>RESET</button></form><div className={styles.chips}>{entries.map((entry,index)=><button type="button" key={`${entry}-${index}`} onClick={()=>setEntries((items)=>items.filter((_,itemIndex)=>itemIndex!==index))}>{entry}<i>×</i></button>)}</div></section>
  </main>;
}
