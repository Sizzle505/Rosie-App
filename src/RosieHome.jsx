import React from "react";
import styles from "./RosieHome.module.css";
import RosieVerseAtmosphere from "./RosieVerseAtmosphere";

const worlds = [
  { id: "fortune", name: "Fortune Teller", art: "buttons/fortune.webp" },
  { id: "cheese", name: "Cheese Board Exam", art: "buttons/cheese.webp" },
  { id: "captain", name: "Captain Rosie", art: "buttons/captain.webp" },
  { id: "vault", name: "Card Vault", art: "buttons/vault.webp" },
  { id: "randomizers", name: "Randomizers", art: "buttons/randomizers.webp" },
  { id: "resources", name: "Rosie’s Resources", art: "buttons/resources.png" }
];

const art = (filename) => `/rosieverse/${filename}`;

/** RosieVerse art landing. Navigates through the existing app router; no new routing dependency. */
export default function RosieHome({ onNavigate }) {
  const [failedArt, setFailedArt] = React.useState({});
  return (
    <main className={styles.home} aria-label="RosieVerse - discover Rosie's worlds">
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
            className={`${styles.world} ${index < 2 ? styles.featured : styles.secondary} ${world.id === "resources" ? styles.resourcesWorld : ""}`}
            style={{
              "--glint-delay": `${-index * 1.7}s`,
              "--frame-mask": world.art ? `url("${art(world.art)}")` : "none"
            }}
            onClick={() => onNavigate(world.id)}
          >
            {world.art && !failedArt[world.id]
              ? <img src={art(world.art)} alt="" draggable="false" loading="eager"
                  onError={() => setFailedArt(previous => ({...previous, [world.id]: true}))} />
              : <span className={styles.resourcesFallback} aria-hidden="true">
                  <span className={styles.resourceSymbols}>◷ <span>✎</span> ∑</span>
                  <strong>Rosie’s Resources</strong>
                </span>}
            <span className={styles.activeSheen} aria-hidden="true" />
          </button>
        ))}
      </nav>
    </main>
  );
}
