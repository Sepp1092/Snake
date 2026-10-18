import { Game, type Options } from './engine.ts';

export type GameMode = 'classic' | 'zen' | 'timeAttack' | 'challenge';
export type Duration = 60 | 120 | 180;
export type ChallengeId = 'hunter' | 'survivor' | 'maze';
export const modeNames: Record<GameMode, string> = { classic: 'Classic Snake', zen: 'Zen Mode', timeAttack: 'Time Attack', challenge: 'Challenge Mode' };
export const challenges: Record<ChallengeId, { name: string; description: string; target: number; metric: 'food' | 'steps'; options: Options }> = {
  hunter: { name: 'Food Hunter', description: 'Sammle 10 Futterobjekte in einer Partie.', target: 10, metric: 'food', options: { level: 4, maze: 0, walls: 'solid' } },
  survivor: { name: 'Survivor', description: 'Überlebe 100 Bewegungsschritte im Kreuz-Labyrinth.', target: 100, metric: 'steps', options: { level: 5, maze: 2, walls: 'solid' } },
  maze: { name: 'Maze Master', description: 'Sammle 5 Futterobjekte im Box-Labyrinth.', target: 5, metric: 'food', options: { level: 4, maze: 1, walls: 'solid' } }
};
export interface RunState {
  id: string;
  mode: GameMode;
  duration: Duration;
  challenge: ChallengeId;
  elapsedMs: number;
  food: number;
  steps: number;
  collisions: number;
  longest: number;
  outcome: 'active' | 'collision' | 'timeout' | 'success' | 'board';
}
const uid = () => globalThis.crypto?.randomUUID?.() ?? `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const freshRun = (mode: GameMode = 'classic', duration: Duration = 120, challenge: ChallengeId = 'hunter'): RunState => ({ id: uid(), mode, duration, challenge, elapsedMs: 0, food: 0, steps: 0, collisions: 0, longest: 0, outcome: 'active' });
export function validateRun(value: unknown): RunState | null {
  if (!value || typeof value !== 'object') return null;
  const r = value as RunState;
  if (typeof r.id !== 'string' || !/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)+$/.test(r.id) || r.id.length > 100 || !['classic', 'zen', 'timeAttack', 'challenge'].includes(r.mode) || ![60,120,180].includes(r.duration) || !Object.hasOwn(challenges, r.challenge) || r.outcome !== 'active') return null;
  if (!Number.isFinite(r.elapsedMs) || r.elapsedMs < 0 || r.elapsedMs > 1e12 || (r.mode === 'timeAttack' && r.elapsedMs >= r.duration * 1000)) return null;
  for (const n of [r.food, r.steps, r.collisions, r.longest]) if (!Number.isSafeInteger(n) || n < 0 || n > 1e12) return null;
  if (r.longest < 2 || r.longest > 442) return null;
  return { id: r.id, mode: r.mode, duration: r.duration, challenge: r.challenge, elapsedMs: r.elapsedMs, food: r.food, steps: r.steps, collisions: r.collisions, longest: r.longest, outcome: 'active' };
}

/** One shared movement engine; this session adds objectives and an active-time clock. */
export class GameSession extends Game {
  run = freshRun();
  private anchor: number | null = null;
  private clock: () => number;
  constructor(options: Options, random = Math.random, clock = () => performance.now()) { super(options, random); this.clock = clock; }
  start(mode: GameMode, duration: Duration, challenge: ChallengeId, options: Options) {
    this.options = mode === 'challenge' ? { ...challenges[challenge].options } : { ...options };
    super.reset(); this.run = freshRun(mode, duration, challenge); this.run.longest = this.snake.length;
    this.anchor = this.clock();
  }
  override reset() { this.start(this.run.mode, this.run.duration, this.run.challenge, this.options); }
  get remainingMs() { return Math.max(0, this.run.duration * 1000 - this.run.elapsedMs); }
  get progress() { const challenge = challenges[this.run.challenge]; return challenge.metric === 'food' ? this.run.food : this.run.steps; }
  advanceClock(now = this.clock()): boolean {
    if (this.phase !== 'playing' || this.anchor === null) return false;
    const delta = Math.max(0, now - this.anchor); this.anchor = Math.max(this.anchor, now);
    this.run.elapsedMs += delta;
    if (this.run.mode === 'timeAttack' && this.remainingMs === 0) {
      this.run.elapsedMs = this.run.duration * 1000; this.run.outcome = 'timeout'; super.over(); this.anchor = null; return true;
    }
    return false;
  }
  override pause() { this.advanceClock(); super.pause(); this.anchor = null; }
  override resume() { if (this.phase === 'paused') { super.resume(); this.anchor = this.clock(); } }
  loadRun(run: RunState) { this.run = { ...run }; this.anchor = null; }
  override step(): ReturnType<Game['step']> {
    if (this.phase !== 'playing') return null;
    if (this.advanceClock()) return 'over';
    const result = super.step();
    if (result === 'over') {
      this.run.collisions++;
      if (this.run.mode === 'zen') { this.respawn(); return 'move'; }
      this.run.outcome = 'collision'; this.anchor = null;
    } else {
      this.run.steps++;
      if (result === 'eat' || result === 'bonus') this.run.food++;
      this.run.longest = Math.max(this.run.longest, this.snake.length);
      if (this.run.mode === 'challenge' && this.progress >= challenges[this.run.challenge].target) {
        this.phase = 'won'; this.queue = []; this.run.outcome = 'success'; this.anchor = null; return 'won';
      }
      if (result === 'won') {
        if (this.run.mode === 'zen') { this.respawn(); return 'move'; }
        this.run.outcome = 'board'; this.anchor = null;
      }
    }
    return result;
  }
  private respawn() {
    const score = this.score, beat = this.beat;
    super.reset(); this.score = score; this.beat = beat;
  }
}
export function runLabel(game: GameSession): string {
  const run = game.run;
  if (run.mode === 'timeAttack') return `${Math.ceil(game.remainingMs / 1000)}s · Stufe ${game.options.level}`;
  if (run.mode === 'challenge') return `${challenges[run.challenge].name} · ${game.progress}/${challenges[run.challenge].target}`;
  if (run.mode === 'zen') return `Länge ${game.snake.length} · ${Math.floor(run.elapsedMs / 1000)}s · Kollisionen ${run.collisions}`;
  return `Stufe ${game.options.level} · ${game.options.walls === 'wrap' ? 'Durchgang' : 'Wand'}`;
}
