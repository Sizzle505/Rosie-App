import React from "react";
import "./RosieResources.css";

const destinations = [
  { id:"reminders", title:"Rosie’s Reminders", description:"Notes, lists, and little things worth remembering", icon:"✎" },
  { id:"timekeeper", title:"Rosie’s Timekeeper", description:"Stopwatch, laps, and countdown timers", icon:"◷" },
  { id:"calculations", title:"Rosie’s Calculations", description:"Calculator and useful everyday pocket tools", icon:"∑" }
];

/** The three existing functional pages remain separate, reachable from one hub. */
export default function RosieResources({onNavigate}) {
  return (
    <main className="rr-page" aria-label="Rosie’s Resources">
      <div className="rr-shell">
        <header className="rr-heading">
          <span className="rr-eyebrow">THE HOUSE OF ROSIE</span>
          <h1>Rosie’s Resources</h1>
          <p>Good things to have close at paw.</p>
        </header>
        <nav className="rr-tools" aria-label="Choose a resource">
          {destinations.map(item => (
            <button key={item.id} type="button" className="rr-destination"
              onClick={() => onNavigate(item.id)}
              aria-label={`Open ${item.title}`}>
              <span className="rr-seal" aria-hidden="true">{item.icon}</span>
              <span className="rr-copy">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <span className="rr-arrow" aria-hidden="true">›</span>
            </button>
          ))}
        </nav>
        <p className="rr-foot">A touch of magic for useful little moments.</p>
      </div>
    </main>
  );
}
