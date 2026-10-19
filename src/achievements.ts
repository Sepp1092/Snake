import type { RecordsData } from './records.ts';
import type { GameSession } from './modes.ts';

export const achievements = [
  { id: 'first-bite', name: 'First Bite', description: 'Sammle dein erstes Futterobjekt.', target: 1, icon: ['00100','01110','11111','11111','01110'] },
  { id: 'getting-started', name: 'Getting Started', description: 'Erreiche 100 Punkte in Classic Snake.', target: 100, icon: ['00100','01100','00100','00100','01110'] },
  { id: 'snake-master', name: 'Snake Master', description: 'Erreiche 500 Punkte in Classic Snake.', target: 500, icon: ['11111','10000','11110','00001','11110'] },
  { id: 'pixel-legend', name: 'Pixel Legend', description: 'Erreiche 1.000 Punkte in Classic Snake.', target: 1000, icon: ['10101','11111','01110','01110','11111'] },
  { id: 'growing-up', name: 'Growing Up', description: 'Erreiche eine Schlangenlänge von 20.', target: 20, icon: ['11111','10000','11111','00001','11111'] },
  { id: 'marathon-snake', name: 'Marathon Snake', description: 'Spiele insgesamt 60 Minuten aktiv.', target: 3600000, icon: ['01110','10101','10111','10001','01110'] },
  { id: 'food-collector', name: 'Food Collector', description: 'Sammle insgesamt 100 Futterobjekte.', target: 100, icon: ['01010','11111','01010','11111','01010'] },
  { id: 'zen-explorer', name: 'Zen Explorer', description: 'Spiele zehn aktive Minuten in einer Zen-Partie.', target: 600000, icon: ['00100','01110','10101','00100','11111'] },
  { id: 'speed-runner', name: 'Speed Runner', description: 'Erreiche 150 Punkte bei Time Attack mit 60 Sekunden.', target: 150, icon: ['00110','01100','11111','00110','01100'] },
  { id: 'challenge-beginner', name: 'Challenge Beginner', description: 'Schließe eine Challenge ab.', target: 1, icon: ['11111','10101','01110','00100','01110'] },
  { id: 'challenge-master', name: 'Challenge Master', description: 'Schließe alle drei Challenges ab.', target: 3, icon: ['10101','11111','00100','01110','11111'] },
  { id: 'perfect-run', name: 'Perfect Run', description: 'Schließe eine Challenge ohne Kollision ab.', target: 1, icon: ['00001','00011','10110','11100','01000'] }
] as const;
export type AchievementId = typeof achievements[number]['id'];
type Unlocks = Partial<Record<AchievementId, number>>;
interface Store { get(key: string): string | null; put(key: string, value: string): void }
export function parseAchievements(raw: string | null): Unlocks {
  if (!raw || raw.length > 10000) return {};
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !value.unlocked || typeof value.unlocked !== 'object' || Array.isArray(value.unlocked)) return {};
    const result: Unlocks = {};
    for (const a of achievements) {
      const at = value.unlocked[a.id];
      if (Number.isSafeInteger(at) && at >= 0 && at <= 8640000000000000) result[a.id] = at;
    }
    return result;
  } catch { return {}; }
}
export class Achievements {
  unlocked: Unlocks;
  private store: Store;
  private now: () => number;
  constructor(store: Store, now = Date.now) { this.store = store; this.now = now; this.unlocked = parseAchievements(store.get('achievements_v1')); }
  progress(data: RecordsData, game?: GameSession): Record<AchievementId, number> {
    const counters = Object.values(data.modes);
    const food = counters.reduce((n, c) => n + c.food, 0), active = counters.reduce((n, c) => n + c.activeMs, 0);
    const completed = Object.values(data.completed).filter(Boolean).length;
    const zen = Object.values(data.receipts).reduce((n, r) => r.mode === 'zen' ? Math.max(n, r.elapsedMs) : n, 0);
    return { 'first-bite': food, 'getting-started': data.classicBest, 'snake-master': data.classicBest, 'pixel-legend': data.classicBest,
      'growing-up': Math.max(...counters.map(c => c.longest)), 'marathon-snake': active, 'food-collector': food, 'zen-explorer': zen,
      'speed-runner': data.timeBest['60'], 'challenge-beginner': completed, 'challenge-master': completed,
      'perfect-run': this.unlocked['perfect-run'] !== undefined || (game?.run.mode === 'challenge' && game.run.outcome === 'success' && game.run.collisions === 0) ? 1 : 0 };
  }
  evaluate(data: RecordsData, game?: GameSession): AchievementId[] {
    // Merge persisted unlocks so reloading the same snapshot cannot grant twice.
    Object.assign(this.unlocked, parseAchievements(this.store.get('achievements_v1')));
    const progress = this.progress(data, game), added: AchievementId[] = [];
    for (const a of achievements) if (this.unlocked[a.id] === undefined && progress[a.id] >= a.target) {
      this.unlocked[a.id] = this.now(); added.push(a.id);
    }
    if (added.length) this.store.put('achievements_v1', JSON.stringify({ version: 1, unlocked: this.unlocked }));
    return added;
  }
  count() { return Object.keys(this.unlocked).length; }
}

export function achievementProgress(id: AchievementId, value: number) {
  const a = achievements.find(a => a.id === id)!;
  return id === 'marathon-snake' || id === 'zen-explorer'
    ? `${Math.floor(Math.min(value, a.target) / 60000)}/${a.target / 60000} min`
    : `${Math.min(value, a.target)}/${a.target}`;
}
