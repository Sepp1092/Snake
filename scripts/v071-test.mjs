import assert from 'node:assert/strict';
import { perimeterFixture } from './edge-test.mjs';

export async function testV071({ browser, check, frozenPage, modeFixture, layouts, engine='chrome' }) {
  for (const [width,height] of [[320,568],[360,740],[390,844],[430,932],[844,390]]) {
    await check(`${engine} v0.7.1 adaptive layout ${width}x${height}: both profiles/views, all touch layouts/sizes, active/paused`,async()=>{
      for(const profile of ['classic','modern'])for(const full of [false,true]) {
        const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
        await context.addInitScript(s=>{for(const[k,v]of Object.entries(s))localStorage.setItem('snake3310_'+k,String(v));},{profile,full});
        const page=await frozenPage(context,perimeterFixture(modeFixture));
        for(const touchLayout of ['standard','compact','ergonomic'])for(const keySize of ['normal','large']) {
          await page.evaluate(s=>{for(const[k,v]of Object.entries(s))localStorage.setItem('snake3310_'+k,String(v));},{touchLayout,keySize});
          await page.reload();await page.clock.runFor(1800);
          const before=await page.evaluate(()=>localStorage.getItem('snake3310_snapshot'));
          for(const active of [false,true]) {
            if(active)await page.locator('#pause').tap();
            const m=await page.evaluate(()=>{
              const r=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};
              const all=s=>Array.from(document.querySelectorAll(s)).filter(e=>e.getBoundingClientRect().height>0).map(r);
              const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
              return{toolbar:r(document.querySelector('.toolbar')),phone:r(document.querySelector('.phone')),canvas:r(canvas),lcd:r(canvas.parentElement),
                keys:all(document.body.classList.contains('full')?'.full-controls .key':'.keys .key'),
                toolbarButtons:Array.from(document.querySelectorAll('.toolbar button')).filter(e=>e.getBoundingClientRect().height>0).map(e=>({text:e.textContent,width:e.clientWidth,scroll:e.scrollWidth})),controlMargin:parseFloat(getComputedStyle(document.querySelector('.full-controls')).marginTop)||0,controls:r(document.querySelector('.full-controls')),scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
                sourceCorners:[[5,37],[309,37],[5,238],[309,238]].map(([x,y])=>Array.from(ctx.getImageData(x,y,1,1).data)),bitmap:[canvas.width,canvas.height]};
            });
            for(const b of m.toolbarButtons)assert.ok(b.scroll<=b.width+1,`toolbar text overflows: ${b.text} ${b.scroll}>${b.width}`);
            const tag=`${engine} ${width}x${height} ${profile} ${full} ${touchLayout} ${keySize} ${active}`;
            assert.ok(m.scroll[0]<=width&&m.scroll[1]<=height+1,tag+JSON.stringify(m));
            for(const b of [m.phone,m.canvas,...m.keys])assert.ok(b.x>=-.1&&b.y>=0&&b.right<=width+.1&&b.bottom<=height+.1,tag+JSON.stringify(b));
            for(const k of m.keys){assert.ok(k.width>=44&&k.height>=(keySize==='large'?48:44),tag);}
            for(let i=0;i<m.keys.length;i++)for(let j=i+1;j<m.keys.length;j++){
              const a=m.keys[i],b=m.keys[j];assert.ok(a.right<=b.x+.1||b.right<=a.x+.1||a.bottom<=b.y+.1||b.bottom<=a.y+.1,'overlapping keys '+tag);
            }
            for(const k of m.keys)assert.ok(k.right<=m.canvas.x+.1||k.x>=m.canvas.right-.1||k.bottom<=m.canvas.y+.1||k.y>=m.canvas.bottom-.1,tag+' key overlaps LCD');
            assert.ok(m.phone.y-m.toolbar.bottom>=0&&m.phone.y-m.toolbar.bottom<=9,tag+' top gap');
            if(full&&height>width)assert.ok(m.controls.y-m.phone.bottom>=m.controlMargin-.2&&m.controls.y-m.phone.bottom<=m.controlMargin+9,tag+' bounded adaptive control gap');
            assert.deepEqual(m.bitmap,[320,244]);assert.ok(Math.abs(m.canvas.width/m.canvas.height-320/244)<.001);
            assert.ok(m.canvas.bottom<=m.lcd.bottom-2.9);
            // Paused overlay covers the centre only. The occupied lower row and corners remain visible.
            assert.deepEqual(m.sourceCorners,[[41,62,40,255],[83,108,64,255],[83,108,64,255],[83,108,64,255]]);
            if(!full&&height>width) {
              // A handset must exhaust width or height, rather than hit an arbitrary fixed cap.
              assert.ok(width-12-m.phone.width<2||height-6-m.phone.bottom<2,tag+' unused handset budget');
            }
            assert.equal(await page.evaluate(()=>localStorage.getItem('snake3310_snapshot')),before);
            layouts.push({v071:true,engine,width,height,profile,full,touchLayout,keySize,active,...m});
            if(profile==='modern'&&touchLayout==='standard'&&keySize==='normal'&&(width===390||width===320||width===844))
              await page.screenshot({path:`test-results/v071-${engine}-${full?'full':'handheld'}-${width}x${height}-${active?'active':'paused'}.png`,fullPage:true});
          }
        }
        // Resize while paused, including browser chrome height changes and injected PWA safe areas.
        await page.locator('#pause').tap();
        await page.evaluate(()=>{document.body.style.setProperty('--safe-top','24px');document.body.style.setProperty('--safe-bottom','20px');document.body.style.setProperty('--safe-left','12px');document.body.style.setProperty('--safe-right','12px');});
        await page.clock.runFor(80);
        assert.ok((await page.locator('.toolbar').boundingBox()).y>=24);
        await page.clock.resume();
        await page.setViewportSize({width:height,height:width});
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        await page.waitForFunction(()=>document.querySelector('.phone').getBoundingClientRect().bottom<=innerHeight-20+.5&&document.documentElement.scrollWidth<=innerWidth);
        assert.ok(await page.evaluate(()=>Array.from(document.querySelectorAll('.toolbar button')).filter(e=>e.getBoundingClientRect().height>0).every(e=>e.scrollWidth<=e.clientWidth+1)),'rotated toolbar labels must fit');
        if(width===320&&profile==='classic'&&!full)await page.screenshot({path:`test-results/v071-${engine}-classic-handheld-568x320-safe.png`,fullPage:true});
        await page.setViewportSize({width,height});
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        await page.waitForFunction(()=>{const p=document.querySelector('.phone');return (innerHeight>innerWidth?!p.style.getPropertyValue('--mobile-lcd-width'):true)&&p.getBoundingClientRect().bottom<=innerHeight-20+.5;});
        const bottom=await page.locator(full?'.full-controls':'.phone').boundingBox();
        assert.ok(bottom.y+bottom.height<=height-20+.5,JSON.stringify({engine,width,height,profile,full,bottom,metrics:await page.evaluate(()=>({inner:[innerWidth,innerHeight],body:document.body.getBoundingClientRect().toJSON(),css:getComputedStyle(document.body).padding,phone:document.querySelector(".phone").getBoundingClientRect().toJSON(),style:document.querySelector(".phone").getAttribute("style")}))}));
        assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth));
        await context.close();
      }
    });
  }
}
