import {assertFullscreenStack} from './fullscreen-stack.mjs';
import { toolbarAction } from './toolbar-action.mjs';
import assert from 'node:assert/strict';
import { emptyRecords } from '../src/records.ts';
import { perimeterFixture } from './edge-test.mjs';

export async function testV07({ browser, check, frozenPage, modeFixture, layouts, engine = 'chrome' }) {
  await check(`${engine} v0.7 achievements: live unlock, nonblocking toast, detail, persistence and offline reload`, async () => {
    const context = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, reducedMotion:'reduce' });
    await context.addInitScript(() => { localStorage.setItem('snake3310_profile','modern'); localStorage.setItem('snake3310_full','true'); });
    const seed=modeFixture('classic'); seed.food={x:5,y:8};
    const page=await frozenPage(context,seed);
    await page.locator('#pause').tap(); await page.clock.runFor(220);
    const unlocked=await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_achievements_v1')));
    assert.ok(unlocked.unlocked['first-bite']);
    assert.match(await page.locator('#achievement-toast').textContent(),/First Bite/);
    await page.clock.runFor(440); await page.locator('#pause').tap();
    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot'))); assert.ok(before.beat>=3);
    await page.locator('#menu').tap(); await page.locator('.menu-item').filter({hasText:'Achievements'}).tap();
    assert.match(await page.locator('.lcd-top').textContent(),/1\/12/);
    await page.screenshot({path:`test-results/v07-${engine}-achievements.png`,fullPage:true});
    await page.locator('.menu-item').filter({hasText:'First Bite'}).tap();
    assert.match(await page.locator('#achievement-description').textContent(),/erstes Futter/); await page.locator('#achievement-close').tap();
    await page.evaluate(async()=>navigator.serviceWorker.ready); await page.reload(); await page.clock.runFor(1800);
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller); await context.setOffline(true); await page.reload(); await page.clock.runFor(1800);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_achievements_v1'))),unlocked);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot'))),before);
    assert.equal(await page.locator('#achievement-toast').isVisible(),false); await context.setOffline(false); await context.close();
    const classic=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const small=await frozenPage(classic);await small.locator('#menu').tap();await small.evaluate(()=>document.activeElement?.blur());await small.keyboard.press('ArrowUp');await small.keyboard.press('Enter');
    await small.keyboard.press('ArrowUp');assert.match(await small.locator('.menu-item.selected').textContent(),/Perfect Run/);
    const selected=await small.locator('.menu-item.selected').boundingBox(),lcd=await small.locator('#lcd').boundingBox();
    assert.ok(selected.y>=lcd.y&&selected.y+selected.height<=lcd.y+lcd.height);
    await small.keyboard.press('Enter');assert.equal(await small.locator('#achievement-detail').isVisible(),true);await classic.close();
  });
  await check(`${engine} v0.7 historical proof, corrupt unlock data, notification opt-out and no fabricated perfect run`, async () => {
    const context=await browser.newContext(); const records=emptyRecords(); records.classicBest=500; records.modes.classic.food=100; records.completed.hunter=true;
    await context.addInitScript(records=>{
      if(sessionStorage.getItem('v07-proof'))return;
      localStorage.setItem('snake3310_records_v1',JSON.stringify(records)); localStorage.setItem('snake3310_achievements_v1','{bad');
      localStorage.setItem('snake3310_achievementNotifications','false'); sessionStorage.setItem('v07-proof','true');
    },records);
    const seed=modeFixture('classic'); seed.food={x:5,y:8}; const page=await frozenPage(context,seed);
    const initial=await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_achievements_v1')).unlocked);
    assert.ok(initial['snake-master']&&initial['first-bite']&&initial['food-collector']&&initial['challenge-beginner']); assert.equal(initial['perfect-run'],undefined);
    await toolbarAction(page, 'resume', false); await page.clock.runFor(220); assert.equal(await page.locator('#achievement-toast').isVisible(),false);
    for(let i=0;i<2;i++){await page.reload();await page.clock.runFor(1800);}
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_achievements_v1')).unlocked),initial); await context.close();
  });
  await check(`${engine} v0.7 simulated controller: connection, menus, stick, hold, mixed input, pause, dialogs and disconnect`, async () => {
    const context=await browser.newContext();
    await context.addInitScript(()=>{
      window.testPad=null;
      Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.testPad?[window.testPad]:[]});
    });
    const page=await frozenPage(context); await page.bringToFront();
    await page.evaluate(()=>{window.testPad={index:0,id:'simulated-standard',mapping:'standard',connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};});
    await page.clock.runFor(32); assert.match(await page.locator('#controller-status').textContent(),/verbunden/);
    const button=async i=>{await page.evaluate(i=>window.testPad.buttons[i].pressed=true,i);await page.clock.runFor(32);await page.evaluate(i=>window.testPad.buttons[i].pressed=false,i);await page.clock.runFor(32);};
    for(let i=0;i<4;i++)await button(0); // standby → main → games → Classic → new
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'),'playing');
    await button(9); assert.equal(await page.locator('#lcd').getAttribute('data-phase'),'paused');
    // Deadzone does not move menu selection; a held stick moves it only once.
    await page.locator('#menu').click();
    await page.evaluate(()=>window.testPad.axes=[0,.3]); await page.clock.runFor(64); assert.match(await page.locator('.menu-item.selected').textContent(),/Spiele/);
    await page.evaluate(()=>window.testPad.axes=[0,.9]); await page.clock.runFor(64); assert.match(await page.locator('.menu-item.selected').textContent(),/Einstellungen/);
    await page.clock.runFor(500); assert.match(await page.locator('.menu-item.selected').textContent(),/Einstellungen/);
    await page.evaluate(()=>window.testPad.axes=[0,0]); await page.clock.runFor(32);
    await button(1); await button(9); assert.equal(await page.locator('#lcd').getAttribute('data-phase'),'playing');
    await page.evaluate(()=>window.testPad.buttons[12].pressed=true); await page.clock.runFor(32);
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowLeft');
    await page.clock.runFor(400); await button(9);
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot'))); assert.ok(state.beat>0);
    assert.deepEqual(state.dir,{x:-1,y:0}); // two-turn queue, duplicate up did not consume a slot
    await toolbarAction(page, 'start', false); assert.equal(await page.locator('#confirm').isVisible(),true);
    await button(1); assert.equal(await page.locator('#confirm').isVisible(),false);
    await button(9); assert.equal(await page.locator('#lcd').getAttribute('data-phase'),'playing');
    await page.evaluate(()=>window.testPad=null); await page.clock.runFor(32); assert.match(await page.locator('#controller-status').textContent(),/Kein Controller/);
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'),'playing');
    await page.keyboard.press('ArrowUp'); await page.clock.runFor(220); await page.locator('#pause').click();
    assert.deepEqual((await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot')))).dir,{x:0,y:-1}); await context.close();
  });
  await check(`${engine} v0.7 controller opt-out, missing and denied API preserve keyboard play`, async () => {
    for(const api of ['missing','denied','disabled']) {
      const context=await browser.newContext();
      await context.addInitScript(api=>{
        if(api==='disabled')localStorage.setItem('snake3310_controller','false');
        Object.defineProperty(navigator,'getGamepads',{configurable:true,value:api==='missing'?undefined:()=>{if(api==='denied')throw Error('denied');return [{index:0,id:'disabled',mapping:'standard',connected:true,axes:[0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===0,value:i===0?1:0}))}];}});
      },api);
      const page=await frozenPage(context); await page.clock.runFor(200); assert.equal(await page.locator('.standby').isVisible(),true);
      await page.keyboard.press('*'); assert.equal(await page.locator('#lcd').getAttribute('data-phase'),'playing'); await context.close();
    }
  });
  for(const [width,height] of [[320,568],[360,740],[390,844],[430,932],[844,390],[1366,768]]) {
    await check(`${engine} v0.7 controls ${width}×${height}: three layouts, two sizes, both profiles/views`,async()=>{
      for(const profile of ['classic','modern'])for(const full of [false,true]) {
        const context=await browser.newContext({viewport:{width,height},isMobile:width<=960,hasTouch:true,reducedMotion:'reduce'});
        const page=await frozenPage(context,perimeterFixture(modeFixture));
        for(const touchLayout of ['standard','compact','ergonomic'])for(const keySize of ['normal','large']) {
          const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot')));
          await page.evaluate(s=>{for(const [k,v]of Object.entries(s))localStorage.setItem('snake3310_'+k,String(v));},{profile,full,touchLayout,keySize});
          await page.reload();await page.clock.runFor(1800);
          const metrics=await page.evaluate(()=>{
            const rect=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};
            const canvas=document.querySelector('canvas'),lcd=document.querySelector('#lcd');
            const ctx=canvas.getContext('2d');
            const bottomVisible=Array.from({length:26},(_,x)=>Array.from(ctx.getImageData(4+x*12+5,238,1,1).data).join()==='83,108,64,255').every(Boolean);
            const cornersVisible=[[5,37],[309,37],[5,238],[309,238]].every(([x,y],i)=>Array.from(ctx.getImageData(x,y,1,1).data).join()===(i===0?'41,62,40,255':'83,108,64,255'));
            return{status:rect(document.querySelector('.status')),bottomVisible,cornersVisible,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,phone:rect(document.querySelector('.phone')),canvas:rect(canvas),lcd:rect(lcd),bitmap:[canvas.width,canvas.height],
              bottomInset:parseFloat(getComputedStyle(document.body).paddingBottom),controlMargin:parseFloat(getComputedStyle(document.querySelector('.full-controls')).marginTop)||0,controls:Array.from(document.querySelectorAll(document.body.classList.contains('full')?'.full-controls .up,.full-controls .down,.full-controls .left,.full-controls .right':'.keys .key')).map(rect)};
          });
          assert.deepEqual(metrics.bitmap,[320,244]); assert.ok(metrics.scrollWidth<=width);
          assert.ok(metrics.bottomVisible&&metrics.cornersVisible);
          assert.ok(Math.abs(metrics.canvas.width/metrics.canvas.height-320/244)<.001);
          assert.ok(metrics.canvas.bottom<=metrics.lcd.bottom-2.9);
          for(const c of metrics.controls){assert.ok(c.height>=(keySize==='large'?48:44));assert.ok(c.width>=44);}
          if(profile==='modern'&&(full||height>width)){
            assert.ok(metrics.scrollHeight<=height+1,`${profile} ${full} ${touchLayout} ${keySize}: ${metrics.scrollHeight}>${height}`);
            for(const c of metrics.controls)assert.ok(c.bottom<=height+1&&c.y>=0,JSON.stringify(c));
          }
          if(full&&height>width&&touchLayout==='compact')assert.ok(metrics.controls.every(c=>c.width<=80.1),'compact keys retain a narrower horizontal reach');
          if(full&&height>width) {assertFullscreenStack({status:metrics.status,controls:metrics.controls[0]});assert.ok(Math.max(...metrics.controls.map(c=>c.bottom))<=height-metrics.bottomInset+4,'all layouts respect the lower safe area');}
          assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot'))),before);
          layouts.push({v07:true,engine,width,height,profile,full,touchLayout,keySize,...metrics});
          if(profile==='modern'&&full&&keySize==='large'&&touchLayout==='ergonomic')await page.screenshot({path:`test-results/v07-${engine}-ergonomic-${width}x${height}.png`,fullPage:true});
          if(profile==='modern'&&full&&width===390&&keySize==='normal')await page.screenshot({path:`test-results/v07-${engine}-${touchLayout}-390x844.png`,fullPage:true});
        }
        await context.close();
      }
    });
  }
  await check(`${engine} v0.7 settings via touch: layout, size, hidden controls, safe areas, persistence and no generated turn`,async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    await context.addInitScript(()=>{localStorage.setItem('snake3310_profile','modern');localStorage.setItem('snake3310_full','true');});
    const page=await frozenPage(context,modeFixture('classic')); const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot')));
    await page.locator('#more').tap();await page.locator('#more-settings').tap();
    const setting=async(name,value)=>{await page.locator('.menu-item').filter({hasText:name}).tap();await page.locator('.menu-item').filter({hasText:value}).tap();};
    await setting('Touch-Layout','Kompakt');await setting('Tastengröße','Groß');await setting('Erfolgsmeldungen','Aus');await setting('Controller','Aus');await setting('Steuerkreuz','Ausblenden');
    await page.keyboard.press('Escape');await page.keyboard.press('Escape');
    assert.equal(await page.locator('.full-controls').isVisible(),false);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot'))),before);
    await page.reload();await page.clock.runFor(1800); assert.equal(await page.locator('body').getAttribute('data-touch-layout'),'compact');
    assert.equal(await page.evaluate(()=>localStorage.getItem('snake3310_controller')),'false');
    // No D-pad still permits a real swipe and keyboard input. Safe-area variables emulate insets.
    await page.evaluate(()=>{document.body.style.setProperty('--safe-top','30px');document.body.style.setProperty('--safe-bottom','24px');});
    assert.ok((await page.locator('.toolbar').boundingBox()).y>=30);
    await page.locator('#pause').tap();
    const field=await page.locator('#game').boundingBox();
    await page.mouse.move(field.x+field.width/2,field.y+field.height/2);await page.mouse.down();
    await page.mouse.move(field.x+field.width/2,field.y+field.height/2-35);await page.mouse.up();
    await page.clock.runFor(220);await page.locator('#pause').tap();
    assert.deepEqual((await page.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot')))).dir,{x:0,y:-1});
    assert.equal(await page.evaluate(()=>scrollY),0);await context.close();
  });
}
