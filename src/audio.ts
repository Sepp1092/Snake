export type SoundEvent = 'menu' | 'start' | 'pause' | 'eat' | 'bonus' | 'over' | 'record';
const signals: Record<SoundEvent, [number, number][]> = {
  menu: [[420, .025]], start: [[630, .07]], pause: [[280, .06]], eat: [[690, .055]],
  bonus: [[870, .07], [1050, .09]], over: [[185, .22]], record: [[660, .07], [830, .07], [990, .12]]
};
export function vibrate(enabled: boolean, event: SoundEvent, target: { vibrate?: (pattern: number | number[]) => boolean } | undefined = globalThis.navigator) {
  if (!enabled || typeof target?.vibrate !== 'function') return;
  try { target.vibrate(event === 'over' ? [25, 30, 25] : event === 'record' ? [12, 25, 12] : 8); } catch { /* Unsupported or denied. */ }
}
export class RetroAudio {
  private audio: AudioContext | null = null;
  signal(enabled: boolean, volume: number, event: SoundEvent) {
    let delay = 0;
    for (const [frequency, duration] of signals[event]) {
      this.play(enabled, frequency, duration, volume, delay); delay += duration + .025;
    }
  }
  play(enabled: boolean, freq = 400, duration = .055, volume = 2, delay = 0) {
    if (!enabled || volume <= 0) return;
    try {
      this.audio ??= new AudioContext();
      void this.audio.resume().catch(() => {});
      const oscillator = this.audio.createOscillator(), gain = this.audio.createGain();
      oscillator.type = 'square'; oscillator.frequency.value = freq;
      const start = this.audio.currentTime + delay;
      gain.gain.setValueAtTime(.0175 * Math.min(4, volume), start);
      gain.gain.exponentialRampToValueAtTime(.001, start + duration);
      oscillator.connect(gain).connect(this.audio.destination);
      oscillator.start(start); oscillator.stop(start + duration);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch { /* Audio may be unavailable; the game remains playable. */ }
  }
}
