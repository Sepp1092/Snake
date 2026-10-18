// Extracted from the working v0.3 prototype; coordinates, mazes and scoring retained.
export type Point = { x: number; y: number };
export type Phase = 'ready' | 'playing' | 'paused' | 'over' | 'won';
export type Options = { level: number; maze: number; walls: 'wrap' | 'solid' };
export const COLS = 26, ROWS = 17;
export const TURN_BUFFER_SIZE = 2;
export const directions = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
export const point = (x: number, y: number) => `${x},${y}`;
const equal = (a: Point, b: Point | null) => !!b && a.x === b.x && a.y === b.y;
export function mazeCells(n: number): Set<string> {
  const s = new Set<string>();
  if (n === 1) {
    for (let x = 6; x < 20; x++) { s.add(point(x, 4)); s.add(point(x, 12)); }
    for (let y = 4; y <= 12; y++) { s.add(point(6, y)); s.add(point(19, y)); }
    for (let x = 10; x <= 15; x++) { s.delete(point(x, 4)); s.delete(point(x, 12)); }
    for (let y = 7; y <= 9; y++) { s.delete(point(6, y)); s.delete(point(19, y)); }
  } else if (n === 2) {
    for (let y = 2; y < 15; y++) if (![7, 8, 9].includes(y)) s.add(point(13, y));
    for (let x = 3; x < 23; x++) if (x < 11 || x > 15) s.add(point(x, 8));
  }
  return s;
}
export class Game {
  snake: Point[] = [];
  dir: Point = { x: 1, y: 0 };
  queue: Point[] = [];
  food: Point | null = null;
  bonus: Point | null = null;
  bonusSteps = 0;
  score = 0;
  best = 0;
  beat = 0;
  phase: Phase = 'ready';
  obstacles = new Set<string>();
  options: Options;
  private random: () => number;
  constructor(options: Options, random = Math.random) { this.options = options; this.random = random; }
  get interval() { return Math.max(73, 260 - this.options.level * 21); }
  randomCell(): Point | null {
    const free: Point[] = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const p = { x, y };
      if (!this.snake.some(s => equal(s, p)) && !this.obstacles.has(point(x, y)) && !equal(p, this.food) && !equal(p, this.bonus)) free.push(p);
    }
    return free.length ? free[Math.floor(this.random() * free.length)] : null;
  }
  reset() {
    this.obstacles = mazeCells(this.options.maze);
    this.snake = [{ x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }];
    if (this.snake.some(s => this.obstacles.has(point(s.x, s.y)))) this.snake = [{ x: 1, y: 1 }, { x: 0, y: 1 }];
    this.dir = { x: 1, y: 0 }; this.queue = []; this.score = 0; this.beat = 0;
    this.food = null; this.bonus = null; this.bonusSteps = 0;
    this.food = this.randomCell(); this.phase = 'playing';
  }
  turn(next: Point): boolean {
    if (this.phase !== 'playing' || Math.abs(next.x) + Math.abs(next.y) !== 1) return false;
    const base = this.queue.at(-1) ?? this.dir;
    if (equal(base, next) || (next.x === -base.x && next.y === -base.y)) return false;
    // Never overwrite accepted turns. Extra commands are deliberately rejected.
    if (this.queue.length >= TURN_BUFFER_SIZE) return false;
    this.queue.push({ ...next }); return true;
  }
  pause() { if (this.phase === 'playing') { this.phase = 'paused'; this.queue = []; } }
  resume() { if (this.phase === 'paused') this.phase = 'playing'; }
  over() { this.phase = 'over'; this.queue = []; }
  step(): 'move' | 'eat' | 'bonus' | 'over' | 'won' | null {
    if (this.phase !== 'playing') return null;
    this.beat++; this.dir = this.queue.shift() ?? this.dir;
    const x = this.snake[0].x + this.dir.x, y = this.snake[0].y + this.dir.y;
    if (this.options.walls === 'solid' && (x < 0 || x >= COLS || y < 0 || y >= ROWS)) { this.over(); return 'over'; }
    const head = { x: (x + COLS) % COLS, y: (y + ROWS) % ROWS };
    const eating = equal(head, this.food), bonusEat = equal(head, this.bonus);
    const collisionLength = this.snake.length - (eating || bonusEat ? 0 : 1);
    if (this.obstacles.has(point(head.x, head.y)) || this.snake.some((s, i) => i < collisionLength && equal(s, head))) { this.over(); return 'over'; }
    this.snake.unshift(head);
    if (eating) {
      this.score += 10; this.food = null; this.food = this.randomCell();
      if (this.score % 50 === 0 && !this.bonus) { this.bonus = this.randomCell(); this.bonusSteps = 55; }
    } else if (bonusEat) { this.score += 25; this.bonus = null; this.bonusSteps = 0; }
    else this.snake.pop();
    if (this.bonus && --this.bonusSteps <= 0) { this.bonus = null; this.bonusSteps = 0; }
    this.best = Math.max(this.best, this.score);
    // If the last free cell was a bonus, promote it to normal food to avoid a false win.
    if (!this.food && this.bonus) { this.food = this.bonus; this.bonus = null; this.bonusSteps = 0; }
    if (!this.food) { this.phase = 'won'; this.queue = []; return 'won'; }
    return eating ? 'eat' : bonusEat ? 'bonus' : 'move';
  }
}
