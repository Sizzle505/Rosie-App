import React, { useEffect, useRef } from "react";

export default function CaptainPauseMenu({ theme, game, title, onPlay, onRetry, onLevels }) {
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    panel.current?.querySelector('button')?.focus({ preventScroll: true });
    return () => { if (previous?.isConnected) previous.focus?.({ preventScroll: true }); };
  }, []);
  const cycleFocus = event => {
    if (event.key !== 'Tab') return;
    const buttons = [...panel.current.querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    if (event.shiftKey && index === 0) { event.preventDefault(); buttons.at(-1).focus(); }
    else if (!event.shiftKey && index === buttons.length - 1) { event.preventDefault(); buttons[0].focus(); }
  };
  return <section ref={panel} className={`captain-pause-menu pause-theme-${theme}`} role="dialog"
    aria-modal="true" aria-label={`${game} pause menu`} onKeyDown={cycleFocus}>
    <img className="pause-menu-art" src={`/captain-pause/${theme}-pause.webp`} alt="" draggable="false" />
    <div className="pause-menu-content">
      <span className="pause-game-name">{game}</span>
      <h2>{title}</h2>
      <div className="pause-menu-actions" role="group" aria-label="Paused game options">
        <button type="button" className="pause-menu-action pause-action-play" onClick={onPlay}>PLAY</button>
        <button type="button" className="pause-menu-action" onClick={onRetry}>RETRY</button>
        <button type="button" className="pause-menu-action" onClick={onLevels}>LEVEL SELECT</button>
      </div>
    </div>
  </section>;
}
