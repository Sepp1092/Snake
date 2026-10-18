import type { Options } from './engine.ts';
import { validateSnapshot, type Snapshot } from './snapshot.ts';
export type Settings = Options & { sound: boolean; volume: number; vibration: boolean; profile: 'classic' | 'modern'; lcd: 'olive' | 'silver' | 'amber' | 'dark' | 'contrast'; control: 'both' | 'swipe' | 'keys'; full: boolean };
export interface Store { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem?(key: string): void }
export const defaults: Settings = { level: 3, maze: 0, walls: 'wrap', sound: true, volume: 2, vibration: false, profile: 'classic', lcd: 'olive', control: 'both', full: false };
export class Persistence {
  available = true;
  private store: Store | null;
  constructor(store: Store | null) { this.store = store; this.available = !!store; }
  get(key: string) { try { return this.store?.getItem('snake3310_' + key) ?? null; } catch { this.available = false; return null; } }
  put(key: string, value: string) { try { if (!this.store) throw Error(); this.store.setItem('snake3310_' + key, value); } catch { this.available = false; } }
  load(): Settings {
    const level = Number(this.get('level') ?? 3), maze = Number(this.get('maze') ?? 0);
    const lcd = this.get('lcd'), control = this.get('control'), volume = Number(this.get('volume') ?? 2);
    return { level: Number.isInteger(level) && level >= 1 && level <= 9 ? level : 3,
      maze: [0, 1, 2].includes(maze) ? maze : 0, walls: this.get('walls') === 'solid' ? 'solid' : 'wrap',
      sound: this.get('sound') !== 'false', lcd: lcd === 'silver' || lcd === 'amber' || lcd === 'dark' || lcd === 'contrast' ? lcd : 'olive',
      volume: Number.isInteger(volume) && volume >= 0 && volume <= 4 ? volume : 2,
      vibration: this.get('vibration') === 'true', profile: this.get('profile') === 'modern' ? 'modern' : 'classic',
      control: control === 'swipe' || control === 'keys' ? control : 'both', full: this.get('full') === 'true' };
  }
  save(settings: Settings) { for (const [key, value] of Object.entries(settings)) this.put(key, String(value)); }
  best() { const n = Number(this.get('best')); return Number.isSafeInteger(n) && n >= 0 ? n : 0; }
  saveBest(score: number) { this.put('best', String(Math.max(this.best(), score))); }
  loadSnapshot(): Snapshot | null {
    const raw = this.get('snapshot');
    if (!raw || raw === 'null') return null;
    try {
      // A valid board is under 12 KB. Bound corrupt input before parsing.
      if (raw.length > 24000) throw Error('oversized');
      const snapshot = validateSnapshot(JSON.parse(raw));
      if (snapshot) return snapshot;
    } catch { /* Corrupt or incompatible data is safely discarded. */ }
    this.clearSnapshot(); return null;
  }
  saveSnapshot(snapshot: Snapshot) { this.put('snapshot', JSON.stringify(snapshot)); }
  clearSnapshot() {
    try {
      if (!this.store) throw Error('unavailable');
      if (this.store.removeItem) this.store.removeItem('snake3310_snapshot');
      else this.store.setItem('snake3310_snapshot', 'null');
    } catch { this.available = false; }
  }
}
