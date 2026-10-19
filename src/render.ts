import { Game, COLS, ROWS } from './engine.ts';
import type { Settings } from './storage.ts';
import { GameSession, challenges } from './modes.ts';
import { CELL, STATUS_HEIGHT, LCD_PADDING, BOARD_WIDTH, BOARD_HEIGHT, LCD_WIDTH, LCD_HEIGHT } from './display.ts';
export const palettes = {
  olive: { ink: '#293e28', mid: '#536c40', paper: '#aabd83', light: '#b6c991', grid: '#879b6b' },
  silver: { ink: '#263a39', mid: '#5a706b', paper: '#b5c5b9', light: '#c9d6ca', grid: '#96aa9d' },
  amber: { ink: '#47371d', mid: '#7c632f', paper: '#ceae65', light: '#dfc17b', grid: '#b49550' },
  dark: { ink: '#ddedb8', mid: '#a1ba83', paper: '#18251d', light: '#293a2a', grid: '#304233' },
  contrast: { ink: '#101a0d', mid: '#35452b', paper: '#edf5cb', light: '#ffffff', grid: '#cbd4b4' }
};
let background: HTMLCanvasElement | null = null;
let backgroundTheme = '';
let backgroundObstacles: Set<string> | null = null;
// Fixed logical bitmap, independently of devicePixelRatio. CSS uses nearest-neighbour scaling.
export function draw(canvas: HTMLCanvasElement, game: Game, settings: Settings) {
  if (canvas.width !== LCD_WIDTH) canvas.width = LCD_WIDTH;
  if (canvas.height !== LCD_HEIGHT) canvas.height = LCD_HEIGHT;
  const target = canvas.getContext('2d')!;
  let ctx = target;
  const { ink, mid, paper, light, grid } = palettes[settings.lcd];
  const TOP = STATUS_HEIGHT, W = BOARD_WIDTH, H = STATUS_HEIGHT + BOARD_HEIGHT;
  const rect = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); };
  const txt = (s: string, x: number, y: number, size = 12, align: CanvasTextAlign = 'left') => { ctx.fillStyle = ink; ctx.font = `bold ${size}px monospace`; ctx.textAlign = align; ctx.fillText(s, x, y); };
  const cell = (x: number, y: number, c = ink) => rect(x * CELL + 1, TOP + y * CELL + 1, 10, 10, c);
  target.imageSmoothingEnabled = false;
  target.setTransform(1, 0, 0, 1, 0, 0);
  // Grid and maze do not change within a round. Rasterize them once per theme/maze.
  if (!background) { background = canvas.ownerDocument.createElement('canvas'); background.width = LCD_WIDTH; background.height = LCD_HEIGHT; }
  if (backgroundTheme !== settings.lcd || backgroundObstacles !== game.obstacles) {
  ctx = background.getContext('2d')!;
  rect(0, 0, LCD_WIDTH, LCD_HEIGHT, paper);
  ctx.save(); ctx.translate(LCD_PADDING, LCD_PADDING);
  rect(0, 0, W, H, paper); rect(0, 0, W, TOP, light); rect(0, TOP - 2, W, 2, mid);
  for (let i = 0; i < 4; i++) rect(117 + i * 5, 12 - i * 2, 3, 3, ink);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) rect(x * CELL + 5, TOP + y * CELL + 5, 1, 1, grid);
  for (const p of game.obstacles) { const [x, y] = p.split(',').map(Number); cell(x, y, mid); rect(x * CELL + 3, TOP + y * CELL + 3, 6, 6, ink); }
  ctx.restore();
  backgroundTheme = settings.lcd; backgroundObstacles = game.obstacles;
  }
  ctx = target; ctx.drawImage(background, 0, 0);
  ctx.save(); ctx.translate(LCD_PADDING, LCD_PADDING);
  const run = game instanceof GameSession ? game.run : null;
  txt(run ? ({ classic: 'CLASSIC', zen: 'ZEN MODE', timeAttack: 'TIME ATTACK', challenge: 'CHALLENGE' }[run.mode]) : 'BYTECOIL', 7, 14, 11);
  txt(String(game.score).padStart(4, '0'), W - 7, 14, 13, 'right');
  let line = 'HI ' + String(game.best).padStart(4, '0') + '  LV ' + game.options.level;
  if (run?.mode === 'timeAttack' && game instanceof GameSession) line = `${Math.ceil(game.remainingMs / 1000)}s  HI ${game.best}  LV ${game.options.level}`;
  if (run?.mode === 'zen') line = `L ${game.snake.length}  ${Math.floor(run.elapsedMs / 1000)}s  KOLL ${run.collisions}`;
  if (run?.mode === 'challenge' && game instanceof GameSession) line = `${challenges[run.challenge].name}  ${game.progress}/${challenges[run.challenge].target}`;
  txt(line, 7, 27, 9);
  if (game.food) { cell(game.food.x, game.food.y); rect(game.food.x * CELL + 4, TOP + game.food.y * CELL + 4, 4, 4, light); }
  if (game.bonus) {
    const x = game.bonus.x * CELL, y = TOP + game.bonus.y * CELL;
    cell(game.bonus.x, game.bonus.y, game.beat % 2 ? ink : mid);
    rect(x + 3, y + 5, 6, 2, light); rect(x + 5, y + 3, 2, 6, light);
  }
  game.snake.forEach((p, i) => {
    cell(p.x, p.y, i === 0 ? ink : mid);
    if (!i) rect(p.x * CELL + 4 + (game.dir.x > 0 ? 3 : game.dir.x < 0 ? -1 : 0), TOP + p.y * CELL + 4 + (game.dir.y > 0 ? 3 : game.dir.y < 0 ? -1 : 0), 2, 2, light);
  });
  if (game.phase !== 'playing' && game.phase !== 'ready') {
    rect(23, 76, 266, 89, paper); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(24.5, 77.5, 263, 86);
    txt(game.phase === 'paused' ? 'PAUSE' : run?.outcome === 'success' ? 'GESCHAFFT!' : run?.outcome === 'timeout' ? 'ZEIT VORBEI' : game.phase === 'won' ? 'GEWONNEN!' : 'GAME OVER', W / 2, 111, 21, 'center');
    txt(game.phase === 'paused' ? 'WEITER: 5 / ENTER' : 'NEUSTART: 5 / ENTER', W / 2, 137, 12, 'center');
    if (game.phase !== 'paused' && (!run || run.mode === 'classic' || run.mode === 'timeAttack') && game.score >= game.best && game.score > 0) txt('NEUER REKORD!', W / 2, 154, 9, 'center');
  }
  ctx.restore();
}
