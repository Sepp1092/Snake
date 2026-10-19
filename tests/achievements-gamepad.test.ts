import test from 'node:test';
import assert from 'node:assert/strict';
import { Achievements, achievements, parseAchievements } from '../src/achievements.ts';
import { emptyRecords, Records } from '../src/records.ts';
import { Persistence, defaults } from '../src/storage.ts';
import { GameSession } from '../src/modes.ts';
import { GamepadInput, type Pad } from '../src/gamepad.ts';
import { directions } from '../src/engine.ts';
const store = () => { const values = new Map<string,string>(); return { get: (k: string) => values.get(k) ?? null, put: (k: string, v: string) => { values.set(k,v); } }; };
function game(mode: 'classic' | 'zen' | 'timeAttack' | 'challenge' = 'classic') {
  const g = new GameSession({ level:3, maze:0, walls:'wrap' }, () => .8, () => 0); g.start(mode,60,'hunter',g.options); return g;
}
const pad = (): Pad => ({ index:0, id:'test-pad', connected:true, mapping:'standard', axes:[0,0], buttons:Array.from({length:16},()=>({pressed:false,value:0})) });

test('all twelve achievements have unique IDs, descriptions and valid distinct pixel icons', () => {
  assert.equal(achievements.length,12); assert.equal(new Set(achievements.map(a=>a.id)).size,12);
  assert.equal(new Set(achievements.map(a=>a.icon.join(''))).size,12);
  for (const a of achievements) { assert.ok(a.name && a.description); assert.equal(a.icon.length,5); assert.ok(a.icon.every(r=>/^[01]{5}$/.test(r))); }
});
test('provable historic food, Classic scores, length, time, Zen session and TA60 records unlock independently', () => {
  const data=emptyRecords(), s=store(), a=new Achievements(s,()=>42);
  data.classicBest=1000; data.modes.classic.food=100; data.modes.zen.longest=20; data.modes.zen.activeMs=3600000;
  data.timeBest['60']=150; data.completed={hunter:true,survivor:true,maze:true};
  data.receipts['zen-proof']={mode:'zen',elapsedMs:600000,food:0,points:0,longest:3,collisions:9,done:false};
  const unlocked=a.evaluate(data); assert.equal(unlocked.length,11); assert.ok(!unlocked.includes('perfect-run'));
  assert.deepEqual(a.evaluate(data),[]); const restarted=new Achievements(s); assert.equal(restarted.count(),11); assert.deepEqual(restarted.evaluate(data),[]);
});
test('insufficient history never invents food, perfect runs, a long Zen session or TA60 from other durations', () => {
  const data=emptyRecords(); data.classicBest=100; data.modes.zen.points=10000; data.modes.zen.activeMs=600000;
  data.timeBest['120']=1000; data.completed.hunter=true;
  for(let i=0;i<10;i++) data.receipts[`zen-${i}`]={mode:'zen',elapsedMs:60000,food:0,points:0,longest:3,collisions:0,done:true};
  const a=new Achievements(store()); assert.deepEqual(a.evaluate(data).sort(),['challenge-beginner','getting-started'].sort());
});
test('Zen cannot grant competitive Classic achievements, even after reload and repeated checkpoints', () => {
  const s=store(), records=new Records(s), g=game('zen'); g.score=1000; g.run.food=1; records.sync(g);
  const a=new Achievements(s); assert.deepEqual(a.evaluate(records.data,g),['first-bite']);
  for(let i=0;i<4;i++){ records.sync(g); assert.deepEqual(new Achievements(s).evaluate(records.data,g),[]); }
  assert.equal(records.data.classicBest,0);
});
test('Perfect Run requires an observed successful collision-free challenge; completed history alone is insufficient', () => {
  const a=new Achievements(store()), data=emptyRecords(), g=game('challenge');
  data.completed.hunter=true; a.evaluate(data); assert.equal(a.unlocked['perfect-run'],undefined);
  g.run.outcome='collision'; assert.deepEqual(a.evaluate(data,g),[]);
  g.run.outcome='success'; g.run.collisions=1; assert.deepEqual(a.evaluate(data,g),[]);
  g.run.collisions=0; assert.deepEqual(a.evaluate(data,g),['perfect-run']); assert.deepEqual(a.evaluate(data,g),[]);
});
test('corrupt achievement data is bounded and sanitized without accepting unknown or prototype keys', () => {
  for(const raw of [null,'null','[]','{broken','{"version":2}','x'.repeat(10001),'{"version":1,"unlocked":[]}']) assert.deepEqual(parseAchievements(raw),{});
  assert.deepEqual(parseAchievements('{"version":1,"unlocked":{"first-bite":0,"snake-master":-1,"pixel-legend":"yes","__proto__":7,"unknown":42}}'),{'first-bite':0});
});
test('v0.7 preferences retain old values, have conservative defaults, sanitize and roundtrip', () => {
  const m=new Map<string,string>([['snake3310_best','500'],['snake3310_level','9'],['snake3310_touchLayout','invalid']]);
  const p=new Persistence({getItem:k=>m.get(k)??null,setItem:(k,v)=>{m.set(k,v);}});
  const old=p.load(); assert.equal(old.touchLayout,'standard'); assert.equal(old.keySize,'normal'); assert.equal(old.controller,true); assert.equal(old.achievementNotifications,true); assert.equal(p.best(),500);
  const changed={...defaults,touchLayout:'ergonomic' as const,keySize:'large' as const,controller:false,achievementNotifications:false,showControls:false}; p.save(changed); assert.deepEqual(p.load(),changed); assert.equal(p.best(),500);
});
test('Gamepad API unsupported, denied, disconnected and nonstandard cases are safe', () => {
  const input=new GamepadInput(); assert.equal(input.poll(undefined).supported,false); assert.equal(input.poll(()=>{throw Error('denied');}).supported,false);
  assert.equal(input.poll(()=>[]).connected,0); const p=pad(); p.mapping=''; assert.deepEqual(input.poll(()=>[p]).actions,[]); p.connected=false; assert.equal(input.poll(()=>[p]).connected,0);
});
test('D-pad and buttons emit one rising edge, release rearms, disconnect clears state', () => {
  const input=new GamepadInput(), p=pad(); p.buttons[12].pressed=true;
  assert.deepEqual(input.poll(()=>[p]).actions,['up']); for(let i=0;i<100;i++) assert.deepEqual(input.poll(()=>[p]).actions,[]);
  p.buttons[12].pressed=false; input.poll(()=>[p]); p.buttons[0].pressed=true; p.buttons[1].pressed=true; p.buttons[9].pressed=true;
  assert.deepEqual(input.poll(()=>[p]).actions,['ok','back','pause']); assert.equal(input.poll(()=>[]).connected,0);
  p.buttons[0].pressed=false; p.buttons[1].pressed=false; p.buttons[9].pressed=false; input.poll(()=>[p]); p.buttons[15].pressed=true; assert.deepEqual(input.poll(()=>[p]).actions,['right']);
});
test('analog deadzone and hysteresis ignore jitter, select one dominant axis and do not repeat', () => {
  const input=new GamepadInput(), p=pad(); p.axes=[.3,-.3]; assert.deepEqual(input.poll(()=>[p]).actions,[]);
  p.axes=[.8,-.6]; assert.deepEqual(input.poll(()=>[p]).actions,['right']); p.axes=[.4,0]; assert.deepEqual(input.poll(()=>[p]).actions,[]);
  p.axes=[0,0]; input.poll(()=>[p]); p.axes=[0,-.9]; assert.deepEqual(input.poll(()=>[p]).actions,['up']);
  p.buttons[14].pressed=true; assert.deepEqual(input.poll(()=>[p]).actions,['left']);
});
test('disabled/background polling observes held controls without issuing stale edges on resume', () => {
  const input=new GamepadInput(), p=pad(); p.buttons[0].pressed=true;
  assert.deepEqual(input.poll(()=>[p],false).actions,[]); assert.deepEqual(input.poll(()=>[p],true).actions,[]);
  p.buttons[0].pressed=false; input.poll(()=>[p]); p.buttons[9].pressed=true;
  assert.deepEqual(input.poll(()=>[p],true,false).actions,[]); assert.deepEqual(input.poll(()=>[p],true,true).actions,[]);
});
test('shared Snake buffer rejects reverse, duplicates and excess actions across input sources', () => {
  const input=new GamepadInput(), p=pad(), g=game();
  p.buttons[14].pressed=true; for(const a of input.poll(()=>[p]).actions) if(a in directions)g.turn(directions[a as keyof typeof directions]); assert.equal(g.queue.length,0);
  p.buttons[14].pressed=false; p.buttons[12].pressed=true; for(const a of input.poll(()=>[p]).actions) if(a in directions)g.turn(directions[a as keyof typeof directions]);
  g.turn(directions.up); g.turn(directions.left); g.turn(directions.down); assert.equal(g.queue.length,2);
  g.step(); assert.deepEqual(g.dir,directions.up); g.step(); assert.deepEqual(g.dir,directions.left);
});
test('a controller pressed while the tab was suspended must return to neutral before acting', () => {
  const input=new GamepadInput(), p=pad(); input.poll(()=>[p]); input.suspend();
  p.buttons[9].pressed=true; assert.deepEqual(input.poll(()=>[p]).actions,[]);
  p.buttons[9].pressed=false; input.poll(()=>[p]); p.buttons[9].pressed=true;
  assert.deepEqual(input.poll(()=>[p]).actions,['pause']);
});
