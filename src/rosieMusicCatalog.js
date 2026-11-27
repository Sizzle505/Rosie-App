/* Original Suno WAV masters are preserved in Dropbox. The site streams only
 * compact, loudness-matched MP3 derivatives, never 48 kHz WAV downloads. */
export const ROSIE_MUSIC = Object.freeze({
  "tunnel-tyrant":{"title":"The Tyrant's Coronation","original":"The Tyrant's Coronation.wav","loop":true,"loopStartSeconds":5,"fallback":"ember-tunnel"},
  "tunnel-clockwork-boss":{"title":"Clockwork Confrontation","original":"Clockwork Confrontation.wav","loop":true,"loopStartSeconds":5,"fallback":"ember-tunnel"},
  "tunnel-caverns":{"title":"Clockwork Caverns","original":"Clockwork Caverns.wav","loop":true,"loopStartSeconds":5,"fallback":"ember-tunnel"},
  "tunnel-depths":{"title":"Clockwork Depths","original":"Clockwork Depths.wav","loop":true,"loopStartSeconds":5,"fallback":"ember-tunnel"},
  "tunnel-crown-victory":{"title":"Triumph of the Crown","original":"Triumph of the Crown.wav","loop":false},
  "rosie-signature":{"title":"The Seven-note Journey","original":"The Seven-note Journey.wav","loop":true,"loopStartSeconds":5,"fallback":"whimsical-journey"},
  "zen-garden-dusk":{"title":"Garden at Dusk","original":"Garden at Dusk.wav","loop":true,"loopStartSeconds":5,"fallback":"haiku-garden"},
  "zen-temple-rain":{"title":"Temple Rain Meditation","original":"Temple Rain Meditation.wav","loop":true,"loopStartSeconds":5,"fallback":"haiku-garden"},
  "cosmic-victory":{"title":"Brass Launch Beat","original":"Brass Launch Beat.wav","loop":false},
  "yacht-victory":{"title":"Imperial Victory Fanfare","original":"Imperial Victory Fanfare.wav","loop":false},
  "vault-treasure":{"title":"A Private Treasure","original":"A Private Treasure.wav","loop":true,"loopStartSeconds":5,"fallback":"whimsical-journey"},
  "randomizers-monte-carlo":{"title":"Monte Carlo Midnight","original":"Monte Carlo Midnight.wav","loop":true,"loopStartSeconds":5,"fallback":"whimsical-journey"},
  "galactic-march":{title:"Galactic March",original:"Galactic March(2).wav",loop:true,loopStartSeconds:5},
  "cosmic-arpeggio":{title:"Cosmic Arpeggio",original:"Cosmic Arpeggio(2).wav",loop:true,loopStartSeconds:5},
  "cosmic-interlude":{title:"Cosmic Interlude",original:"Untitled(2).wav",loop:true,loopStartSeconds:5},
  "haiku-garden":{title:"Quiet Garden",original:"静かな庭.wav",loop:true,loopStartSeconds:5},
  "ember-tunnel":{title:"Deep Gear Discovery",original:"Deep Gear Discovery.wav",loop:true,loopStartSeconds:5},
  "yacht-voyage":{title:"Sea Adventure",original:"海の冒険.wav",loop:true,loopStartSeconds:5},
  "yacht-sakura":{title:"Island of Bright Winds",original:"Island of Bright Winds.wav",loop:true,loopStartSeconds:5,fallback:"yacht-voyage"},
  "yacht-typhoon":{title:"Storm\'s Edge",original:"Storm\'s Edge.wav",loop:true,loopStartSeconds:5,fallback:"yacht-voyage"},
  "yacht-moonlight":{title:"Moonlit Rivalry",original:"Moonlit Rivalry.wav",loop:true,loopStartSeconds:5,fallback:"yacht-voyage"},
  "yacht-emperor":{title:"Imperial Championship",original:"Imperial Championship.wav",loop:true,loopStartSeconds:5,fallback:"yacht-voyage"},
  "whimsical-journey":{title:"Whimsical Journey",original:"Whimsical Journey.wav",loop:true,loopStartSeconds:5},
  "victory-fanfare":{title:"Triumphal Flourish",original:"Triumphal Flourish.wav",loop:false},
  "oracle-secret":{title:"Oracle's Secret",original:"Oracle's Secret.wav",loop:true,loopStartSeconds:5},
  "cheese-heist":{title:"The Cheese Heist",original:"The Cheese Heist.wav",loop:true,loopStartSeconds:5},
  "clockwork-nostalgia":{title:"Clockwork Nostalgia",original:"Clockwork Nostalgia.wav",loop:true,loopStartSeconds:5},
  "candlelit-library":{title:"Candlelit Library",original:"Candlelit Library.wav",loop:true,loopStartSeconds:5},
  "pulse-arena":{title:"Pulse of the Arena",original:"Pulse of the Arena.wav",loop:true,loopStartSeconds:5}
});
export const ROSIE_MUSIC_DIRECTORY="/rosie-music/";
export const pageMusicTrack=page=>({
  home:"rosie-signature",
  fortune:"oracle-secret",
  cheese:"cheese-heist",
  captain:"yacht-voyage",
  captain2:"cosmic-interlude",
  vault:"vault-treasure",
  randomizers:"randomizers-monte-carlo",
  haiku:"haiku-garden",
  timekeeper:"clockwork-nostalgia",
  calculations:"clockwork-nostalgia",
  "qr-atelier":"candlelit-library",
  resources:"candlelit-library",
  recipes:"candlelit-library",
  reminders:"candlelit-library",
  reviews:"whimsical-journey"
})[page]||"whimsical-journey";
export function meditationMusicTrack(view){
  return ["tea","mist","moonlit"].includes(view)?"zen-temple-rain":"zen-garden-dusk";
}
export function sceneMusicTrack(scene,state,details={}){
  if(state==="win"||state==="victory"){
    if(scene==="yacht")return "yacht-victory";
    if(scene==="cosmic")return "cosmic-victory";
  }
  if(scene==="yacht"){
    const chapter=Math.max(0,Math.min(3,Math.floor(Number(details.chapter)||0)));
    return ["yacht-sakura","yacht-typhoon","yacht-moonlight","yacht-emperor"][chapter];
  }
  if(scene==="tunnel"){
    const world=details.world;
    if(state==="boss")return world===4?"tunnel-tyrant":"tunnel-clockwork-boss";
    if(state==="victory")return world===4?"tunnel-crown-victory":"victory-fanfare";
    if(Number.isInteger(world)&&world>=2)return "tunnel-caverns";
    if(Number.isInteger(world)&&world>=0)return "tunnel-depths";
    return "ember-tunnel";
  }
  if(scene==="cosmic"){
    if(state==="start"||state==="menu")return "galactic-march";
    const level=Number(details.level)||1;
    return level>=8?"pulse-arena":level>=4?"cosmic-interlude":"cosmic-arpeggio";
  }
  return null;
}
/* All looped recordings retain their natural opening at t=0.
 * The fully mixed loop body begins at t=5 and wraps back to t=5. */
export const musicContextGain=page=>({
  home:0.77,fortune:0.7,cheese:0.86,captain:0.88,captain2:0.85,
  vault:0.76,randomizers:0.76,haiku:0.64,
  timekeeper:0.55,calculations:0.36,reminders:0.38,
  "qr-atelier":0.55,resources:0.52,recipes:0.64,reviews:0.55
})[page]??0.72;
export const musicUrl=id=>ROSIE_MUSIC_DIRECTORY+id+".mp3";
