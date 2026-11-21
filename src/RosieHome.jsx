import React from "react";
import styles from "./RosieHome.module.css";
import RosieVerseAtmosphere from "./RosieVerseAtmosphere";
import calculationsButton from "./assets/resources/calculations-turquoise-transparent.webp";
import reviewsButton from "./assets/resources/reviews-crimson-transparent.webp";

const worlds = [
  { id: "fortune", name: "Fortune Teller", art: "buttons/fortune.webp" },
  { id: "cheese", name: "Cheese Board Exam", art: "buttons/cheese.webp" },
  { id: "captain", name: "Captain Rosie", art: "buttons/captain.webp" },
  { id: "vault", name: "Card Vault", art: "buttons/vault.webp" },
  { id: "randomizers", name: "Randomizers", art: "buttons/randomizers.webp" }
];

const art = (filename) => `/rosieverse/${filename}`;
const tools = [
  { id: "reminders", name: "Reminders", image: "/rosieverse/resources/reminders.webp" },
  { id: "qr-atelier", name: "QR Atelier", image: "/rosieverse/refresh/qr-button.webp" },
  { id: "calculations", name: "Calculations", image: calculationsButton },
  { id: "recipes", name: "Recipes", image: "/rosieverse/resources/recipes.png" },
  { id: "reviews", name: "Reviews", image: reviewsButton },
  { id: "timekeeper", name: "Timekeepers", image: "/rosieverse/resources/timekeeper.webp" }
];
/** RosieVerse art landing. Navigates through the existing app router; no new routing dependency. */
export default function RosieHome({ onNavigate }) {
  const [failedArt, setFailedArt] = React.useState({});
  return (
    <main className={styles.home} data-layout-target="home-page" aria-label="RosieVerse - discover Rosie's worlds">
      <RosieVerseAtmosphere />

      <header className={styles.banner} data-layout-target="home-banner">
        <h1 className={styles.screenReaderOnly}>RosieVerse</h1>
        <img src={art("title.webp")} alt="RosieVerse - Play, Explore, Discover - A Brighter Day with Rosie" fetchPriority="high" draggable="false" />
      </header>

      <section className={styles.hero} data-layout-target="home-hero" aria-label="Rosie standing in a Japanese sunset landscape">
        <img src={art("hero.webp")}
          alt="Rosie proudly overlooking cherry blossoms, a golden Japanese bay, lanterns, bridges and Mount Fuji"
          fetchPriority="high" draggable="false" />
        <div className={styles.waterGlow} aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />
        <button type="button" className={styles.haikuLantern} onClick={() => onNavigate("haiku")} aria-label="Enter Haiku Zen Garden" title="Haiku Zen Garden">
          <img className={styles.haikuLanternImage} src="/rosieverse/haiku/new/ui/zen-landing-lantern.webp" alt="" aria-hidden="true" loading="lazy" />
        </button>
      </section>


      <nav className={styles.worldGrid} data-layout-target="home-worlds" aria-label="RosieVerse destinations">
        {worlds.map((world, index) => (
          <button
            type="button"
            key={world.id}
            aria-label={`Open ${world.name}`}
            className={`${styles.world} ${index < 2 ? styles.featured : styles.secondary}`}
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
                  <strong>{world.name}</strong>
                </span>}
            <span className={styles.activeSheen} aria-hidden="true" />
          </button>
        ))}
        <button type="button" className={`${styles.world} ${styles.resourcesWorld}`}
          aria-label="Open Rosie's Resources" onClick={() => onNavigate("resources")}>
          <img src="/rosieverse/buttons/resources.png" alt="" loading="lazy" draggable="false"/>
        </button>
      </nav>
      <nav className={styles.toolDock} aria-label="Rosie's tools">
        {tools.map((tool) => (
          <button key={tool.id} type="button" onClick={() => onNavigate(tool.id)} aria-label={`Open ${tool.name}`}>
            <img src={tool.image} alt="" draggable="false" loading="eager" />
          </button>
        ))}
      </nav>
    </main>
  );
}
