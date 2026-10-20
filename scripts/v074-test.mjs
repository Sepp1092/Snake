import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {perimeterFixture} from './edge-test.mjs';
import {assertFullscreenStack} from './fullscreen-stack.mjs';

function measure() {
  const rect=selector=>{const b=document.querySelector(selector).getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};
  const visible=selector=>Array.from(document.querySelectorAll(selector)).filter(e=>e.getBoundingClientRect().height>0).map(e=>{const b=e.getBoundingClientRect();return{id:e.id,x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};});
  const canvas=document.querySelector('canvas'),css=getComputedStyle(document.body);
  return{canvas:rect('canvas'),lcd:rect('.lcd'),phone:rect('.phone'),status:rect('.status'),controls:rect('.full-controls'),up:rect('.full-controls .up'),toolbar:rect('.toolbar'),
    keys:visible(document.body.classList.contains('full')?'.full-controls .key':'.keys .key'),buttons:visible('.toolbar button'),
    bitmap:[canvas.width,canvas.height],smoothing:canvas.getContext('2d').imageSmoothingEnabled,rendering:getComputedStyle(canvas).imageRendering,
    statusText:document.querySelector('.status').textContent,bottomInset:parseFloat(css.paddingBottom),scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]};
}
const state=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot')));
const settle=page=>page.clock.runFor(80);

