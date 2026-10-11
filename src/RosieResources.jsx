import React from "react";
import "./RosieResources.css";

// These are the actual page assets, not generated thumbnail substitutes.
const resources = [
  {
    id: "reminders",
    title: "Rosie’s Reminders",
    artwork: "/rosieverse/reminders/hero-mobile.webp"
  },
  {
    id: "calculations",
    title: "Rosie’s Calculations",
    artwork: "/rosieverse/calculations/hero/hero-full-resolution.webp"
  },
  {
    id: "timekeeper",
    title: "Rosie’s Timekeeper",
    artwork: "/rosieverse/timekeeper/grand-clockwork-hall.jpg"
  }
];

/** Three equal art panels; all touch targets navigate to the existing pages. */
export default function RosieResources({ onNavigate }) {
  return (
    <main className="rr-hub-page" aria-label="Rosie’s Resources">
      <nav className="rr-hub-thirds" aria-label="Choose a Rosie resource">
        {resources.map(({ id, title, artwork }) => (
          <button
            key={id}
            className={`rr-hub-panel rr-hub-panel--${id}`}
            type="button"
            aria-label={`Open ${title}`}
            onClick={() => onNavigate(id)}
          >
            <img src={artwork} alt="" draggable="false" loading="eager" />
            <span className="rr-hub-chevron" aria-hidden="true">›</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
