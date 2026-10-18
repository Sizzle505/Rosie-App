import React from "react";
import "./RosieResources.css";
import qrAtelierAsset from "./assets/resources/qr-atelier-transparent.webp";
import calculationsAsset from "./assets/resources/calculations-turquoise-transparent.webp";
import reviewsAsset from "./assets/resources/reviews-crimson-transparent.webp";

const ASSETS = "/rosieverse/resources/";

const destinations = [
  { id: "reminders", title: "Rosie’s Reminders", image: `${ASSETS}reminders.webp` },
  { id: "qr-atelier", title: "Rosie’s QR Atelier", image: qrAtelierAsset },
  { id: "calculations", title: "Rosie’s Calculations", image: calculationsAsset },
  { id: "recipes", title: "Rosie’s Recipes", image: `${ASSETS}recipes.png` },
  { id: "reviews", title: "Rosie’s Reviews", image: reviewsAsset },
  { id: "timekeeper", title: "Rosie’s Timekeeper", image: `${ASSETS}timekeeper.webp` },
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
              <img
                src={image}
                alt=""
                draggable="false"
                loading="eager"
              />
              <span className="rr-visually-hidden">{title}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}