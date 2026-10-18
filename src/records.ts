import { challenges, type GameMode, type GameSession, type RunState } from './modes.ts';
export interface Counters { games: number; activeMs: number; food: number; points: number; longest: number; collisions: number }
type Receipt = { mode: GameMode; elapsedMs: number; food: number; points: number; longest: number; collisions: number; done: boolean };
export interface RecordsData {
  version: 1;
  modes: Record<GameMode, Counters>;
  classicBest: number;
  timeBest: Record<'60' | '120' | '180', number>;
  completed: Record<'hunter' | 'survivor' | 'maze', boolean>;
  receipts: Record<string, Receipt>;
}
interface LocalData { get(key: string): string | null; put(key: string, value: string): void }
const empty = (): Counters => ({ games: 0, activeMs: 0, food: 0, points: 0, longest: 0, collisions: 0 });
export const emptyRecords = (): RecordsData => ({ version: 1, modes: { classic: empty(), zen: empty(), timeAttack: empty(), challenge: empty() }, classicBest: 0, timeBest: { '60': 0, '120': 0, '180': 0 }, completed: { hunter: false, survivor: false, maze: false }, receipts: {} });
const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1e12;
const legacy = (v: string | null) => { const n = Number(v); return number(n) && Number.isInteger(n) ? n : 0; };
export function parseRecords(raw: string | null): RecordsData {
  if (!raw || raw.length > 4_000_000) return emptyRecords();
  try {
    const data = JSON.parse(raw);
    if (data.version !== 1 || !data.modes || !data.timeBest || !data.completed || !data.receipts || Array.isArray(data.receipts) || !number(data.classicBest)) return emptyRecords();
    for (const mode of ['classic', 'zen', 'timeAttack', 'challenge']) {
      const c = data.modes[mode];
      if (!c || Object.keys(empty()).some(k => !number(c[k])) || ['games','food','points','longest','collisions'].some(k => !Number.isSafeInteger(c[k])) || c.longest > 442) return emptyRecords();
    }
    for (const duration of ['60', '120', '180']) if (!number(data.timeBest[duration])) return emptyRecords();
    for (const id of ['hunter', 'survivor', 'maze']) if (typeof data.completed[id] !== 'boolean') return emptyRecords();
    for (const [id, r] of Object.entries(data.receipts) as [string, Receipt][]) {
      if (!/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)+$/.test(id) || id.length > 100 || !r || !['classic', 'zen', 'timeAttack', 'challenge'].includes(r.mode) || typeof r.done !== 'boolean' || ![r.elapsedMs, r.food, r.points, r.longest, r.collisions].every(number) || r.longest > 442) return emptyRecords();
    }
    return data;
  } catch { return emptyRecords(); }
}
export class Records {
  private store: LocalData;
  data: RecordsData;
  constructor(store: LocalData) { this.store = store; this.data = parseRecords(store.get('records_v1')); this.data.classicBest = Math.max(this.data.classicBest, legacy(store.get('best'))); }
  best(run: RunState) { return run.mode === 'classic' ? this.data.classicBest : run.mode === 'timeAttack' ? this.data.timeBest[String(run.duration) as '60'] : 0; }
  isFinalized(id: string) { return this.data.receipts[id]?.done === true; }
  sync(game: GameSession) {
    const run = game.run;
    if (game.phase === 'ready') return;
    const data = parseRecords(this.store.get('records_v1'));
    data.classicBest = Math.max(data.classicBest, this.data.classicBest, legacy(this.store.get('best')));
    const prior = data.receipts[run.id];
    if (prior && prior.mode !== run.mode) { this.data = data; return; }
    if (prior?.done) { this.data = data; return; }
    const counters = data.modes[run.mode];
    if (!prior) counters.games++;
    const current: Receipt = { mode: run.mode, elapsedMs: run.elapsedMs, food: run.food, points: game.score, longest: run.longest, collisions: run.collisions, done: game.phase === 'over' || game.phase === 'won' };
    counters.activeMs += Math.max(0, current.elapsedMs - (prior?.elapsedMs ?? 0));
    counters.food += Math.max(0, current.food - (prior?.food ?? 0));
    counters.points += Math.max(0, current.points - (prior?.points ?? 0));
    counters.collisions += Math.max(0, current.collisions - (prior?.collisions ?? 0));
    counters.longest = Math.max(counters.longest, current.longest);
    // Retain the highest watermark even if the snapshot lagged behind a successful statistics write.
    if (prior) for (const key of ['elapsedMs', 'food', 'points', 'longest', 'collisions'] as const) current[key] = Math.max(current[key], prior[key]);
    data.receipts[run.id] = current;
    if (run.mode === 'classic') { data.classicBest = Math.max(data.classicBest, game.score); this.store.put('best', String(data.classicBest)); }
    if (run.mode === 'timeAttack') { const key = String(run.duration) as '60'; data.timeBest[key] = Math.max(data.timeBest[key], game.score); }
    if (run.mode === 'challenge' && run.outcome === 'success') data.completed[run.challenge] = true;
    this.store.put('records_v1', JSON.stringify(data)); this.data = data;
  }
  total(): Counters { return Object.values(this.data.modes).reduce((a, b) => ({ games: a.games + b.games, activeMs: a.activeMs + b.activeMs, food: a.food + b.food, points: a.points + b.points, longest: Math.max(a.longest, b.longest), collisions: a.collisions + b.collisions }), empty()); }
  completedCount() { return Object.keys(challenges).filter(id => this.data.completed[id as 'hunter']).length; }
}
