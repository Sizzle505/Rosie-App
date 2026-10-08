import React, { useEffect, useMemo, useRef, useState } from 'react';
import rosieCards from './rosieCards.js';
import styles from './RosieCardVault.module.css';
import revealStyles from './RosieCardVaultReveal.module.css';

function parsePosition(value, fallbackX) {
  const match = String(value || '').trim().match(/^(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%$/);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: fallbackX, y: 50 };
}

function TitleGleamAnimator({
  selector,
  duration = 5200,
  delay = 0,
  hold = 0.08,
  travelEnd = 0.78,
  startPosition = '155% 50%',
  endPosition = '-55% 50%'
}) {
  useEffect(() => {
    if (!selector || typeof document === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const start = parsePosition(startPosition, 155);
    const end = parsePosition(endPosition, -55);
    const nodes = new Set();
    const timelineStart = performance.now() + delay;
    let frame = 0;
    let watchdog = 0;
    let lastAnimationFrameAt = 0;

    const register = node => {
      if (!(node instanceof HTMLElement) || nodes.has(node)) return;
      node.style.setProperty('animation', 'none', 'important');
      node.style.setProperty('background-position', `${start.x}% ${start.y}%`, 'important');
      node.dataset.gleamMotion = 'hybrid-clock';
      nodes.add(node);
    };

    const scan = root => {
      if (root instanceof Element && root.matches?.(selector)) register(root);
      root?.querySelectorAll?.(selector).forEach(register);
    };

    const update = now => {
      for (const node of [...nodes]) {
        if (!node.isConnected) {
          nodes.delete(node);
          continue;
        }
        if (now < timelineStart) {
          node.style.setProperty('background-position', `${start.x}% ${start.y}%`, 'important');
          continue;
        }
        const phase = ((now - timelineStart) % duration) / duration;
        let progress = 0;
        if (phase <= hold) progress = 0;
        else if (phase >= travelEnd) progress = 1;
        else progress = (phase - hold) / Math.max(0.0001, travelEnd - hold);

        const x = start.x + (end.x - start.x) * progress;
        const y = start.y + (end.y - start.y) * progress;
        node.style.setProperty('background-position', `${x.toFixed(3)}% ${y.toFixed(3)}%`, 'important');
      }
    };

    const tick = now => {
      lastAnimationFrameAt = now;
      update(now);
      frame = requestAnimationFrame(tick);
    };

    scan(document);
    const observer = new MutationObserver(records => {
      for (const record of records) for (const added of record.addedNodes) scan(added);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    update(performance.now());
    frame = requestAnimationFrame(tick);
    watchdog = window.setInterval(() => {
      const now = performance.now();
      if (!lastAnimationFrameAt || now - lastAnimationFrameAt > 80) update(now);
    }, 50);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearInterval(watchdog);
      for (const node of nodes) {
        if (!node.isConnected) continue;
        node.style.removeProperty('background-position');
        node.style.removeProperty('animation');
        delete node.dataset.gleamMotion;
      }
      nodes.clear();
    };
  }, [selector, duration, delay, hold, travelEnd, startPosition, endPosition]);

  return null;
}


const CYCLE_MS = 40000;
const INITIAL_DELAY_MS = 1000;
const TRAVEL_MS = 1600;
const FADE_END_MS = 1900;
const FRAME_STALE_MS = 80;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function VaultTitleLaserAnimator() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timelineStart = performance.now() + INITIAL_DELAY_MS;
    let title = null;
    let beam = null;
    let etch = null;
    let frame = 0;
    let watchdog = 0;
    let lastAnimationFrameAt = 0;

    const attach = () => {
      if (title?.isConnected && beam?.isConnected && etch?.isConnected) return true;
      const nextTitle = document.querySelector('h1[data-vault-title]');
      const nextBeam = nextTitle?.querySelector('[data-vault-layer="beam"]');
      const nextEtch = nextTitle?.querySelector('[data-vault-layer="etch"]');
      if (!(nextTitle instanceof HTMLElement) || !(nextBeam instanceof HTMLElement) || !(nextEtch instanceof HTMLElement)) return false;
      title = nextTitle;
      beam = nextBeam;
      etch = nextEtch;
      beam.style.setProperty('animation', 'none', 'important');
      etch.style.setProperty('animation', 'none', 'important');
      title.dataset.laserMotion = 'hybrid-clock';
      return true;
    };

    const render = now => {
      if (!attach()) return;
      if (now < timelineStart) {
        beam.style.setProperty('left', '-7%', 'important');
        beam.style.setProperty('opacity', '0', 'important');
        etch.style.setProperty('clip-path', 'inset(0 100% 0 0)', 'important');
        etch.style.setProperty('opacity', '0', 'important');
        return;
      }

      const phase = (now - timelineStart) % CYCLE_MS;
      if (phase >= FADE_END_MS) {
        beam.style.setProperty('left', '109%', 'important');
        beam.style.setProperty('opacity', '0', 'important');
        etch.style.setProperty('clip-path', 'inset(0 0 0 0)', 'important');
        etch.style.setProperty('opacity', '0', 'important');
        return;
      }

      const travel = clamp(phase / TRAVEL_MS);
      const fadeIn = clamp(phase / 90);
      const fadeOut = phase <= TRAVEL_MS ? 1 : clamp(1 - ((phase - TRAVEL_MS) / (FADE_END_MS - TRAVEL_MS)));
      const opacity = Math.min(fadeIn, fadeOut);
      const beamLeft = -7 + (116 * travel);
      const clipRight = 100 * (1 - travel);

      beam.style.setProperty('left', `${beamLeft.toFixed(3)}%`, 'important');
      beam.style.setProperty('opacity', opacity.toFixed(3), 'important');
      etch.style.setProperty('clip-path', `inset(0 ${clipRight.toFixed(3)}% 0 0)`, 'important');
      etch.style.setProperty('opacity', opacity.toFixed(3), 'important');
    };

    const tick = now => {
      lastAnimationFrameAt = now;
      render(now);
      frame = requestAnimationFrame(tick);
    };

    const observer = new MutationObserver(() => {
      if (attach()) render(performance.now());
    });
    observer.observe(document.body, { childList: true, subtree: true });

    render(performance.now());
    frame = requestAnimationFrame(tick);
    watchdog = window.setInterval(() => {
      const now = performance.now();
      if (!lastAnimationFrameAt || now - lastAnimationFrameAt > FRAME_STALE_MS) render(now);
    }, 50);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearInterval(watchdog);
      if (beam) {
        beam.style.removeProperty('animation');
        beam.style.removeProperty('opacity');
        beam.style.removeProperty('left');
      }
      if (etch) {
        etch.style.removeProperty('animation');
        etch.style.removeProperty('opacity');
        etch.style.removeProperty('clip-path');
      }
      if (title) delete title.dataset.laserMotion;
    };
  }, []);

  return null;
}



