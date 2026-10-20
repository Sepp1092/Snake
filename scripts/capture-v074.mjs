import {chromium} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {GameSession} from '../src/modes.ts';
import {capture} from '../src/snapshot.ts';
import {perimeterFixture} from './edge-test.mjs';

// --before labels the output; it requires the unchanged 0.7.3 production build.
const label=process.argv.includes('--before')?'before':'after';
const root=path.resolve('dist'),dir=`test-results/v074-${label}`;
await mkdir(dir,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try {
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    res.setHeader('Content-Type',mime[path.extname(file)]??'text/plain');res.end(await readFile(file));
  } catch {res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true}),metrics=[];
const fixture=()=>{
  const game=new GameSession({level:3,maze:0,walls:'solid'},()=>.8,()=>0);
  game.start('classic',120,'hunter',game.options);game.pause();return capture(game);
};
try {
  for(const [width,height] of [[320,568],[360,740],[390,844],[430,932],[844,390],[1366,768]])for(const full of [false,true]) {
    const context=await browser.newContext({viewport:{width,height},isMobile:width<=960,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
    await context.addInitScript(seed=>{
      for(const [key,value] of Object.entries(seed))localStorage.setItem('snake3310_'+key,typeof value==='object'?JSON.stringify(value):String(value));
    },{full,snapshot:perimeterFixture(fixture)});
    const page=await context.newPage();await page.clock.install();
    await page.goto(`http://127.0.0.1:${server.address().port}`);await page.clock.runFor(1800);
    for(const active of [false,true]) {
      if(active)await page.locator('#pause').click();
      metrics.push({width,height,full,active,...await page.evaluate(()=>{
        const rect=selector=>{const b=document.querySelector(selector).getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};
        return{version:document.title,canvas:rect('canvas'),lcd:rect('.lcd'),phone:rect('.phone'),toolbar:rect('.toolbar'),status:rect('.status'),controls:rect('.full-controls'),up:rect('.full-controls .up'),controlMargin:getComputedStyle(document.querySelector('.full-controls')).marginTop,scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]};
      })});
      if(full&&[320,390,430,844].includes(width)||!full&&width===390)await page.screenshot({path:`${dir}/${full?'full':'handheld'}-${width}x${height}-${active?'active':'paused'}.png`,fullPage:true});
    }
    await context.close();
  }
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
await writeFile(`${dir}/metrics.json`,JSON.stringify(metrics,null,2)+'\n');
console.log(`${label}: ${metrics.length} measurements saved`);
