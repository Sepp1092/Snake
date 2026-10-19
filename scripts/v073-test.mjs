import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {emptyRecords} from '../src/records.ts';
import {palettes} from '../src/render.ts';
import {perimeterFixture} from './edge-test.mjs';

const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).concat(255);
export async function testV073({browser,check,frozenPage,modeFixture,layouts,engine='chrome'}) {
  const baseline=JSON.parse(await readFile('docs/screenshots/v073/before-metrics.json','utf8'));
  for(const [width,height] of [[320,568],[360,740],[390,844],[430,932],[844,390],[1366,768]]) {
    await check(`${engine} v0.7.3 unified geometry ${width}x${height}: migration, LCD, thumb zone and views`,async()=>{
      const comparisons=[];
      for(const legacy of ['classic','modern'])for(const full of [false,true]) {
        const c=await browser.newContext({viewport:{width,height},isMobile:width<=960,hasTouch:true,reducedMotion:'reduce'});
        await c.addInitScript(s=>{localStorage.setItem('snake3310_profile',s.legacy);localStorage.setItem('snake3310_full',String(s.full));},{legacy,full});
        const p=await frozenPage(c,perimeterFixture(modeFixture));
        assert.equal(await p.locator('#profile,#more-profile,.modern-only').count(),0);
        assert.equal(await p.locator('body').evaluate(b=>b.classList.contains('modern')),false);
        const m=await p.evaluate(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,right:b.right};};return{canvas:r('canvas'),phone:r('.phone'),controls:r('.full-controls'),scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],image:document.querySelector('canvas').toDataURL(),classes:document.body.className};});
        const old=baseline.find(b=>b.width===width&&b.profile==='modern'&&b.full===full&&!b.active);
        assert.ok(m.scroll[0]<=width);if(width<=960||full)assert.ok(m.scroll[1]<=height+1);
        assert.ok(Math.abs(m.canvas.width/m.canvas.height-320/244)<.001);
        if(width<=960&&full)assert.ok(m.canvas.width>old.canvas.width+.5,'LCD grows within unchanged geometry');
        if(width<=960&&!full)assert.ok(m.canvas.width>=old.canvas.width-.5,'handset LCD retained');
        if(width<=600&&height>width&&full){assert.ok(Math.abs(height-m.controls.bottom-12)<.5,'controls sit above lower inset');assert.ok(m.controls.y-m.phone.bottom>=12);}
        comparisons.push({full,canvas:m.canvas,phone:m.phone,controls:m.controls,image:m.image,classes:m.classes});
        await p.locator('#pause').tap();await p.locator('#view').tap();await p.locator('#view').tap();await p.locator('#pause').tap();
        assert.equal(await p.evaluate(()=>localStorage.getItem('snake3310_profile')),legacy);
        layouts.push({v073:true,engine,width,height,legacy,full,...m,image:undefined});await c.close();
      }
      assert.deepEqual(comparisons.slice(0,2),comparisons.slice(2),'old profiles yield identical UI and raster');
    });
  }
  for(const legacy of ['classic','modern']) {
    await check(`${engine} v0.7.3 ${legacy} data migration: records, achievements, comfort, menus and offline`,async()=>{
      const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
      const seed=modeFixture('classic');
      const data=emptyRecords();data.receipts[seed.run.id]={mode:'classic',elapsedMs:0,food:0,points:0,longest:3,collisions:0,done:false};data.classicBest=120;data.timeBest['60']=150;data.completed.hunter=true;
      data.modes.classic={games:7,activeMs:45000,food:12,points:400,longest:20,collisions:2};
      const unlocks={version:1,unlocked:{'first-bite':123,'getting-started':456,'growing-up':789}};
      await c.addInitScript(s=>{window.vibrationCalls=[];Object.defineProperty(navigator,'vibrate',{configurable:true,value:p=>{window.vibrationCalls.push(p);return true;}});if(!sessionStorage.getItem('legacy-data')){for(const[k,v]of Object.entries(s))localStorage.setItem('snake3310_'+k,typeof v==='object'?JSON.stringify(v):String(v));sessionStorage.setItem('legacy-data','1');}},{profile:legacy,best:120,records_v1:data,achievements_v1:unlocks,lcd:'amber',volume:3,vibration:true,touchLayout:'compact',keySize:'large',full:true});
      const p=await frozenPage(c,seed);const before=await p.evaluate(()=>JSON.parse(localStorage.getItem('snake3310_snapshot')));
      const verify=async()=>{
        const values=await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
        assert.equal(values.snake3310_profile,legacy);assert.equal(values.snake3310_best,'120');assert.equal(values.snake3310_lcd,'amber');assert.equal(values.snake3310_volume,'3');assert.equal(values.snake3310_vibration,'true');
        const records=JSON.parse(values.snake3310_records_v1);assert.deepEqual(records.modes,data.modes);assert.deepEqual(records.timeBest,data.timeBest);assert.deepEqual(records.completed,data.completed);
        const awards=JSON.parse(values.snake3310_achievements_v1).unlocked;for(const[k,v]of Object.entries(unlocks.unlocked))assert.equal(awards[k],v);
        assert.deepEqual(JSON.parse(values.snake3310_snapshot),before);assert.equal(await p.locator('#profile,#more-profile').count(),0);
      };
      await verify();await p.locator('#more').tap();await p.locator('#more-sound').tap();await p.locator('#more-sound').tap();await p.locator('#more-settings').tap();
      assert.ok(await p.evaluate(()=>window.vibrationCalls.length>0),'enabled vibration reaches the browser API');
      const labels=await p.locator('.menu-item').allTextContents();assert.equal(labels.length,13);assert.ok(!labels.some(x=>/Profil|Modern/.test(x)));assert.ok(labels.some(x=>x.includes('Vibration')));
      await p.keyboard.press('Escape');await p.keyboard.press('Escape');await verify();
      await p.evaluate(async()=>navigator.serviceWorker.ready);await p.reload();await p.clock.runFor(1800);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await p.clock.runFor(1800);await verify();
      await c.setOffline(false);await c.close();
    });
  }
  for(const full of [false,true]) {
    await check(`${engine} v0.7.3 LCD ${full?'full':'handset'}: no battery, readable HUD and signal in all modes/palettes`,async()=>{
      for(const mode of ['classic','zen','timeAttack','challenge']) {
        const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
        await c.addInitScript(full=>{
          localStorage.setItem('snake3310_full',String(full));window.hud=[];
          const original=CanvasRenderingContext2D.prototype.fillText;
          CanvasRenderingContext2D.prototype.fillText=function(t,x,y,...rest){if(y<32&&this.getTransform().f===4)window.hud.push({text:t,x,y,width:this.measureText(t).width,align:this.textAlign});return original.call(this,t,x,y,...rest);};
        },full);
        const p=await frozenPage(c,modeFixture(mode));
        for(const lcd of Object.keys(palettes)) {
          await p.evaluate(lcd=>localStorage.setItem('snake3310_lcd',lcd),lcd);await p.reload();await p.clock.runFor(1800);
          const raster=await p.evaluate(()=>{const ctx=document.querySelector('canvas').getContext('2d');const data=Array.from(ctx.getImageData(148,8,18,10).data);return{battery:data,signal:Array.from(ctx.getImageData(122,17,1,1).data),hud:window.hud.slice(-3)};});
          const light=rgb(palettes[lcd].light);for(let i=0;i<raster.battery.length;i+=4)assert.deepEqual(raster.battery.slice(i,i+4),light,'retired battery area is clear');assert.deepEqual(raster.signal,rgb(palettes[lcd].ink));
          assert.equal(raster.hud.length,3);assert.match(raster.hud[1].text,/^\d{4,}$/);
          const boxes=raster.hud.map(h=>({...h,left:h.align==='right'?h.x-h.width:h.x,right:h.align==='right'?h.x:h.x+h.width}));
          assert.ok(boxes.every(h=>h.left>=0&&h.right<=312));assert.ok(boxes[0].right<117&&boxes[1].left>137,'title, signal and score do not overlap');
          if(mode==='classic')assert.match(raster.hud[2].text,/HI 0000  LV 3/);
          if(mode==='timeAttack')assert.match(raster.hud[2].text,/120s  HI 0  LV 3/);
          if(lcd==='olive')await p.screenshot({path:`test-results/v073-${engine}-hud-${mode}-${full?'full':'handheld'}.png`,fullPage:true});
          // Positive control: a painted battery must make the same pixel probe fail.
          const dirty=await p.evaluate(()=>{const ctx=document.querySelector('canvas').getContext('2d');ctx.fillStyle='#ff00ff';ctx.fillRect(148,8,18,10);return Array.from(ctx.getImageData(148,8,1,1).data);});assert.notDeepEqual(dirty,light);
        }
        await c.close();
      }
    });
  }
}
