import React from "react";
import styles from "./RosieHome.module.css";
import RosieVerseAtmosphere from "./RosieVerseAtmosphere";

const worlds = [
  { id: "fortune", name: "Fortune Teller", art: "buttons/fortune.webp" },
  { id: "cheese", name: "Cheese Board Exam", art: "buttons/cheese.webp" },
  { id: "captain", name: "Captain Rosie", art: "buttons/captain.webp" },
  { id: "vault", name: "Card Vault", art: "buttons/vault.webp" },
  { id: "randomizers", name: "Randomizers", art: "buttons/randomizers.webp" },
  { id: "reminders", name: "Rosie’s Reminders", art: null },
  { id: "timekeeper", name: "Rosie’s Timekeeper", art: null }
];

const art = (filename) => `/rosieverse/${filename}`;

/** RosieVerse art landing. Navigates through the existing app router; no new routing dependency. */
export default function RosieHome({ onNavigate }) {
  return (
    <main className={styles.home} aria-label="RosieVerse - explore Rosie's worlds">
      <RosieVerseAtmosphere />

      <header className={styles.banner}>
        <h1 className={styles.screenReaderOnly}>RosieVerse</h1>
        <img src={art("title.webp")} alt="RosieVerse - Play, Explore, Discover - A Brighter Day with Rosie" fetchPriority="high" draggable="false" />
      </header>

      <section className={styles.hero} aria-label="Rosie standing in a Japanese sunset landscape">
        <img src={art("hero.webp")}
          alt="Rosie proudly overlooking cherry blossoms, a golden Japanese bay, lanterns, bridges and Mount Fuji"
          fetchPriority="high" draggable="false" />
        <div className={styles.waterGlow} aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />
      </section>

      <nav className={styles.worldGrid} aria-label="RosieVerse destinations">
        {worlds.map((world, index) => (
          <button
            type="button"
            key={world.id}
            aria-label={`Open ${world.name}`}
            className={`${styles.world} ${index < 2 ? styles.featured : styles.secondary} ${world.id === "reminders" ? styles.remindersWorld : ""} ${world.id === "timekeeper" ? styles.timekeeperWorld : ""}`}
            style={{
              "--glint-delay": `${-index * 1.7}s`,
              "--frame-mask": world.art ? `url("${art(world.art)}")` : "none"
            }}
            onClick={() => onNavigate(world.id)}
          >
            {world.art ? <img src={art(world.art)} alt="" draggable="false" loading="eager" /> : world.id === "timekeeper" ? <span className={styles.timekeeperButtonArt} aria-hidden="true"><span className={styles.timekeeperEmblem}>◷</span><span>ROSIE’S</span><b>TIMEKEEPER</b><small>MASTER OF THE HOURS</small></span> : <span className={styles.remindersButtonArt} aria-hidden="true"><span className={styles.remindersCrest}>♛</span><span>ROSIE’S</span><b>REMINDERS</b><small>PERSONAL ORGANIZER</small></span>}
            <span className={styles.activeSheen} aria-hidden="true" />
          </button>
        ))}
      </nav>
    </main>
  );
}
