// Small deterministic UI helpers for the Ember dig milestone.
// The messages do not affect physics, and no generated character portraits are used.
import {getBossConfig} from "./emberBossEncounter.js";
export function excavationNotice(event,charge) {
  if(!event)return null;
  if(event.type==="boss-spawn")return {
    kind:"tip",title:event.boss==="mole-king"?"THE MOLE KING AWAKENS":event.boss==="copperjack"?"COPPERJACK ACTIVATED":"CINDERCLAW EMERGES",
    duration:2.0
  };
  if(event.type==="boss-warning")return {
    kind:"tip",title:event.text||"BOSS ATTACK",duration:1.2
  };
  if(event.type==="boss-vulnerable"){
    // Honest charge: the old text always claimed "Turbo is recharged" while
    // the button sat disabled (charge is whatever the route earned, usually
    // well under 100). Show the real percentage until it is actually full.
    const pct=typeof charge==="number"?Math.max(0,Math.floor(charge)):0;
    return {
      kind:"success",title:"BOSS VULNERABLE",
      detail:pct>=100?"TURBO READY":`Turbo ${pct}%`,
      duration:1.0
    };
  }
  // Direct hits and the victory itself need no banner: the guardian's
  // pain flash, health pips, victory hold and report already say it.
  if(event.type==="boss-hit")return null;
  if(event.type==="boss-victory")return null;
  if(event.type==="boss-strike-early")return {
    kind:"tip",quiet:true,title:"TOO EARLY",duration:1.2
  };
  if(event.type==="boss-turbo-charging"){
    // A Turbo press below full charge in a boss fight: the button is
    // disabled, but Space bypasses it, so the press was fully silent.
    // Say the real percentage in the title, not only the detail.
    const pct=typeof charge==="number"?Math.max(0,Math.floor(charge)):0;
    return {
      kind:"tip",quiet:true,title:"TURBO "+pct+"%",duration:1.2
    };
  }
  if(event.type==="boss-struck")return {
    kind:"tip",quiet:true,title:"ALREADY STRUCK",duration:1.2
  };
  if(event.type==="boss-turbo-active")return {
    kind:"tip",quiet:true,title:"TURBO ACTIVE",duration:0.9
  };
  if(event.type==="turbo-charging"){
    // Classic (no boss): a Turbo press below full charge. The TURBO
    // button is always enabled while running (a disabled button swallows
    // the click entirely — the round-4 dead click), so the press must
    // say why instead of doing nothing.
    const pct=typeof charge==="number"?Math.max(0,Math.floor(charge)):0;
    return {
      kind:"tip",quiet:true,title:"TURBO "+pct+"%",duration:1.2
    };
  }
  if(event.type==="turbo-active")return {
    kind:"tip",quiet:true,title:"TURBO ACTIVE",duration:0.9
  };
  const hazardNames={crystal:"CRYSTAL SPIKES",piston:"CLOCKWORK PISTON",geyser:"MOLTEN GEYSER",basalt:"FALLING BASALT",quake:"ROYAL ROCK BURST"};
  if(event.type==="world-hazard-warning")return {
    kind:"tip",placement:event.side<0?"bottom":"top",
    title:(hazardNames[event.kind]||"CAVE HAZARD")+" AHEAD",duration:1.4
  };
  if(event.type==="shutter-warning")return {
    kind:"tip",placement:event.side<0?"bottom":"top",title:"CRYSTAL AHEAD",duration:1.3
  };
  if(event.type==="hard-rock")return {
    kind:"tip",title:"NEEDS TURBO",duration:1.4
  };
  // Bonus outcomes (dodges, shatters, wall breaks, mission and
  // objective completions, the secret chamber) no longer pop a card:
  // the score, Turbo bar and end-of-run report carry them quietly.
  return null;
}

// The boss banner, derived from the LIVE boss phase every frame — the
// single source of truth for the vulnerable/attack telegraph. The old
// banner was event-driven with fixed durations, so a 2.2s TOO EARLY
// outlived the warning that caused it and still showed while the status
// line said "vulnerable to Turbo", and a 1.0s BOSS VULNERABLE expired
// mid-recovery (1.3-1.55s). The render loop re-asserts this banner
// whenever no fresher transient notice (spawn, hit, victory, refusal)
// overrides it, so the banner can never contradict the live phase.
// Returns null when there is no live boss (defeated or none).
export function bossPhaseNotice(boss,charge){
  if(!boss||boss.defeated)return null;
  if(boss.phase==="recovery"){
    if(boss.hitThisRecovery)
      return {kind:"tip",quiet:true,title:"GUARDIAN STRUCK"};
    const pct=typeof charge==="number"?Math.max(0,Math.floor(charge)):0;
    return {kind:"success",title:"BOSS VULNERABLE",
      detail:pct>=100?"TURBO READY":`Turbo ${pct}%`};
  }
  if(boss.phase==="warning"||boss.phase==="active"){
    const config=getBossConfig(boss.kind);
    const attack=config?.attacks.find(a=>a.id===boss.attack);
    return {kind:"tip",title:attack?.warningText||"BOSS ATTACK"};
  }
  return null;
}

// The boss status line reads the SAME notice state the banner renders —
// the single source of truth for the vulnerable window. While a boss
// notice is on screen (the live phase banner or a transient refusal /
// hit / spawn) the status line echoes its title, so the two can never
// contradict each other. When no boss notice is showing it says nothing:
// the old fallback derived the phase from hud.boss, a snapshot up to
// 115ms stale, so it could say "attack incoming" while the banner said
// "BOSS VULNERABLE" (and vice versa) — the round-6 banner/status
// disagreement. An empty suffix next to a hidden banner is honest; a
// stale phase next to a live banner is a contradiction.
export function bossStatusSuffix(boss,charge,notice){
  if(!boss)return "";
  const bossNoticeTypes=["boss-phase","boss-spawn","boss-warning","boss-vulnerable",
    "boss-hit","boss-victory","boss-strike-early","boss-turbo-charging",
    "boss-struck","boss-turbo-active"];
  if(notice&&bossNoticeTypes.includes(notice.eventType))return notice.title;
  return "";
}

// A complete run earns one star; two excavated walls and the secret relic
// earn the remaining two. Failed runs never earn a medal, even at high score.
export function excavationStars(run) {
  if(!run || run.result!=="complete")return 0;
  return 1+Number((run.wallsBroken||0)>=2)+Number((run.relics||0)>0);
}
