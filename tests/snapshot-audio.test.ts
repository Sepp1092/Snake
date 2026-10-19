import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, directions as d } from '../src/engine.ts';
import { capture, restore, validateSnapshot } from '../src/snapshot.ts';
import { Persistence, defaults } from '../src/storage.ts';
import { RetroAudio, vibrate } from '../src/audio.ts';
const game = () => { const g = new Game({ level: 7, maze: 1, walls: 'wrap' }, () => .9); g.reset(); return g; };
const store = () => { const map = new Map<string, string>(); return { map, getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v); }, removeItem: (k: string) => { map.delete(k); } }; };
test('snapshot roundtrip preserves current rules, progress, food and bonus but always pauses', () => {
  const g = game(); g.turn(d.up); g.step(); g.bonus = { x: 24, y: 16 }; g.bonusSteps = 42; g.score = 50;
  g.turn(d.left); const s = capture(g)!; assert.equal(s.version, 1); assert.equal(s.gameMode, 'snake2');
  const restored = new Game({ level: 1, maze: 0, walls: 'solid' }); restored.turn(d.up);
  assert.equal(restore(restored, s), true); assert.equal(restored.phase, 'paused'); assert.deepEqual(restored.queue, []);
  assert.deepEqual(capture(restored), s); assert.equal(restored.step(), null);
  restored.resume(); restored.step(); assert.equal(restored.snake[0].y, g.snake[0].y - 1);
  assert.equal(restored.best, 50);
});
test('snapshot is an independent deep copy of the live game', () => { const g = game(); const s = capture(g)!; g.snake[0].x++; g.options.level = 1; assert.equal(s.snake[0].x, 4); assert.equal(s.options.level, 7); });
test('completed or never started games cannot be captured', () => { const g = game(); for (const phase of ['ready', 'over', 'won'] as const) { g.phase = phase; assert.equal(capture(g), null); } });
test('invalid snapshot shapes, versions, modes and phases are rejected without mutations', () => {
  const s = capture(game())!;
  for (const bad of [null, [], {}, { ...s, version: 0 }, { ...s, version: 2 }, { ...s, gameMode: 'other' }, { ...s, phase: 'playing' }, { ...s, phase: 'over' }, { ...s, score: NaN }, { ...s, beat: -1 }, { ...s, options: { ...s.options, level: 10 } }, { ...s, dir: { x: 1, y: 1 } }]) {
    const g = game(), before = capture(g); assert.equal(restore(g, bad), false); assert.deepEqual(capture(g), before);
  }
});
test('out-of-bounds, duplicate, disconnected, reversed and obstructed snake cells are rejected', () => {
  const s = capture(game())!;
  for (const snake of [[{ x: 26, y: 8 }, { x: 25, y: 8 }], [{ x: 4, y: 8 }, { x: 4, y: 8 }], [{ x: 4, y: 8 }, { x: 2, y: 8 }], [{ x: 3, y: 8 }, { x: 4, y: 8 }], [{ x: 7, y: 4 }, { x: 6, y: 4 }]]) assert.equal(validateSnapshot({ ...s, snake }), null);
});
test('food and bonus cannot overlap body, walls or each other; bonus timer is validated', () => {
  const s = capture(game())!;
  for (const bad of [{ ...s, food: s.snake[0] }, { ...s, food: { x: 6, y: 4 } }, { ...s, bonus: s.food, bonusSteps: 5 }, { ...s, bonus: null, bonusSteps: 5 }, { ...s, bonus: { x: 24, y: 16 }, bonusSteps: 0 }, { ...s, food: null }]) assert.equal(validateSnapshot(bad), null);
});
test('wrapping bodies restore; same coordinates are rejected for solid borders', () => {
  const s = capture(game())!; s.snake = [{ x: 0, y: 1 }, { x: 25, y: 1 }];
  assert.ok(validateSnapshot(s)); s.options.walls = 'solid'; assert.equal(validateSnapshot(s), null);
});
test('all maze starts and expired bonus state produce valid snapshots', () => {
  for (const maze of [0, 1, 2]) { const g = game(); g.options.maze = maze; g.reset(); assert.ok(validateSnapshot(capture(g))); }
  const g = game(); g.bonus = { x: 24, y: 16 }; g.bonusSteps = 1; g.step(); assert.equal(g.bonusSteps, 0); assert.ok(validateSnapshot(capture(g)));
});
test('persist and clear round without touching best, stats or settings', () => {
  const s = store(), p = new Persistence(s); p.saveBest(90); p.put('statistics', '{"played":4}');
  p.saveSnapshot(capture(game())!); const snapshot = p.loadSnapshot(); p.save(defaults);
  assert.deepEqual(p.loadSnapshot(), snapshot); assert.equal(p.best(), 90); assert.equal(p.get('statistics'), '{"played":4}');
  p.clearSnapshot(); assert.equal(p.loadSnapshot(), null); assert.equal(p.best(), 90);
});
test('corrupt JSON, incompatible and oversized saves safely disappear', () => {
  const s = store(), p = new Persistence(s);
  for (const raw of ['{oops', JSON.stringify({ ...capture(game()), version: 99 }), 'x'.repeat(24001)]) {
    p.put('snapshot', raw); assert.equal(p.loadSnapshot(), null); assert.equal(p.get('snapshot'), null);
  }
});
test('snapshot storage denial cannot throw', () => {
  const p = new Persistence({ getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } });
  assert.doesNotThrow(() => p.saveSnapshot(capture(game())!)); assert.equal(p.loadSnapshot(), null); assert.doesNotThrow(() => p.clearSnapshot());
});
test('v0.4 preferences migrate with conservative comfort defaults; invalid new settings sanitized', () => {
  const s = store(), p = new Persistence(s); p.put('full', 'true'); p.put('lcd', 'amber'); p.put('best', '200');
  assert.deepEqual(p.load(), { ...defaults, full: true, lcd: 'amber' });
  p.put('volume', '99'); p.put('profile', 'unknown'); assert.equal(p.load().volume, 2); assert.equal('profile' in p.load(), false); assert.equal(p.get('profile'), 'unknown');
  const settings = { ...defaults, full: false, lcd: 'dark' as const, vibration: true, volume: 4 }; p.save(settings);
  assert.deepEqual(p.load(), settings); assert.equal(p.best(), 200);
});
test('missing audio and missing, denied or disabled vibration never interrupt play', () => {
  const audio = new RetroAudio();
  for (const event of ['menu', 'start', 'pause', 'eat', 'bonus', 'over', 'record'] as const) assert.doesNotThrow(() => audio.signal(true, 2, event));
  assert.doesNotThrow(() => audio.signal(false, 4, 'record')); assert.doesNotThrow(() => audio.signal(true, 0, 'record'));
  assert.doesNotThrow(() => vibrate(true, 'eat', {})); assert.doesNotThrow(() => vibrate(true, 'eat', { vibrate() { throw Error(); } }));
  let count = 0; const target = { vibrate() { count++; return false; } }; vibrate(false, 'over', target); assert.equal(count, 0); vibrate(true, 'over', target); assert.equal(count, 1);
});
