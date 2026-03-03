// Genera sonido de llamada (ring) con Web Audio API
let audioContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioContext) audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioContext;
}

export function playRingTone(seconds: number = 4): () => void {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 800;
  osc.type = "sine";
  gain.gain.value = 0.15;
  osc.start(ctx.currentTime);
  const interval = setInterval(() => {
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
  }, 1000);
  const stop = () => {
    clearInterval(interval);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.2);
  };
  setTimeout(stop, seconds * 1000);
  return stop;
}

export function stopRingTone(stop: () => void) {
  stop();
}