const BASE_DRIFT_PX_PER_SECOND = 26;
const INITIAL_DRIFT_DELAY_MS = 2200;
const MANUAL_PAUSE_MS = 3400;
const DESELECT_RESUME_DELAY_MS = 400;
const DEFAULT_DRIFT_SPEED = 0.75;
const MOBILE_DRIFT_SPEED = DEFAULT_DRIFT_SPEED * 2.55;
const DRAG_ACTIVATION_PX = 8;

function defaultDriftSpeedForViewport() {
  if (typeof window === 'undefined') return DEFAULT_DRIFT_SPEED;
  return window.matchMedia('(max-width: 720px)').matches ? MOBILE_DRIFT_SPEED : DEFAULT_DRIFT_SPEED;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeBatch(pool, batch, previousName = '') {
  const cards = shuffle(pool);
  if (previousName && cards.length > 1 && cards[0]?.name === previousName) {
    const swapIndex = cards.findIndex(card => card.name !== previousName);
    if (swapIndex > 0) [cards[0], cards[swapIndex]] = [cards[swapIndex], cards[0]];
  }
  return cards.map((card, index) => ({ ...card, wall_id: `${batch}:${index}:${card.id}` }));
}

function defaultCardsPerRow() {
  if (typeof window === 'undefined') return 4;
  if (window.matchMedia('(max-width: 720px)').matches) return 2;
  // Match the wall's previous 310px minimum card width on first visit.
  return Math.max(2, Math.min(10, Math.floor((window.innerWidth - 12 + 4) / 314)));
}

function CardImage({ card, eager = false, enlarged = false }) {
  return <img
    src={card.image}
    alt={card.alt || `${card.name} collectible card`}
    loading={eager ? 'eager' : 'lazy'}
    decoding="async"
    draggable={false}
    className={enlarged ? styles.enlargedImage : styles.cardImage}
  />;
}

function RosieCardVaultWall() {
  const pool = useMemo(() => rosieCards.filter(card => card?.id && card?.image), []);
  const nextBatch = useRef(2);
  const sentinel = useRef(null);
  const dragging = useRef(false);
  const dragPointerId = useRef(null);
  const dragStartY = useRef(0);
  const dragStartScroll = useRef(0);
  const draggedDistance = useRef(0);
  const suppressNextClick = useRef(false);
  const pauseUntil = useRef(0);
  const revealCardRef = useRef(null);
  const revealHaloRef = useRef(null);
  const glintRef = useRef(null);
  const lastGlintCorner = useRef(-1);
  const [selectedCard, setSelectedCard] = useState(null);
  const [speed, setSpeed] = useState(defaultDriftSpeedForViewport);
  const [isBraked, setIsBraked] = useState(false);
  const [mobileZoom, setMobileZoom] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches);
  const [cardsPerRow, setCardsPerRow] = useState(defaultCardsPerRow);
  const zoomMin = mobileZoom ? 1 : 2;
  const zoomMax = mobileZoom ? 4 : 10;
  const [cards, setCards] = useState(() => {
    const first = makeBatch(pool, 0);
    const second = makeBatch(pool, 1, first.at(-1)?.name);
    return [...first, ...second];
  });

  const pauseDrift = (duration = MANUAL_PAUSE_MS) => {
    pauseUntil.current = performance.now() + duration;
  };

  useEffect(() => {
    pauseUntil.current = performance.now() + INITIAL_DRIFT_DELAY_MS;
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 720px)');
    const updateLayout = event => {
      setMobileZoom(event.matches);
      setCardsPerRow(defaultCardsPerRow());
    };
    query.addEventListener('change', updateLayout);
    return () => query.removeEventListener('change', updateLayout);
  }, []);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !pool.length) return undefined;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      setCards(current => {
        const batch = nextBatch.current++;
        return [...current, ...makeBatch(pool, batch, current.at(-1)?.name)];
      });
    }, { rootMargin: '1800px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [pool]);

  useEffect(() => {
    if (!speed || isBraked || selectedCard) return undefined;
    let frame = 0;
    let last = performance.now();
    let residualPixels = 0;

    const drift = now => {
      const elapsed = Math.min(now - last, 80) / 1000;
      last = now;
      if (!dragging.current && now >= pauseUntil.current && document.visibilityState === 'visible') {
        residualPixels += BASE_DRIFT_PX_PER_SECOND * speed * elapsed;
        const wholePixels = residualPixels > 0 ? Math.floor(residualPixels) : Math.ceil(residualPixels);
        if (wholePixels) {
          window.scrollBy(0, wholePixels);
          residualPixels -= wholePixels;
        }
      }
      frame = requestAnimationFrame(drift);
    };

    frame = requestAnimationFrame(drift);
    return () => cancelAnimationFrame(frame);
  }, [speed, isBraked, selectedCard]);

  useEffect(() => {
    if (!selectedCard) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = event => {
      if (event.key === 'Escape') setSelectedCard(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      pauseDrift(DESELECT_RESUME_DELAY_MS);
    };
  }, [selectedCard]);

  useEffect(() => {
    if (!selectedCard) return undefined;
    let animations = [];
    const frame = requestAnimationFrame(() => {
      const card = revealCardRef.current;
      const halo = revealHaloRef.current;
      if (card?.animate) animations.push(card.animate([
        { transform: 'scale(.90) translateY(18px)', borderColor: 'rgba(236,240,244,.28)', boxShadow: '0 34px 90px rgba(0,0,0,.78),0 0 24px rgba(207,216,226,.06)' },
        { offset: .58, transform: 'scale(1.026) translateY(-3px)', borderColor: 'rgba(255,255,255,.98)', boxShadow: '0 34px 90px rgba(0,0,0,.78),0 0 88px rgba(220,232,245,.38)' },
        { transform: 'scale(1) translateY(0)', borderColor: 'rgba(236,240,244,.36)', boxShadow: '0 34px 90px rgba(0,0,0,.78),0 0 42px rgba(207,216,226,.10)' }
      ], { duration: 760, easing: 'cubic-bezier(.14,.86,.24,1)', fill: 'both' }));
      if (halo?.animate) animations.push(halo.animate([
        { opacity: .08, transform: 'translate(-50%,-50%) scale(.72)', filter: 'blur(18px)' },
        { offset: .48, opacity: 1, transform: 'translate(-50%,-50%) scale(1.20)', filter: 'blur(6px)' },
        { opacity: .82, transform: 'translate(-50%,-50%) scale(1)', filter: 'blur(8px)' }
      ], { duration: 1050, delay: 60, easing: 'cubic-bezier(.16,.72,.28,1)', fill: 'both' }));
    });
    return () => {
      cancelAnimationFrame(frame);
      animations.forEach(animation => animation.cancel());
    };
  }, [selectedCard]);

  useEffect(() => {
    if (!selectedCard) return undefined;
    let frame = 0;
    const paths = [
      { name: 'tl', start: [-95, -95], end: [195, 195], angle: '135deg' },
      { name: 'tr', start: [195, -95], end: [-95, 195], angle: '45deg' },
      { name: 'br', start: [195, 195], end: [-95, -95], angle: '135deg' },
      { name: 'bl', start: [-95, 195], end: [195, -95], angle: '45deg' }
    ];
    const choices = paths.map((_, index) => index).filter(index => index !== lastGlintCorner.current);
    const pathIndex = choices[Math.floor(Math.random() * choices.length)] ?? 0;
    const path = paths[pathIndex];
    lastGlintCorner.current = pathIndex;
    const startAt = performance.now() + 260;
    const duration = 3500;

    const setReflectionPosition = (glint, x, y) => {
      glint.style.setProperty('--glint-x', `${x.toFixed(2)}%`);
      glint.style.setProperty('--glint-y', `${y.toFixed(2)}%`);
      glint.style.setProperty('--glint-angle', path.angle);
    };

    const sweep = now => {
      const glint = glintRef.current;
      if (!glint) {
        frame = requestAnimationFrame(sweep);
        return;
      }
      glint.dataset.glintStart = path.name;
      if (now < startAt) {
        setReflectionPosition(glint, path.start[0], path.start[1]);
        glint.style.opacity = '0';
        frame = requestAnimationFrame(sweep);
        return;
      }
      const progress = Math.min(1, (now - startAt) / duration);
      const eased = progress < .5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const x = path.start[0] + (path.end[0] - path.start[0]) * eased;
      const y = path.start[1] + (path.end[1] - path.start[1]) * eased;
      const envelope = Math.sin(Math.PI * progress);
      const opacity = Math.pow(Math.max(0, envelope), .78) * .58;
      setReflectionPosition(glint, x, y);
      glint.style.opacity = `${Math.min(.58, opacity)}`;
      if (progress < 1) frame = requestAnimationFrame(sweep);
      else glint.style.opacity = '0';
    };

    frame = requestAnimationFrame(sweep);
    return () => cancelAnimationFrame(frame);
  }, [selectedCard]);

  const handlePointerDown = event => {
    pauseDrift();
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    dragPointerId.current = event.pointerId;
    dragging.current = false;
    draggedDistance.current = 0;
    suppressNextClick.current = false;
    dragStartY.current = event.clientY;
    dragStartScroll.current = window.scrollY;
  };

  const handlePointerMove = event => {
    if (dragPointerId.current !== event.pointerId) return;
    const delta = dragStartY.current - event.clientY;
    draggedDistance.current = Math.max(draggedDistance.current, Math.abs(delta));
    if (!dragging.current) {
      if (draggedDistance.current <= DRAG_ACTIVATION_PX) return;
      dragging.current = true;
      suppressNextClick.current = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    window.scrollTo(0, Math.max(0, dragStartScroll.current + delta));
    event.preventDefault();
  };

  const endDrag = event => {
    if (dragPointerId.current !== event.pointerId) return;
    if (dragging.current) event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragging.current = false;
    dragPointerId.current = null;
    pauseDrift();
  };

  const openCard = card => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    setSelectedCard(card);
  };

  const handleSelectedPointerMove = event => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty('--shine-x', `${Math.max(0, Math.min(100, x))}%`);
    event.currentTarget.style.setProperty('--shine-y', `${Math.max(0, Math.min(100, y))}%`);
  };

  const resetSelectedPointer = event => {
    event.currentTarget.style.setProperty('--shine-x', '50%');
    event.currentTarget.style.setProperty('--shine-y', '38%');
  };

  const toggleBrake = event => {
    event.stopPropagation();
    if (isBraked) {
      if (!speed) setSpeed(defaultDriftSpeedForViewport());
      setIsBraked(false);
      pauseUntil.current = performance.now();
    } else {
      setIsBraked(true);
    }
  };

  const speedLabel = speed === 0 ? '0' : `${speed > 0 ? '↓' : '↑'} ${Math.abs(speed).toFixed(Math.abs(speed) % 1 ? 2 : 0)}×`;

  if (!pool.length) return <main className={styles.page}><div className={styles.empty}>Add Rosie cards to <code>data/rosieCards.js</code>.</div></main>;

  return <main className={styles.page} onPointerDown={() => pauseDrift()} onWheel={() => pauseDrift()} onTouchStart={() => pauseDrift()} onTouchEnd={() => pauseDrift()}>
    <aside className={`${styles.driftControl} ${isBraked ? styles.driftControlBraked : ''}`} aria-label="Ambient card drift speed and direction">
      <button type="button" className={`${styles.brakeButton} ${isBraked ? styles.brakeButtonActive : ''}`} aria-label={isBraked ? 'Resume ambient card drift' : 'Pause ambient card drift'} aria-pressed={isBraked} title={isBraked ? 'Release brake' : 'Brake drift'} onPointerDown={event => event.stopPropagation()} onClick={toggleBrake}><span aria-hidden="true">{isBraked ? '▶' : 'Ⅱ'}</span></button>
      <span className={styles.speedReadout}>{speedLabel}</span>
      <div className={styles.rangeShell}>
        <input className={styles.speedRange} type="range" min="-2.5" max="2.5" step="0.025" value={speed} aria-label="Card drift speed and direction; center is zero" onChange={event => setSpeed(Number(event.target.value))} onPointerDown={event => event.stopPropagation()}/>
      </div>
    </aside>

    <header className={styles.header}>
      <div className={styles.headerRule} aria-hidden="true"/>
      <div className={styles.headerMark}>
        <div className={styles.eyebrow}>THE HOUSE OF ROSIE · PRIVATE COLLECTION</div>
        <div className={styles.titleLine}>
          <svg className={styles.pawTitleIcon} viewBox="0 0 64 64" aria-hidden="true">
            <ellipse cx="32" cy="40" rx="15" ry="12"/>
            <ellipse cx="15" cy="25" rx="7" ry="9" transform="rotate(-24 15 25)"/>
            <ellipse cx="27" cy="18" rx="7" ry="9" transform="rotate(-8 27 18)"/>
            <ellipse cx="39" cy="18" rx="7" ry="9" transform="rotate(8 39 18)"/>
            <ellipse cx="51" cy="25" rx="7" ry="9" transform="rotate(24 51 25)"/>
          </svg>
          <h1 data-vault-title>
            <span data-vault-layer="base">Card Vault</span>
            <span data-vault-layer="gleam" aria-hidden="true">Card Vault</span>
          </h1>
        </div>
        <div className={styles.headerMeta}><span>CURATED ARCHIVE</span><i/><span>ONE OF ONE</span><i/><span>EST. 2016</span></div>
      </div>
      <div className={styles.headerRule} aria-hidden="true"/>
    </header>

    <section className={styles.galleryShell} aria-label="Rosie archive display">
      <div className={styles.archiveToolbar}>
        <div className={styles.archiveIntro}>
          <span>THE COMPLETE COLLECTION</span>
          <small>Select any card for the archival presentation</small>
        </div>
        <div className={styles.zoomRow}>
          <label className={styles.zoomControl}>
            <span className={styles.zoomCaption}>ZOOM</span>
            <span className={styles.zoomSign} aria-hidden="true">−</span>
            <input
              className={styles.zoomRange}
              type="range"
              min="0"
              max={zoomMax - zoomMin}
              step="1"
              value={zoomMax - cardsPerRow}
              onChange={event => {
                setCardsPerRow(zoomMax - Number(event.target.value));
                pauseDrift();
              }}
              onPointerDown={event => { event.stopPropagation(); pauseDrift(); }}
              aria-label="Card Vault zoom"
              aria-valuetext={`${cardsPerRow} cards per row`}
              title={`${cardsPerRow} cards per row`}
            />
            <span className={styles.zoomSign} aria-hidden="true">+</span>
            <output className={styles.zoomCount} aria-live="polite">{cardsPerRow}/row</output>
          </label>
        </div>
      </div>

      <section className={styles.wall} style={{ '--vault-columns': cardsPerRow }} aria-label="Randomized Rosie card wall" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        {cards.map((card, index) => <button type="button" className={styles.tile} key={card.wall_id} aria-label={`Open ${card.name} card`} onClick={() => openCard(card)}><CardImage card={card} eager={index < 24}/></button>)}
      </section>
    </section>
    <div ref={sentinel} className={styles.sentinel} aria-hidden="true"/>

    {selectedCard && <div className={styles.lightbox} role="presentation" onClick={() => setSelectedCard(null)}>
      <div className={styles.selectionStage} role="dialog" aria-modal="true" aria-label={`${selectedCard.name} card detail`} onClick={event => event.stopPropagation()}>
        <button type="button" className={styles.closeButton} aria-label="Close card detail" onClick={() => setSelectedCard(null)}>×</button>
        <div ref={revealHaloRef} className={`${styles.selectionHalo} ${revealStyles.revealHalo}`} aria-hidden="true"/>
        <div ref={revealCardRef} className={`${styles.expandedCard} ${revealStyles.revealCard}`} onClick={() => setSelectedCard(null)} onPointerMove={handleSelectedPointerMove} onPointerLeave={resetSelectedPointer}>
          <CardImage card={selectedCard} eager enlarged/>
          <div className={revealStyles.selectionSheen} aria-hidden="true"/>
          <div ref={glintRef} className={revealStyles.selectionGlint} aria-hidden="true"/>
        </div>
        <div className={styles.cardCaption}><span className={styles.captionKicker}>ROSIE ARCHIVE</span><strong>{selectedCard.name}</strong>{selectedCard.set && <span className={styles.captionSet}>{selectedCard.set}</span>}</div>
        <div className={styles.selectionHint}>tap card, click outside, or press esc to return</div>
      </div>
    </div>}
  </main>;
}


export default function RosieCardVault() {
  return <>
    <TitleGleamAnimator
      selector={'h1[data-vault-title] [data-vault-layer="gleam"]'}
      duration={4400}
      delay={2800}
      hold={0.05}
      travelEnd={0.80}
      startPosition="155% 50%"
      endPosition="-55% 50%"
    />
    <RosieCardVaultWall />
  </>;
}
