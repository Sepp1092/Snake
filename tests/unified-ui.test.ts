import test from 'node:test';
import assert from 'node:assert/strict';
import { Persistence, defaults } from '../src/storage.ts';
import { GameSession } from '../src/modes.ts';
import { capture } from '../src/snapshot.ts';
import { emptyRecords, Records } from '../src/records.ts';
import { Achievements } from '../src/achievements.ts';
import { Menu, menus } from '../src/menu.ts';

for (const legacy of ['classic', 'modern', 'unknown']) {
  test(`retired ${legacy} profile cannot alter settings or destroy saved progress`, () => {
    const values = new Map<string,string>();
    const store = { getItem: (k:string) => values.get(k) ?? null, setItem: (k:string,v:string) => { values.set(k,v); } };
    const p = new Persistence(store);
    p.put('profile', legacy);
    const game = new GameSession({ level:5, maze:0, walls:'wrap' });
    game.start('timeAttack',180,'hunter',game.options); game.pause();
    const round = capture(game)!;
    p.saveSnapshot(round); p.saveBest(320);
    const records = emptyRecords(); records.classicBest = 320; records.timeBest['60'] = 150; records.completed.hunter = true;
    p.put('records_v1',JSON.stringify(records));
    p.put('achievements_v1',JSON.stringify({version:1,unlocked:{'first-bite':123,'getting-started':456}}));
    const prefs = {...defaults,level:5,full:true,lcd:'amber' as const,keySize:'large' as const,vibration:true};
    p.save(prefs);
    assert.deepEqual(p.load(),prefs);
    assert.equal('profile' in p.load(),false);
    assert.equal(p.get('profile'),legacy);
    assert.deepEqual(p.loadSnapshot(),round);
    assert.equal(p.best(),320);
    assert.deepEqual(new Records(p).data,records);
    assert.deepEqual(new Achievements(p).unlocked,{'first-bite':123,'getting-started':456});
  });
}

test('unified menu removes only presentation choice and retains all four game modes and comfort settings', () => {
  assert.deepEqual(menus.games.map(i=>i.value),['classic','zen','timeAttack','challenge']);
  assert.ok(menus.games.some(i=>i.label==='Classic Snake'));
  assert.equal(menus.settings.some(i=>String(i.menu)==='profile'),false);
  const menu = new Menu(); menu.select();
  assert.equal(menu.items.length,4);
  const settings = menus.settings.map(i=>i.menu ?? i.action);
  for(const id of ['sound','lcd','control','walls','view','volume','vibration','touchLayout','keySize','controller','achievements','showControls']) {
    if(id==='achievements') assert.ok(menus.main.some(i=>i.menu===id));
    else assert.ok(settings.includes(id));
  }
});
