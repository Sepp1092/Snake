import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {perimeterFixture} from './edge-test.mjs';

export async function testV072({browser,check,frozenPage,modeFixture,layouts,engine='chrome'}) {
  const baseline=JSON.parse(await readFile('docs/screenshots/v072/before-metrics.json','utf8'));
  for(const[width,height]of[[320,568],[360,740],[390,844],[430,932],[844,390],[1366,768]]) {
    await check(`${engine} v0.7.2 toolbar/LCD/controls ${width}x${height}: both profiles and views`,async()=>{
      for(const profile of ['classic','modern'])for(const full of [false,true]) {
        const c=await browser.newContext({viewport:{width,height},isMobile:width<=960,hasTouch:true,reducedMotion:'reduce'});
        await c.addInitScript(s=>{for(const[k,v]of Object.entries(s))localStorage.setItem('snake3310_'+k,String(v));},{profile,full});
        const p=await frozenPage(c,perimeterFixture(modeFixture));await p.locator('#pause').tap();
        const m=await p.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};return{
          toolbar:r(document.querySelector('.toolbar')),canvas:r(document.querySelector('canvas')),phone:r(document.querySelector('.phone')),controls:r(document.querySelector('.full-controls')),
          buttons:Array.from(document.querySelectorAll('.toolbar button')).filter(e=>e.getBoundingClientRect().height).map(e=>({id:e.id,...r(e),client:e.clientWidth,scroll:e.scrollWidth})).sort((a,b)=>a.x-b.x),
          keys:Array.from(document.querySelectorAll(document.body.classList.contains('full')?'.full-controls .key':'.keys .key')).filter(e=>e.getBoundingClientRect().height).map(r),
          scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]};});
        const old=baseline.find(b=>b.width===width&&b.profile===profile&&b.full===full&&b.active);
        assert.ok(m.scroll[0]<=width);
        if(width<=960){assert.deepEqual(m.buttons.map(b=>b.id),['pause','menu','view','more']);assert.equal(m.toolbar.height,44);
          for(const b of m.buttons){assert.equal(b.y,m.buttons[0].y);assert.ok(b.width>=44&&b.height>=44&&b.scroll<=b.client+1);}
          assert.ok(m.scroll[1]<=height+1);for(const b of[m.phone,m.canvas,...m.keys])assert.ok(b.x>=0&&b.y>=0&&b.right<=width+.2&&b.bottom<=height+.2,JSON.stringify({width,height,profile,full,b}));
          for(const k of m.keys)assert.ok(k.width>=44&&k.height>=44);
          if(full){assert.ok(m.canvas.width>old.canvas.width+.5,`${profile} ${width} LCD must grow`);assert.ok(m.controls.y>old.controls.y+2,`${profile} ${width} controls must move down: ${m.controls.y} <= ${old.controls.y}`);}
          else assert.ok(m.canvas.width>=old.canvas.width-.5,'handset LCD must not shrink');
          await p.locator('#pause').focus();for(const id of ['menu','view','more']){await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),id,'toolbar Tab order follows the visual order');}
          const before=await p.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot')));
          await p.locator('#more').tap();assert.equal(await p.locator('#lcd').getAttribute('data-phase'),'paused');
          for(const id of['more-restart','more-profile','more-sound','more-settings','more-close'])assert.equal(await p.locator('#'+id).count(),1);
          await p.locator('#more-close').tap();await p.waitForFunction(()=>document.querySelector('#lcd').dataset.phase==='playing');
          const after=await p.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot')));for(const key of['snake','dir','score','beat','food','bonus'])assert.deepEqual(after[key],before[key]);assert.equal(after.run.id,before.run.id);
          if(width===390)await p.screenshot({path:`test-results/v072-${engine}-${profile}-${full?'full':'handheld'}-active.png`,fullPage:true});
        }else {assert.ok(m.buttons.length>=6,'desktop keeps full toolbar');if(full)assert.ok(m.scroll[1]<=height+1);}
        layouts.push({v072:true,engine,width,height,profile,full,...m});await c.close();
      }
    });
  }
  for(const profile of ['classic','modern'])for(const full of [false,true]) {
    await check(`${engine} v0.7.2 More ${profile}/${full?'full':'handset'}: state, queue, touch, mouse, keyboard, controller, settings and restart`,async()=>{
      const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
      await c.addInitScript(s=>{
        for(const[k,v]of Object.entries(s))localStorage.setItem('snake3310_'+k,String(v));
        window.testPad=null;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.testPad?[window.testPad]:[]});
      },{profile,full});
      const p=await frozenPage(c,modeFixture('timeAttack',120));await p.bringToFront();
      const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot')));
      const initial=await state();await p.locator('#pause').tap();await p.evaluate(()=>document.activeElement?.blur());
      await p.keyboard.press('ArrowUp');await p.keyboard.press('ArrowLeft');
      await p.locator('#more').tap();await p.clock.runFor(6000);const held=await state();
      assert.equal(held.run.id,initial.run.id);assert.deepEqual(held.snake,initial.snake);assert.equal(held.beat,initial.beat);assert.equal(await p.locator('#lcd').getAttribute('data-phase'),'paused');
      const sound=await p.locator('#more-sound').getAttribute('aria-pressed');await p.locator('#more-sound').tap();assert.notEqual(await p.locator('#more-sound').getAttribute('aria-pressed'),sound);await p.locator('#more-sound').tap();
      assert.equal(await p.locator('#more-sound').getAttribute('aria-pressed'),await p.locator('#sound').getAttribute('aria-pressed'));
      await p.locator('#more-profile').click();assert.equal(await p.locator('#more-panel').isVisible(),true);assert.equal(await p.locator('#more-profile').getAttribute('aria-pressed'),await p.locator('#profile').getAttribute('aria-pressed'));
      await p.locator('#more-profile').click();assert.equal(await p.locator('body').evaluate(b=>b.classList.contains('modern')),profile==='modern');
      await p.screenshot({path:`test-results/v072-${engine}-more-${profile}-${full?'full':'handheld'}.png`,fullPage:true});
      await p.keyboard.press('Home');assert.equal(await p.evaluate(()=>document.activeElement.id),'more-restart');await p.keyboard.press('ArrowDown');assert.equal(await p.evaluate(()=>document.activeElement.id),'more-profile');await p.keyboard.press('End');assert.equal(await p.evaluate(()=>document.activeElement.id),'more-close');
      await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('#lcd').dataset.phase==='playing');
      await p.clock.runFor(440);await p.locator('#pause').tap();const moved=await state();assert.equal(moved.run.id,initial.run.id);assert.equal(moved.beat,initial.beat+2);assert.deepEqual(moved.snake[0],{x:3,y:7});assert.ok(moved.run.elapsedMs<600,'time in More is excluded');
      // Paused sessions remain paused after native Escape and after a controller B press.
      await p.locator('#more').focus();await p.keyboard.press('Enter');await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('#more-panel').open);assert.equal(await p.locator('#lcd').getAttribute('data-phase'),'paused');
      await p.locator('#more').tap();await p.evaluate(()=>window.testPad={index:0,id:'standard-v072',mapping:'standard',connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))});await p.clock.runFor(32);
      await p.evaluate(()=>window.testPad.buttons[1].pressed=true);await p.clock.runFor(32);await p.evaluate(()=>window.testPad.buttons[1].pressed=false);await p.clock.runFor(32);assert.equal(await p.locator('#more-panel').isVisible(),false);assert.equal(await p.locator('#lcd').getAttribute('data-phase'),'paused');
      await p.locator('#more').tap();await p.locator('#more-settings').tap();assert.equal(await p.locator('.lcd-top strong').textContent(),'Einstellungen');await p.evaluate(()=>document.activeElement?.blur());for(let i=0;i<8;i++)await p.keyboard.press('ArrowDown');assert.match(await p.locator('.menu-item.selected').textContent(),/Touch-Layout/);await p.keyboard.press('Enter');assert.equal(await p.locator('.lcd-top strong').textContent(),'Touch-Layout');await p.keyboard.press('Escape');await p.keyboard.press('Escape');await p.keyboard.press('Escape');
      await p.locator('#more').tap();await p.locator('#more-restart').tap();assert.equal(await p.locator('#confirm').isVisible(),true);await p.locator('#confirm-no').tap();assert.equal((await state()).run.id,initial.run.id);
      await p.locator('#more').tap();await p.locator('#more-restart').tap();await p.locator('#confirm-yes').tap();assert.notEqual((await state()).run.id,initial.run.id);assert.equal(await p.locator('#lcd').getAttribute('data-phase'),'playing');
      // A background pause cancels transient auto-resume, as it does elsewhere in the app.
      await p.locator('#more').tap();await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.locator('#more-close').tap();await p.waitForFunction(()=>!document.querySelector('#more-panel').open);assert.equal(await p.locator('#lcd').getAttribute('data-phase'),'paused');
      assert.equal(await p.evaluate(()=>scrollY),0);await c.close();
    });
  }
  await check(`${engine} v0.7.2 compact toolbar, More and saved round survive offline reload on 320px`,async()=>{
    const c=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    await c.addInitScript(()=>localStorage.setItem('snake3310_full','true'));const p=await frozenPage(c,modeFixture('classic'));const before=await p.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot')));
    await p.evaluate(async()=>navigator.serviceWorker.ready);await p.reload();await p.clock.runFor(1800);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await p.clock.runFor(1800);
    await p.locator('#more').tap();await p.locator('#more-profile').tap();await p.locator('#more-sound').tap();await p.locator('#more-close').tap();await p.waitForFunction(()=>!document.querySelector('#more-panel').open);
    assert.equal(await p.locator('#lcd').getAttribute('data-phase'),'paused');const after=await p.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot')));assert.deepEqual(after,before);
    await p.locator('#pause').tap();await p.clock.runFor(220);await p.locator('#pause').tap();assert.ok((await p.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot')))).beat>before.beat);await c.setOffline(false);await c.close();
  });
}
