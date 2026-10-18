import { Game, COLS, ROWS, mazeCells, point, type Options, type Point } from './engine.ts';

export interface Snapshot {
  version: 1;
  gameMode: 'snake2';
  phase: 'paused';
  snake: Point[];
  dir: Point;
  food: Point;
  bonus: Point | null;
  bonusSteps: number;
  score: number;
  beat: number;
  options: Options;
}
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const integer = (v: unknown, min: number, max: number): v is number => Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max;
const coordinate = (v: unknown): v is Point => record(v) && integer(v.x, 0, COLS - 1) && integer(v.y, 0, ROWS - 1);
const direction = (v: unknown): v is Point => record(v) && integer(v.x, -1, 1) && integer(v.y, -1, 1) && Math.abs(v.x) + Math.abs(v.y) === 1;
const copy = (p: Point): Point => ({ x: p.x, y: p.y });

/** Treat disk data as untrusted. No Object.assign of persisted objects into the engine. */
export function validateSnapshot(value: unknown): Snapshot | null {
  if (!record(value) || value.version !== 1 || value.gameMode !== 'snake2' || value.phase !== 'paused') return null;
  const o = value.options;
  if (!record(o) || !integer(o.level, 1, 9) || !integer(o.maze, 0, 2) || (o.walls !== 'solid' && o.walls !== 'wrap')) return null;
  if (!Array.isArray(value.snake) || value.snake.length < 2 || value.snake.length >= COLS * ROWS || !value.snake.every(coordinate)) return null;
  if (!direction(value.dir) || !coordinate(value.food) || (value.bonus !== null && !coordinate(value.bonus))) return null;
  if (!integer(value.score, 0, COLS * ROWS * 25) || value.score % 5 !== 0 || !integer(value.beat, 0, Number.MAX_SAFE_INTEGER)) return null;
  if (!integer(value.bonusSteps, 0, 55) || (value.bonus === null ? value.bonusSteps !== 0 : value.bonusSteps < 1)) return null;
  const obstacles = mazeCells(o.maze), occupied = new Set<string>();
  for (let i = 0; i < value.snake.length; i++) {
    const cell = value.snake[i], key = point(cell.x, cell.y);
    if (obstacles.has(key) || occupied.has(key)) return null;
    occupied.add(key);
    if (i) {
      const previous = value.snake[i - 1];
      let dx = Math.abs(cell.x - previous.x), dy = Math.abs(cell.y - previous.y);
      if (o.walls === 'wrap') { dx = Math.min(dx, COLS - dx); dy = Math.min(dy, ROWS - dy); }
      if (dx + dy !== 1) return null;
    }
  }
  // Head direction must agree with the neck, including wrapping at an edge.
  const head = value.snake[0], neck = value.snake[1];
  if ((neck.x + value.dir.x + COLS) % COLS !== head.x || (neck.y + value.dir.y + ROWS) % ROWS !== head.y) return null;
  for (const cell of [value.food, value.bonus]) {
    if (!cell) continue;
    const key = point(cell.x, cell.y);
    if (occupied.has(key) || obstacles.has(key)) return null;
    occupied.add(key);
  }
  return { version: 1, gameMode: 'snake2', phase: 'paused', snake: value.snake.map(copy), dir: copy(value.dir),
    food: copy(value.food), bonus: value.bonus ? copy(value.bonus) : null, bonusSteps: value.bonusSteps,
    score: value.score, beat: value.beat, options: { level: o.level, maze: o.maze, walls: o.walls } };
}
export function capture(game: Game): Snapshot | null {
  if ((game.phase !== 'playing' && game.phase !== 'paused') || !game.food) return null;
  return { version: 1, gameMode: 'snake2', phase: 'paused', snake: game.snake.map(copy), dir: copy(game.dir),
    food: copy(game.food), bonus: game.bonus ? copy(game.bonus) : null, bonusSteps: game.bonus ? game.bonusSteps : 0,
    score: game.score, beat: game.beat, options: { ...game.options } };
}
export function restore(game: Game, data: unknown): boolean {
  const s = validateSnapshot(data);
  if (!s) return false;
  game.options = s.options; game.obstacles = mazeCells(s.options.maze);
  game.snake = s.snake; game.dir = s.dir; game.food = s.food; game.bonus = s.bonus;
  game.bonusSteps = s.bonusSteps; game.score = s.score; game.beat = s.beat;
  game.best = Math.max(game.best, s.score); game.queue = []; game.phase = 'paused';
  return true;
}
