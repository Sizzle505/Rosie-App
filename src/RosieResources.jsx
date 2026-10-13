import React from "react";
import "./RosieResources.css";

const ASSETS = "/rosieverse/resources/";

const destinations = [
  { id: "reminders", title: "Rosie’s Reminders", image: "reminders.webp" },
  { id: "timekeeper", title: "Rosie’s Timekeeper", image: "timekeeper.webp" },
  { id: "calculations", title: "Rosie’s Calculations", image: "calculations.webp" },
  { id: "recipes", title: "Rosie’s Recipes", image: null },
];

/**
 * A single illustrated observatory behind three individually interactive buttons.
 * The page artwork is decorative; click targets use the existing app router.
 */
export default function RosieResources({ onNavigate }) {
  return (
    <main className="rr-hub-page" aria-label="Rosie’s Resources">
      <div className="rr-hub-content">
        <header className="rr-hub-header">
          <h1 className="rr-visually-hidden">Rosie’s Resources</h1>
          <img
            className="rr-hub-crest"
            src={`${ASSETS}crest.webp`}
            alt=""
            fetchPriority="high"
            draggable="false"
          />
        </header>

        <nav className="rr-hub-buttons" aria-label="Choose a Rosie resource">
          {destinations.map(({ id, title, image }) => (
            <button
              key={id}
              type="button"
              className={`rr-hub-button rr-hub-button--${id}`}
              aria-label={`Open ${title}`}
              onClick={() => onNavigate(id)}
            >
              {image ? <img
                src={`${ASSETS}${image}`}
                alt=""
                draggable="false"
                loading="eager"
              /> : <span className="rr-recipes-button-art" aria-hidden="true">
                <span className="rr-recipes-ornament">✦</span>
                <span className="rr-recipes-name">Rosie’s Recipes</span>
                <small>THE ROYAL COOKBOOK</small>
              </span>}
              <span className="rr-visually-hidden">{title}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
