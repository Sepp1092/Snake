import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import path from 'node:path';
import { GameSession } from '../src/modes.ts';import {capture}from'../src/snapshot.ts';import{perimeterFixture}from'./edge-test.mjs';
const label=process.argv.includes('--before')?'before':'after',root=path.resolve('dist'),dir=`test-results/v073-${label}`;await mkdir(dir,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=createServer(async(req,res)=>{try{const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}res.setHeader('Content-Type',mime[path.extname(p)]??'text/plain');res.end(await readFile(p));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({headless:true}),metrics=[];
const fixture=()=>{const g=new GameSession({level:3,maze:0,walls:'solid'},()=>.8,()=>0);g.start('classic',120,'hunter',g.options);g.pause();return capture(g);};
try{for(const[width,height]of[[320,568],[360,740],[390,844],[430,932],[844,390],[1366,768]])for(const profile of['classic','modern'])for(const full of[false,true]){
const c=await b.newContext({viewport:{width,height},isMobile:width<=960,hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});await c.addInitScript(s=>{for(const[k,v]of Object.entries(s))localStorage.setItem('snake3310_'+k,typeof v==='object'?JSON.stringify(v):String(v));},{profile,full,snapshot:perimeterFixture(fixture)});const p=await c.newPage();await p.clock.install();await p.goto(`http://127.0.0.1:${server.address().port}`);await p.clock.runFor(1800);
for(const active of[false,true]){if(active)await p.locator('#pause').click();const name=`${profile}-${full?'full':'handheld'}-${width}x${height}-${active?'active':'paused'}`;
metrics.push({width,height,profile,full,active,...await p.evaluate(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};return{version:document.title,controlMargin:getComputedStyle(document.querySelector('.full-controls')).marginTop,canvas:r('canvas'),phone:r('.phone'),toolbar:r('.toolbar'),controls:r('.full-controls'),scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],buttons:Array.from(document.querySelectorAll('.toolbar button')).filter(e=>e.getBoundingClientRect().height).map(e=>e.id)};})});
if(width===390||width===320&&profile==='classic'&&full||width===844&&profile==='modern'&&full)await p.screenshot({path:`${dir}/${name}.png`,fullPage:true});}
if(width===390&&profile==='modern'){await p.locator('#more').click();await p.screenshot({path:`${dir}/more-${full?'full':'handheld'}.png`,fullPage:true});}
if(width===390&&profile==='modern') {
  if(await p.locator('#more-panel').isVisible())await p.locator('#more-close').click();
  await p.locator('#menu').click();await p.screenshot({path:`${dir}/main-${full?'full':'handheld'}.png`,fullPage:true});
  await p.evaluate(()=>document.activeElement?.blur());await p.keyboard.press('ArrowUp');await p.keyboard.press('Enter');await p.screenshot({path:`${dir}/achievements-${full?'full':'handheld'}.png`,fullPage:true});
  await p.keyboard.press('Escape');for(let i=0;i<3;i++)await p.keyboard.press('ArrowUp');await p.keyboard.press('Enter');await p.screenshot({path:`${dir}/settings-${full?'full':'handheld'}.png`,fullPage:true});
}
await c.close();}
}finally{await b.close();await new Promise(r=>server.close(r));}await writeFile(`${dir}/metrics.json`,JSON.stringify(metrics,null,2)+'\n');console.log(`${label}: ${metrics.length} measurements saved`);
