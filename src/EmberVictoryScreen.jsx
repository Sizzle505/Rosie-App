import React from "react";
import { expeditionStarCount } from "./emberExpeditionStages.js";
import {
  EMBER_VICTORY_WORLDS, EMBER_VICTORY_DRILL, EMBER_VICTORY_MARKERS,
  victoryMarkerPosition, victoryReport
} from "./emberVictoryPresentation.js";
import "./ember-victory-screen.css";

/**
 * Victory overlay for completed five-world Expedition runs.
 *
 * All artwork is an existing file used by the real game. No UI text,
 * stars, statistics or buttons are baked into illustrations.
 * This component is intentionally not used for failed runs or Classic mode.
 */
export default function EmberVictoryScreen({
  stageIndex, hud, onNext, onReplay, onLevels, review = false
}) {
  const world = EMBER_VICTORY_WORLDS[stageIndex];
  if (!world || hud?.result !== "complete") return null;

  const result = victoryReport(hud);
  const stars = expeditionStarCount(hud);
  const isFinal = stageIndex === EMBER_VICTORY_WORLDS.length - 1;
  const next = EMBER_VICTORY_WORLDS[stageIndex + 1];
  const items = [
    ["POINTS", result.score.toLocaleString()],
    ["EXCAVATED", result.distance.toLocaleString() + "m"],
    ["GEMS", result.gems.toLocaleString()],
    ["TURBOS", result.boosts.toLocaleString()],
    ["CHAMBERS", result.secrets.toLocaleString()],
    ["ROCKS SHATTERED", result.rocks.toLocaleString()]
  ];

  return (
    <section
      className={"ember-victory ember-victory--" + world.id}
      aria-label={world.name + " completed - Captain's excavation report"}
      style={{ "--ember-victory-accent": world.accent }}
    >
      <div
        className="ember-victory-scenery"
        aria-hidden="true"
        style={{
          backgroundImage: "url(" + world.backdrop + ")",
          backgroundPosition: world.backdropPosition
        }}
      />
      <div className="ember-victory-top">
        <div className="ember-victory-titles">
          <span className="ember-victory-kicker">
            {review ? "DESIGN REVIEW · SAMPLE RUN VALUES" : "CAPTAIN'S EXCAVATION REPORT"}
          </span>
          <h3>{world.name}</h3>
          <strong>PASSAGE CLEARED</strong>
        </div>
        <div
          className="ember-victory-world-mark"
          role="img"
          aria-label={world.name + " world emblem"}
          style={{
            backgroundImage: "url(" + EMBER_VICTORY_MARKERS + ")",
            ...victoryMarkerPosition(stageIndex)
          }}
        />
      </div>
      <div className="ember-victory-hero" aria-hidden="true">
        <img src={EMBER_VICTORY_DRILL} alt="" draggable="false" />
        <div className="ember-victory-hero-glow" />
      </div>
      <div className="ember-victory-bottom">
        <div className="ember-victory-medals">
          <div className="ember-victory-stars" role="img" aria-label={stars + " of 3 earned stars"}>
            {[0, 1, 2].map(index => (
              <span key={index} className={index < stars ? "earned" : "unearned"} aria-hidden="true">★</span>
            ))}
          </div>
          <p>{stageIndex >= 2 ? "BOSS DEFEATED" : "PASSAGE FINISHED"}
            <span aria-hidden="true"> · </span>
            {result.damage <= 1 ? "HULL BONUS" : "HULL BONUS MISSED"}
            <span aria-hidden="true"> · </span>
            {result.objectiveComplete ? "MISSION COMPLETE" : "MISSION MISSED"}
          </p>
        </div>

        <div className="ember-victory-report">
          <div className="ember-victory-report-heading">
            <span>EXPEDITION RESULTS</span>
            <span>WORLD {stageIndex + 1} / {EMBER_VICTORY_WORLDS.length}</span>
          </div>
          <dl className="ember-victory-data">
            {items.map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
          <p className="ember-victory-outcome">
            {world.bossName
              ? world.bossName + ": " + (result.bossDefeated ? "DEFEATED" : "NOT DEFEATED")
              : "WORLD OBJECTIVE: " + (result.objectiveComplete ? "COMPLETE" : "MISSED")}
          </p>
          <div className="ember-victory-actions">
            <button type="button" className="ember-victory-action-primary"
              onClick={isFinal ? onLevels : onNext}>
              {isFinal ? "EXPEDITION MAP" : "NEXT: " + next.name.toUpperCase()}
            </button>
            <div className="ember-victory-action-secondary">
              <button type="button" onClick={onReplay}>REPLAY LEVEL</button>
              {!isFinal && <button type="button" onClick={onLevels}>LEVEL MENU</button>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
