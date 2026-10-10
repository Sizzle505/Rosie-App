import React from "react";
import styles from "./RosieHome.module.css";
import RosieVerseAtmosphere from "./RosieVerseAtmosphere";

const worlds = [
  { id: "fortune", name: "Fortune Teller", art: "fortune.webp" },
  { id: "cheese", name: "Cheese Board Exam", art: "cheese.webp" },
  { id: "captain", name: "Captain Rosie", art: "captain.webp" },
  { id: "vault", name: "Card Vault", art: "vault.webp" },
  { id: "randomizers", name: "Randomizers", art: "randomizers.webp" }
];

const art = (filename) => `/rosieverse/${filename}`;

/** RosieVerse art landing. Navigates through the existing app router; no new routing dependency. */
export default function RosieHome({ onNavigate }) {
  return (
    <main className={styles.home} aria-label="RosieVerse - discover Rosie's five worlds">
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
            className={`${styles.world} ${index < 2 ? styles.featured : styles.secondary}`}
            onClick={() => onNavigate(world.id)}
          >
            <img src={art(world.art)} alt="" draggable="false" loading="eager" />
            <span className={styles.activeSheen} aria-hidden="true" />
          </button>
        ))}
      </nav>
    </main>
  );
}
