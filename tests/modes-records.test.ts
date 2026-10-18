import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, directions, point } from '../src/engine.ts';
import { GameSession, challenges, validateRun, type GameMode } from '../src/modes.ts';
import { capture, restore, validateSnapshot } from '../src/snapshot.ts';
import { Records, parseRecords } from '../src/records.ts';
import { Persistence, defaults } from '../src/storage.ts';
import { Menu } from '../src/menu.ts';
function setup(mode: GameMode = 'classic') {
  let now = 0;
  const game = new GameSession({ level: 3, maze: 0, walls: 'wrap' }, () => .8, () => now);
  game.start(mode, 120, 'hunter', game.options);
  return { game, time: (n: number) => { now = n; } };
}
function store() { const data = new Map<string, string>(); return new Persistence({ getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); }, removeItem: key => { data.delete(key); } }); }
test('Classic session shares unchanged movement, food, score and collisions with v0.5.2 engine', () => {
  for (const maze of [0,1,2]) for (const walls of ['solid','wrap'] as const) {
    const options = { level: 3, maze, walls }, old = new Game(options, () => .8), session = new GameSession(options, () => .8, () => 0);
    old.reset(); session.start('classic', 120, 'hunter', options);
    for (let n = 0; n < 100; n++) {
      if (n % 7 === 0) { const dir = [directions.up, directions.left, directions.down, directions.right][Math.floor(n / 7) % 4]; assert.equal(session.turn(dir), old.turn(dir)); }
      assert.equal(session.step(), old.step()); assert.deepEqual(session.snake, old.snake); assert.deepEqual(session.food, old.food); assert.equal(session.score, old.score); assert.equal(session.phase, old.phase);
    }
  }
});
test('Zen respawns safely through repeated wall, maze and body collisions without ending session', () => {
  const { game } = setup('zen'); game.options = { level: 9, maze: 1, walls: 'solid' }; game.reset(); game.score = 85;
  for (let n = 0; n < 20; n++) {
    game.snake = [{ x: 25, y: 1 }, { x: 24, y: 1 }, { x: 23, y: 1 }]; game.dir = directions.right;
    assert.equal(game.step(), 'move'); assert.equal(game.phase, 'playing'); assert.equal(game.score, 85);
    assert.ok(game.snake.every(p => !game.obstacles.has(point(p.x,p.y)))); assert.deepEqual(game.queue, []);
    assert.ok(!game.snake.some(p => p.x === game.food!.x && p.y === game.food!.y));
  }
  assert.equal(game.run.collisions, 20); assert.equal(game.run.outcome, 'active');
  game.snake = [{ x: 5, y: 4 }, { x: 4, y: 4 }, { x: 3, y: 4 }]; game.step(); assert.equal(game.run.collisions, 21);
  game.snake = [{ x: 4, y: 4 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 4 }, { x: 6, y: 4 }]; game.step(); assert.equal(game.run.collisions, 22);
});
test('Zen preserves session points, duration, food count and historical length across respawn', () => {
  const { game, time } = setup('zen'); game.food = { x: 5, y: 8 }; game.step(); time(1500); game.advanceClock();
  game.options.walls = 'solid'; game.snake = [{ x: 25, y: 1 }, { x: 24, y: 1 }, { x: 23, y: 1 }]; game.step();
  assert.equal(game.score, 10); assert.equal(game.run.food, 1); assert.equal(game.run.longest, 4); assert.equal(game.run.elapsedMs, 1500);
});
test('all three Time Attack variants expire exactly at their active-time budget', () => {
  for (const duration of [60,120,180] as const) {
    const { game, time } = setup('timeAttack'); game.start('timeAttack', duration, 'hunter', game.options);
    time(duration * 1000 - .5); game.advanceClock(); assert.equal(game.phase, 'playing'); assert.equal(game.remainingMs, .5);
    time(duration * 1000 + 2000); assert.equal(game.advanceClock(), true); assert.equal(game.remainingMs, 0); assert.equal(game.run.elapsedMs, duration * 1000); assert.equal(game.run.outcome, 'timeout'); assert.equal(game.phase, 'over');
  }
});
test('active clock ignores paused time, repeated resume, backward readings and handles frame drops', () => {
  const { game, time } = setup('timeAttack'); time(1234.5); game.pause(); assert.equal(game.run.elapsedMs, 1234.5);
  time(90000); game.advanceClock(); assert.equal(game.run.elapsedMs, 1234.5);
  game.resume(); time(90100); game.resume(); game.advanceClock(); assert.equal(game.run.elapsedMs, 1334.5);
  time(90050); game.advanceClock(); assert.equal(game.run.elapsedMs, 1334.5);
  time(95000); game.advanceClock(); assert.equal(game.run.elapsedMs, 6234.5);
});
test('saved Time Attack retains exact fractional remaining active time and stays paused after restore', () => {
  const { game, time } = setup('timeAttack'); time(9876.25); game.pause(); const saved = capture(game)!;
  const restored = setup('classic'); restored.time(999999); assert.ok(restore(restored.game, saved));
  assert.equal(restored.game.phase, 'paused'); assert.equal(restored.game.remainingMs, 110123.75); restored.game.advanceClock(); assert.equal(restored.game.remainingMs, 110123.75);
  restored.game.resume(); restored.time(1000099); restored.game.advanceClock(); assert.equal(restored.game.remainingMs, 110023.75);
});
test('Time Attack ends on collision before timeout', () => { const { game } = setup('timeAttack'); game.options.walls = 'solid'; game.snake = [{ x: 25, y: 1 }, { x: 24, y: 1 }]; game.step(); assert.equal(game.run.outcome, 'collision'); assert.equal(game.phase, 'over'); });
test('each challenge enforces its safe obstacle layout and succeeds at its independent target', () => {
  for (const id of ['hunter','survivor','maze'] as const) {
    const { game } = setup(); game.start('challenge', 120, id, { level: 1, maze: 0, walls: 'wrap' });
    assert.deepEqual(game.options, challenges[id].options); assert.ok(game.snake.every(p => !game.obstacles.has(point(p.x,p.y))));
    game.run.food = challenges[id].metric === 'food' ? challenges[id].target - 1 : 0;
    game.run.steps = challenges[id].metric === 'steps' ? 99 : 0;
    game.food = { x: game.snake[0].x + 1, y: game.snake[0].y };
    assert.equal(game.step(), 'won'); assert.equal(game.run.outcome, 'success'); assert.equal(game.phase, 'won'); assert.equal(capture(game), null);
  }
});
test('failed challenge can restart with clean counters, queue and its same fixed rules', () => {
  const { game } = setup(); game.start('challenge', 120, 'maze', game.options); const id = game.run.id;
  game.snake = [{ x: 5, y: 4 }, { x: 4, y: 4 }]; assert.equal(game.step(), 'over'); assert.equal(game.run.outcome, 'collision');
  game.reset(); assert.notEqual(game.run.id, id); assert.equal(game.run.food, 0); assert.equal(game.run.steps, 0); assert.equal(game.score, 0); assert.deepEqual(game.queue, []); assert.equal(game.options.maze, 1);
});
test('mode snapshots reject expired time, spoofed challenge rules, inconsistent counters and IDs', () => {
  const { game } = setup('timeAttack'); const s = capture(game)!; assert.equal(s.version, 2); if (s.version !== 2) return;
  for (const run of [{ ...s.run, id: '__proto__' }, { ...s.run, elapsedMs: Infinity }, { ...s.run, elapsedMs: 120000 }, { ...s.run, steps: 100 }, { ...s.run, longest: 1 }]) assert.equal(validateSnapshot({ ...s, run }), null);
  game.start('challenge', 120, 'maze', game.options); const c = capture(game)!;
  assert.equal(validateSnapshot({ ...c, options: { ...game.options, maze: 0 } }), null);
  assert.equal(validateRun({}), null);
});
test('v0.5.2 snapshot migrates to Classic with a stable ID, preserving board and settings', () => {
  const old = new Game({ level: 8, maze: 2, walls: 'solid' }); old.reset(); old.score = 40; old.beat = 99;
  const legacy = capture(old)!; const a = setup('zen').game, b = setup('timeAttack').game;
  assert.ok(restore(a, legacy)); assert.ok(restore(b, legacy)); assert.equal(a.run.mode, 'classic'); assert.equal(a.run.id, b.run.id);
  assert.deepEqual(a.options, old.options); assert.deepEqual(a.snake, old.snake); assert.equal(a.score, 40); assert.equal(a.phase, 'paused'); assert.equal(capture(a)!.version, 2);
});
test('statistics checkpoints, repeated reloads and rolled-back snapshots do not double-count', () => {
  const p = store(), records = new Records(p), { game, time } = setup(); records.sync(game); records.sync(game);
  game.food = { x: 5, y: 8 }; game.step(); time(800); game.pause(); const snapshot = capture(game)!; records.sync(game);
  for (let n = 0; n < 10; n++) { const restored = setup().game; restore(restored, snapshot); new Records(p).sync(restored); }
  const data = new Records(p); assert.equal(data.total().games, 1); assert.equal(data.total().food, 1); assert.equal(data.total().points, 10); assert.equal(data.total().activeMs, 800); assert.equal(data.total().longest, 4);
  const rolledBack = { ...snapshot, score: 0 }; if (rolledBack.version === 2) { rolledBack.run = { ...rolledBack.run, food: 0, elapsedMs: 0 }; }
  restore(game, rolledBack); data.sync(game); assert.equal(data.total().points, 10); assert.equal(data.total().activeMs, 800);
});
test('terminal receipts prevent crash-window resurrection and repeated final accounting', () => { const p = store(), records = new Records(p), { game } = setup(); records.sync(game); game.over(); records.sync(game); records.sync(game); assert.equal(records.total().games, 1); assert.ok(records.isFinalized(game.run.id)); });
test('competitive scores are separate; Zen and challenges cannot overwrite Classic', () => {
  const p = store(); p.saveBest(110); const records = new Records(p);
  for (const duration of [60,120,180] as const) { const { game } = setup('timeAttack'); game.start('timeAttack', duration, 'hunter', game.options); game.score = duration; records.sync(game); }
  const zen = setup('zen').game; zen.score = 900; records.sync(zen); assert.equal(p.best(), 110);
  assert.deepEqual(records.data.timeBest, { '60': 60, '120': 120, '180': 180 }); assert.equal(records.best(zen.run), 0);
  const classic = setup().game; classic.score = 130; records.sync(classic); assert.equal(p.best(), 130);
});
test('challenge completion statuses persist independently and count unique challenges', () => {
  const p = store(), records = new Records(p);
  for (const id of ['hunter','survivor','maze','hunter'] as const) { const g = setup().game; g.start('challenge',120,id,g.options); g.run.outcome = 'success'; g.phase = 'won'; records.sync(g); }
  assert.equal(new Records(p).completedCount(), 3); assert.equal(records.data.modes.challenge.games, 4);
});
test('corrupt statistics and old preferences are sanitized without deleting old keys', () => {
  const p = store(); p.put('records_v1','{"version":99}'); p.saveBest(120); p.put('gameMode','unknown'); p.put('duration','-1');
  assert.equal(new Records(p).data.classicBest, 120); assert.equal(p.load().gameMode, 'classic'); assert.equal(p.load().duration, 120);
  assert.equal(parseRecords('{broken').version,1); assert.equal(parseRecords('{broken').modes.classic.games,0);
  p.save({ ...defaults, gameMode: 'zen', duration: 60 }); assert.equal(p.load().gameMode, 'zen'); assert.equal(p.best(),120);
});
test('mode navigation keeps Classic/Modern independent and exposes nontrivial challenge rules', () => {
  const m = new Menu(); m.select(); assert.deepEqual(m.items.map(i=>i.value), ['classic','zen','timeAttack','challenge']); m.move(2); m.select(); m.selectedMode = 'timeAttack'; assert.ok(m.items.some(i=>i.menu === 'duration'));
  m.selectedMode = 'challenge'; assert.ok(!m.items.some(i=>i.menu === 'maze' || i.menu === 'level')); assert.ok(m.items.some(i=>i.menu === 'challenge'));
});
