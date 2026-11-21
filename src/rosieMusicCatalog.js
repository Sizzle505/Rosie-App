/* Original Suno WAV masters are preserved in Dropbox. The site streams only
 * compact, loudness-matched MP3 derivatives, never 48 kHz WAV downloads. */
export const ROSIE_MUSIC = Object.freeze({
  "galactic-march":{title:"Galactic March",original:"Galactic March(2).wav",loop:true,loopStartSeconds:5},
  "cosmic-arpeggio":{title:"Cosmic Arpeggio",original:"Cosmic Arpeggio(2).wav",loop:true,loopStartSeconds:5},
  "cosmic-interlude":{title:"Cosmic Interlude",original:"Untitled(2).wav",loop:true,loopStartSeconds:5},
  "haiku-garden":{title:"Quiet Garden",original:"静かな庭.wav",loop:true,loopStartSeconds:5},
  "ember-tunnel":{title:"Deep Gear Discovery",original:"Deep Gear Discovery.wav",loop:true,loopStartSeconds:5},
  "yacht-voyage":{title:"Sea Adventure",original:"海の冒険.wav",loop:true,loopStartSeconds:5},
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
  home:"whimsical-journey",
  fortune:"oracle-secret",
  cheese:"cheese-heist",
  captain:"yacht-voyage",
  captain2:"cosmic-interlude",
  vault:"whimsical-journey",
  randomizers:"whimsical-journey",
  haiku:"haiku-garden",
  timekeeper:"clockwork-nostalgia",
  calculations:"clockwork-nostalgia",
  "qr-atelier":"candlelit-library",
  resources:"candlelit-library",
  recipes:"candlelit-library",
  reminders:"candlelit-library",
  reviews:"whimsical-journey"
})[page]||"whimsical-journey";
export function sceneMusicTrack(scene,state,details={}){
  if(scene==="yacht")return "yacht-voyage";
  if(scene==="tunnel")return "ember-tunnel";
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
