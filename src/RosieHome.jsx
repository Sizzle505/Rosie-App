import React from "react";
import styles from "./RosieHome.module.css";

const portals = [
  { id:"fortune", number:"01", title:"Madame Rosie", tagline:"Petition the Oracle", motif:"✦" },
  { id:"cheese", number:"02", title:"Barkbridge Academy", tagline:"Sit for the Cheese Exam", motif:"◇" },
  { id:"captain", number:"03", title:"Captain Rosie", tagline:"Take the Helm", motif:"⚓" },
  { id:"vault", number:"04", title:"The Card Vault", tagline:"Discover Every Rosie", motif:"❖" },
  { id:"randomizers", number:"05", title:"Rosie’s Randomizers", tagline:"Leave It to Chance", motif:"✧" }
];

export default function RosieHome({ onNavigate }) {
  return <main className={styles.home}>
    <div className={styles.masthead}><span className={styles.line}/><span>EST. APRIL 28, 2016</span><span className={styles.paw}>✦</span><span>AN EXCLUSIVE WORLD OF WONDER</span><span className={styles.line}/></div>
    <section className={styles.hero} aria-labelledby="house-title">
      <div className={styles.heroCopy}>
        <div className={styles.eyebrow}>WELCOME TO THE PRIVATE WORLD OF</div>
        <h1 id="house-title"><span>THE HOUSE</span><em>of</em><span>ROSIE</span></h1>
        <div className={styles.rule}><i/>✦<i/></div>
        <p>Five worlds. One extraordinary Shiba.</p>
        <small>Where wisdom comes with whiskers, and every adventure belongs to Rosie.</small>
        <button type="button" className={styles.enter} onClick={() => document.getElementById("house-portals")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block:"start" })}>EXPLORE HER WORLDS <span aria-hidden="true">↓</span></button>
      </div>
      <div className={styles.artFrame}>
        <img src="/home/rosie-grand-salon.svg" alt="Original illustration of black-and-tan Shiba Inu Rosie presiding over a magnificent burgundy and gold private grand salon" fetchPriority="high" width="1600" height="1000"/>
        <div className={styles.artCaption}>HER MAJESTY, ROSIE <span>✦</span> PATRONESS OF ALL GOOD THINGS</div>
      </div>
    </section>
    <section className={styles.destinations} id="house-portals" aria-label="Explore Rosie’s five worlds">
      <div className={styles.sectionHead}><span>THE FIVE SALONS</span><h2>Choose your pleasure</h2><p>Every door opens onto another side of Rosie.</p></div>
      <div className={styles.portalGrid}>
        {portals.map(portal => <button type="button" key={portal.id} className={`${styles.portal} ${styles[portal.id]}`} onClick={() => onNavigate(portal.id)}>
          <span className={styles.portalHead}><span>THE HOUSE OF ROSIE</span><span>{portal.number} / 05</span></span>
          <span className={styles.motif} aria-hidden="true">{portal.motif}</span>
          <strong>{portal.title}</strong>
          <span className={styles.tagline}>{portal.tagline}</span>
          <span className={styles.portalFoot}><span>ENTER THE SALON</span><span aria-hidden="true">↗</span></span>
        </button>)}
      </div>
    </section>
    <footer className={styles.footer}><span>✦</span> ALL HAIL THE GOOD GIRL <span>✦</span></footer>
  </main>;
}
