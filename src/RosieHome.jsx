import React from "react";
import styles from "./RosieHome.module.css";

/* The portraits are existing, authentic Rosie assets - never generated substitutes. */
const worlds = [
  { id:"fortune", title:"Madame Rosie", subtitle:"The Fortune Teller", invitation:"ASK THE ORACLE", image:"/rosie-mood-focused.webp", alt:"Rosie thoughtfully considering a fortune", symbol:"✧" },
  { id:"cheese", title:"Barkbridge", subtitle:"The Cheese Academy", invitation:"TAKE THE EXAM", image:"/rosie-doctor-cheese.webp", alt:"Rosie as the distinguished cheese doctor", symbol:"✦" },
  { id:"captain", title:"Captain Rosie", subtitle:"The Coastal Voyage", invitation:"TAKE THE HELM", image:"/captain-rosie.webp", alt:"The real Rosie dressed as captain", symbol:"⚓" },
  { id:"vault", title:"The Card Vault", subtitle:"A Thousand Faces of Rosie", invitation:"OPEN THE VAULT", image:"/rosie-reaction-proud.webp", alt:"Rosie looking proud", symbol:"❖" },
  { id:"randomizers", title:"Rosie's Randomizers", subtitle:"The Parlour of Chance", invitation:"TRY YOUR LUCK", image:"/rosie-reaction-amused.webp", alt:"Rosie looking amused", symbol:"✳" }
];

export default function RosieHome({ onNavigate }) {
  return (
    <main className={styles.home} aria-labelledby="rosie-house-title">
      <div className={styles.cornerEtching} aria-hidden="true" />
      <header className={styles.heading}>
        <div className={styles.overline}><i/> EST. 28 APRIL 2016 <span>✦</span> HER VERY OWN LITTLE KINGDOM <i/></div>
        <div className={styles.brandLine}>
          <span className={styles.brandFlourish} aria-hidden="true">❧</span>
          <h1 id="rosie-house-title"><span>The House</span><em>of</em><span>Rosie</span></h1>
          <span className={styles.brandFlourish} aria-hidden="true">❧</span>
        </div>
        <p>Five delightful worlds. One very extraordinary Shiba.</p>
        <div className={styles.underRule} aria-hidden="true"><i/><span>✦</span><i/></div>
      </header>
      <nav className={styles.worldGrid} aria-label="Choose a world of Rosie">
        {worlds.map((world, index) => (
          <button type="button" key={world.id}
            className={`${styles.world} ${styles[world.id]}`}
            onClick={() => onNavigate(world.id)}
            aria-label={`Visit ${world.title}: ${world.subtitle}`}>
            <span className={styles.cardNumber}>THE HOUSE OF ROSIE <span>{String(index + 1).padStart(2,"0")} / 05</span></span>
            <span className={styles.portraitStage}>
              <span className={styles.rays} aria-hidden="true"/>
              <span className={styles.portraitRing}>
                <img src={world.image} alt={world.alt} loading="eager" draggable="false" />
              </span>
              <span className={styles.sparkle} aria-hidden="true">{world.symbol}</span>
            </span>
            <span className={styles.worldCopy}>
              <strong>{world.title}</strong>
              <span className={styles.subtitle}>{world.subtitle}</span>
            </span>
            <span className={styles.cardLink}>{world.invitation}<span aria-hidden="true">↗</span></span>
          </button>
        ))}
      </nav>
      <footer className={styles.footer}><span>✦</span> CURATED BY ROSIE · APPROVED BY ROSIE <span>✦</span></footer>
    </main>
  );
}