export async function testV074({browser,check,frozenPage,modeFixture,layouts,engine='chrome'}) {
  const baseline=JSON.parse(await readFile('docs/screenshots/v074/before-metrics.json','utf8'));
  for(const [width,height] of [[320,568],[360,740],[390,844],[430,932],[844,390],[1366,768]]) {
    await check(`${engine} v0.7.4 connected fullscreen ${width}x${height}: LCD, status, arrows and handset preserved`,async()=>{
      for(const full of [false,true]) {
        const context=await browser.newContext({viewport:{width,height},isMobile:width<=960,hasTouch:true,reducedMotion:'reduce'});
        try {
          await context.addInitScript(full=>localStorage.setItem('snake3310_full',String(full)),full);
          const page=await frozenPage(context,perimeterFixture(modeFixture));const initial=await state(page);
          for(const active of [false,true]) {
            if(active)await page.locator('#pause').tap();
            const m=await page.evaluate(measure),old=baseline.find(b=>b.width===width&&b.full===full&&b.active===active);
            assert.deepEqual(m.bitmap,[320,244]);assert.equal(m.smoothing,false);assert.equal(m.rendering,'pixelated');
            assert.ok(Math.abs(m.canvas.width/m.canvas.height-320/244)<.001);
            assert.ok(m.canvas.width>=old.canvas.width-.5,'existing LCD size is retained within available geometry');
            assert.ok(m.scroll[0]<=width);if(full||width<=960)assert.ok(m.scroll[1]<=height+1);
            for(const box of [m.phone,m.canvas,...m.keys]) {
              assert.ok(box.x>=-.1&&box.y>=0&&box.right<=width+.1,JSON.stringify({width,height,full,box}));
              if(full||width<=960)assert.ok(box.bottom<=height+.1,JSON.stringify({width,height,full,box}));
            }
            for(const key of m.keys)assert.ok(key.width>=44&&key.height>=44);
            if(width<=960){assert.deepEqual(m.buttons.map(b=>b.id),['pause','menu','view','more']);assert.ok(m.buttons.every(b=>b.y===m.buttons[0].y&&b.width>=44&&b.height>=44));}
            if(full&&height>width&&width<=600) {
              assertFullscreenStack(m);assert.equal(m.up.y,m.controls.y);
              assert.ok(m.status.y>=m.lcd.bottom&&m.status.y-m.lcd.bottom<=4,'compact LCD-to-status line');
              assert.ok(Math.abs(m.up.x+m.up.width/2-width/2)<=.2,'centred up arrow');
              assert.ok(m.controls.y<old.controls.y-8,'controls move beside the status instead of the lower screen edge');
              assert.ok(m.controls.bottom<=height-m.bottomInset+.5);
              assert.ok(m.canvas.width>=width-14.5,'LCD uses width without discarding protected borders');
              if(active)assert.match(m.statusText,/Classic Snake.*Punkte: 0/);
            }
            if(!full){assert.ok(Math.abs(m.phone.width-old.phone.width)<=.5,'handset proportions unchanged');assert.ok(Math.abs(m.phone.height-old.phone.height)<=.5,'handset height unchanged, including the existing desktop document scroll');}
            const current=await state(page);assert.equal(current.run.id,initial.run.id);assert.deepEqual(current.snake,initial.snake);assert.equal(current.beat,initial.beat);
            layouts.push({v074:true,engine,width,height,full,active,...m});
          }
          await page.locator('#pause').tap();const paused=await state(page);
          await page.locator('#view').tap();await page.locator('#view').tap();await settle(page);
          assert.deepEqual(await state(page),paused);assert.equal(await page.locator('#lcd').getAttribute('data-phase'),'paused');
        } finally {await context.close();}
      }
    });
  }
  await check(`${engine} v0.7.4 dynamic height, safe areas and negative large-gap probes`,async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    try {
      await context.addInitScript(()=>{localStorage.setItem('snake3310_full','true');localStorage.setItem('snake3310_touchLayout','ergonomic');localStorage.setItem('snake3310_keySize','large');});
      const page=await frozenPage(context,modeFixture('timeAttack'));const initial=await state(page);
      for(const margin of ['auto','-24px']) {
        await page.locator('.full-controls').evaluate((e,margin)=>e.style.marginTop=margin,margin);
        const invalid=await page.evaluate(measure);assert.throws(()=>assertFullscreenStack(invalid),/must be 16–32px/);
        await page.locator('.full-controls').evaluate(e=>e.style.removeProperty('margin-top'));await settle(page);
        assertFullscreenStack(await page.evaluate(measure));
      }
      await page.evaluate(()=>{for(const [name,value]of Object.entries({top:24,bottom:34,left:12,right:12}))document.body.style.setProperty('--safe-'+name,value+'px');});
      for(const height of [640,740,568,844]) {
        await page.setViewportSize({width:390,height});await settle(page);const m=await page.evaluate(measure);
        assertFullscreenStack(m);assert.ok(m.toolbar.y>=24);assert.ok(m.canvas.x>=12);assert.ok(m.canvas.right<=378);
        assert.ok(m.controls.bottom<=height-34+.5);assert.ok(m.scroll[0]<=390&&m.scroll[1]<=height+1);
        assert.ok(m.keys.every(k=>k.height>=64&&k.width>=44));assert.deepEqual(await state(page),initial);
      }
      await page.setViewportSize({width:844,height:390});await settle(page);
      const landscape=await page.evaluate(measure);assert.ok(landscape.controls.x>=landscape.canvas.right);assert.ok(landscape.scroll[1]<=391);
      await page.setViewportSize({width:390,height:844});await settle(page);assertFullscreenStack(await page.evaluate(measure));assert.deepEqual(await state(page),initial);
    } finally {await context.close();}
  });
  await check(`${engine} v0.7.4 extremely short landscape keeps large game/menu controls reachable`,async()=>{
    const context=await browser.newContext({viewport:{width:568,height:220},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    try {
      await context.addInitScript(()=>{localStorage.setItem('snake3310_full','true');localStorage.setItem('snake3310_touchLayout','ergonomic');localStorage.setItem('snake3310_keySize','large');});
      const page=await frozenPage(context,modeFixture('classic'));const initial=await state(page);
      for(const menu of [false,true]) {
        if(menu)await page.locator('#menu').tap();const m=await page.evaluate(measure);
        assert.ok(m.scroll[0]<=568);assert.ok(m.controls.y>=m.toolbar.bottom,'no toolbar overlap');assert.ok(m.canvas.right<=m.controls.x,'no LCD overlap');
        for(const key of m.keys)assert.ok(key.height>=64&&key.width>=44&&key.bottom<=m.scroll[1]+.5);
        await page.locator('.full-controls .key:visible').last().scrollIntoViewIfNeeded();
        const last=await page.locator('.full-controls .key:visible').last().boundingBox();assert.ok(last.y>=0&&last.y+last.height<=220+.5);
      }
      assert.deepEqual(await state(page),initial);
    } finally {await context.close();}
  });
  await check(`${engine} v0.7.4 rapid touch turns, pause and view changes preserve the round`,async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    try {
      await context.addInitScript(()=>localStorage.setItem('snake3310_full','true'));
      const page=await frozenPage(context,modeFixture('classic'));const initial=await state(page);
      await page.locator('#pause').tap();await page.locator('.full-controls .up').tap();await page.locator('.full-controls .left').tap();
      await page.clock.runFor(420);
      // Saves are checkpoints, not a live engine API; pause flushes the two completed steps.
      await page.locator('#pause').tap();const held=await state(page);
      assert.deepEqual(held.dir,{x:-1,y:0});assert.equal(held.beat,initial.beat+2);
      assert.deepEqual(held.snake[0],{x:initial.snake[0].x-1,y:initial.snake[0].y-1});
      await page.locator('#view').tap();await page.locator('#view').tap();assert.deepEqual(await state(page),held);
      await page.locator('#pause').tap();assert.equal(await page.locator('#lcd').getAttribute('data-phase'),'playing');
      await page.locator('.full-controls .right').tap();await page.clock.runFor(240);
      await page.locator('#pause').tap();
      const next=await state(page);assert.deepEqual(next.dir,{x:-1,y:0},'illegal reversal still rejected');
      assert.equal(next.beat,initial.beat+3);assert.equal(next.run.id,initial.run.id);
    } finally {await context.close();}
  });
}
