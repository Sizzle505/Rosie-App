// Original, locally synthesized nature-inspired ambiences.
// No streaming, licenses, cookies or external audio services.
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

export function createZenAudio() {
  let context = null;
  let source = null;
  let master = null;
  let filter = null;
  let modulation = null;

  async function start(kind = "wind", volume = 0.26) {
    stop();
    if (kind === "off") return true;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    try {
      context = new AudioContextClass();
      master = context.createGain();
      master.gain.value = 0;
      master.connect(context.destination);

      const length = Math.round(context.sampleRate * 4);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const output = buffer.getChannelData(0);
      let rolling = 0;
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        rolling = (rolling + white * 0.025) * 0.984;
        output[i] = kind === "rain" ? white * 0.22 : rolling * 0.75 + white * 0.018;
      }

      source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      filter = context.createBiquadFilter();
      filter.type = kind === "rain" ? "lowpass" : "lowpass";
      filter.frequency.value = kind === "stream" ? 1100 : kind === "rain" ? 1900 : 490;
      filter.Q.value = 0.35;
      source.connect(filter);
      filter.connect(master);

      modulation = context.createOscillator();
      const depth = context.createGain();
      modulation.frequency.value = kind === "stream" ? 0.065 : 0.045;
      depth.gain.value = kind === "rain" ? 0.012 : 0.025;
      modulation.connect(depth);
      depth.connect(master.gain);
      source.start();
      modulation.start();
      await context.resume();
      const now = context.currentTime;
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(clamp(volume, 0, 1) * 0.16, now + 1.8);
      return true;
    } catch {
      stop();
      return false;
    }
  }

  function setVolume(value) {
    if (context && master) {
      master.gain.setTargetAtTime(clamp(value, 0, 1) * 0.16, context.currentTime, 0.18);
    }
  }

  function stop() {
    try { source?.stop(); } catch {}
    try { modulation?.stop(); } catch {}
    source = null;
    modulation = null;
    filter = null;
    master = null;
    if (context) {
      const prior = context;
      context = null;
      prior.close().catch(() => {});
    }
  }

  return { start, setVolume, stop };
}