import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { Game } from '../src/engine.ts';
import { capture } from '../src/snapshot.ts';

await mkdir('test-results', { recursive: true });
const root = path.resolve('dist');
let workerRevision = 0;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/(?:snake|snake-3310)\//, '/');
    if (pathname === '/probe.html') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>Test probe</title>'); return; }
    const file = path.resolve(root, '.' + pathname.replace(/\/$/, '/index.html'));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    let data = await readFile(file);
    // Simulate a second deployment without changing files in dist or user data.
    if (file.endsWith('sw.js') && workerRevision) data = Buffer.from(data.toString().replace(/const CACHE = PREFIX \+ '([^']+)';/, (_, hash) => `const CACHE = PREFIX + '${hash}-qa${workerRevision}';`));
    res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const channel = process.env.BROWSER_CHANNEL || (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? 'chrome' : undefined);
let browser;
const results = [], errors = [], layouts = [];
let failed = null;
const check = async (name, callback) => { try { await callback(); results.push(name); console.log('PASS ' + name); } catch (e) { failed = { name, message: String(e) }; throw e; } };
const snapshot = page => page.evaluate(() => JSON.parse(localStorage.getItem('snake3310_snapshot') ?? 'null'));
const fixture = (options = {}) => { const game = new Game({ level: 3, maze: 0, walls: 'wrap', ...options }, () => .8); game.reset(); return capture(game); };
const blurButton = page => page.evaluate(() => document.activeElement?.blur());
try {
  browser = await chromium.launch({ headless: true, channel });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.clock.install();
  await page.goto(url);
  await check('Desktop: boot and Nokia standby', async () => {
    await page.locator('.boot strong').waitFor();
    assert.equal(await page.locator('.boot strong').textContent(), 'NOKIA');
    await page.clock.runFor(1800);
    await page.locator('.standby').waitFor();
    await page.screenshot({ path: 'test-results/desktop-standby.png', fullPage: true });
  });
  await check('Keyboard: main → games → Snake II → level 9 and back', async () => {
    for (let i = 0; i < 3; i++) await page.keyboard.press('Enter');
    assert.equal(await page.locator('.lcd-top strong').textContent(), 'Snake II');
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowUp');
    assert.match(await page.locator('.menu-item.selected').textContent(), /Stufe 9/);
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => localStorage.getItem('snake3310_level')), '9');
    await page.screenshot({ path: 'test-results/desktop-menu.png', fullPage: true });
    await page.keyboard.press('Enter'); // Level submenu again, choose 3.
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  });
  await check('Gameplay: start, buffered turns, pause, resume, restart', async () => {
    await page.locator('#start').click();
    await page.evaluate(() => document.activeElement.blur());
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'playing');
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowLeft');
    await page.clock.runFor(220);
    // The head has moved up, not left: only one queued turn consumed this tick.
    const pixel = await page.locator('canvas').evaluate(c => Array.from(c.getContext('2d').getImageData(4 * 12 + 4, 32 + 7 * 12 + 3, 1, 1).data));
    assert.deepEqual(pixel, [182, 201, 145, 255]);
    await page.clock.runFor(220);
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'paused');
    const paused = await page.locator('canvas').evaluate(c => c.toDataURL());
    await page.clock.runFor(1000);
    assert.equal(await page.locator('canvas').evaluate(c => c.toDataURL()), paused);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'playing');
    await page.locator('#start').click();
    await page.locator('#confirm').waitFor({ state: 'visible' });
    await page.locator('#confirm-yes').click();
    assert.match(await page.locator('#status').textContent(), /Punkte: 0/);
    await page.screenshot({ path: 'test-results/desktop-game.png', fullPage: true });
  });
  await check('Auto-pause and menu retain the current round', async () => {
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'paused');
    assert.match(await page.locator('#status').textContent(), /Automatisch/);
    await page.locator('#menu').click();
    await page.evaluate(() => document.activeElement.blur());
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'paused');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'playing');
  });
  await check('Fullscreen view and saved preferences', async () => {
    await page.locator('#view').click();
    assert.equal(await page.locator('body').evaluate(e => e.classList.contains('full')), true);
    await page.locator('#sound').click();
    assert.equal(await page.evaluate(() => localStorage.getItem('snake3310_sound')), 'false');
    await page.screenshot({ path: 'test-results/desktop-full.png', fullPage: true });
    await page.reload(); await page.clock.runFor(1800);
    assert.equal(await page.locator('#view').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'false');
  });
  await check('Production PWA: manifest, precache and offline reload', async () => {
    assert.ok(await page.locator('link[rel=manifest]').count());
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload(); await page.clock.runFor(1800);
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'paused');
    await page.locator('#resume').click();
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'playing');
    await context.setOffline(false);
  });
  await check('Snapshot: periodic save, reload paused and identical board', async () => {
    await page.clock.runFor(1200);
    await page.locator('#pause').click();
    const before = await snapshot(page); assert.ok(before.beat > 0);
    const picture = await page.locator('canvas').evaluate(c => c.toDataURL());
    await page.reload(); await page.clock.runFor(1800);
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'paused');
    assert.deepEqual(await snapshot(page), before);
    assert.equal(await page.locator('canvas').evaluate(c => c.toDataURL()), picture);
    await page.clock.runFor(1500); assert.deepEqual(await snapshot(page), before);
    await page.locator('#menu').click();
    await blurButton(page); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
    await page.locator('.menu-item').filter({ hasText: 'Spiel fortsetzen' }).click();
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'playing');
  });
  await check('Restart confirmation: cancel preserves snapshot; accept resets temporary state', async () => {
    await page.locator('#start').click();
    const before = await snapshot(page);
    assert.equal(await page.locator('#confirm').isVisible(), true);
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'paused');
    await page.clock.runFor(500); assert.deepEqual(await snapshot(page), before);
    await page.locator('#confirm-no').click(); assert.deepEqual(await snapshot(page), before);
    await page.locator('#start').click(); await page.locator('#confirm-yes').click();
    const after = await snapshot(page); assert.equal(after.beat, 0); assert.equal(after.score, 0); assert.equal(after.bonus, null);
    assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'playing');
  });
  await check('Profile and view are independent; Modern themes and defaults preserve round and record', async () => {
    await page.locator('#pause').click(); const before = await snapshot(page);
    await page.evaluate(() => localStorage.setItem('snake3310_best', '150'));
    await page.locator('#profile').click();
    assert.equal(await page.locator('#profile').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#view').getAttribute('aria-pressed'), 'true');
    await page.locator('#view').click();
    assert.equal(await page.locator('#profile').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#view').getAttribute('aria-pressed'), 'false');
    await page.locator('#settings').click();
    await page.locator('.menu-item').filter({ hasText: 'LCD-Darstellung' }).click();
    await page.locator('.menu-item').filter({ hasText: 'Dark LCD' }).click();
    assert.equal(await page.evaluate(() => localStorage.getItem('snake3310_lcd')), 'dark');
    await page.screenshot({ path: 'test-results/desktop-modern-dark.png', fullPage: true });
    await page.locator('.menu-item').filter({ hasText: 'LCD-Darstellung' }).click();
    await page.locator('.menu-item').filter({ hasText: 'High Contrast' }).click();
    await page.locator('.menu-item').filter({ hasText: 'Lautstärke' }).click();
    await page.locator('.menu-item').filter({ hasText: 'Stufe 4' }).click();
    await page.locator('.menu-item').filter({ hasText: 'Vibration' }).click();
    await page.locator('.menu-item').filter({ hasText: 'Ein (falls unterstützt)' }).click();
    assert.equal(await page.evaluate(() => localStorage.getItem('snake3310_volume')), '4');
    assert.equal(await page.evaluate(() => localStorage.getItem('snake3310_vibration')), 'true');
    await page.locator('.menu-item').filter({ hasText: 'Standardeinstellungen' }).click();
    await page.locator('#confirm-yes').click();
    assert.equal(await page.locator('#profile').getAttribute('aria-pressed'), 'false');
    assert.equal(await page.evaluate(() => localStorage.getItem('snake3310_best')), '150');
    assert.deepEqual(await snapshot(page), before);
    assert.equal(await page.evaluate(() => localStorage.getItem('snake3310_lcd')), 'olive');
  });
  await context.close();
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const phone = await mobile.newPage();
  phone.on('pageerror', e => errors.push(e.message));
  await phone.clock.install(); await phone.goto(url); await phone.clock.runFor(1800);
  await check('Smartphone: touch menus, LCD selection and no horizontal overflow', async () => {
    await phone.getByRole('button', { name: 'Menü', exact: true }).last().tap();
    await phone.locator('.menu-item').filter({ hasText: 'Einstellungen' }).tap();
    await phone.locator('.menu-item').filter({ hasText: 'LCD-Darstellung' }).tap();
    await phone.locator('.menu-item').filter({ hasText: 'Bernstein' }).tap();
    assert.equal(await phone.evaluate(() => localStorage.getItem('snake3310_lcd')), 'amber');
    assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await phone.screenshot({ path: 'test-results/mobile-menu.png', fullPage: true });
  });
  await check('Smartphone: jitter ignored; keypad and swipe turns act before finger release', async () => {
    await phone.locator('#start').tap();
    const bounds = await phone.locator('#lcd').boundingBox();
    const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
    const cdp = await mobile.newCDPSession(phone);
    const scroll = await phone.evaluate(() => scrollY);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 3, y: y - 4 }] });
    await phone.clock.runFor(220);
    const straight = await phone.locator('canvas').evaluate(c => Array.from(c.getContext('2d').getImageData(5 * 12 + 7, 32 + 8 * 12 + 4, 1, 1).data));
    assert.deepEqual(straight, [223, 193, 123, 255]);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 35 }] });
    await phone.clock.runFor(220);
    const pixel = await phone.locator('canvas').evaluate(c => Array.from(c.getContext('2d').getImageData(5 * 12 + 4, 32 + 7 * 12 + 3, 1, 1).data));
    assert.deepEqual(pixel, [223, 193, 123, 255]);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await phone.evaluate(() => scrollY), scroll);
    await phone.getByRole('button', { name: '4 Nach links', exact: true }).tap();
    await phone.clock.runFor(220);
    await phone.getByRole('button', { name: '0 Pause', exact: true }).tap();
    assert.equal(await phone.locator('#lcd').getAttribute('data-phase'), 'paused');
    await phone.screenshot({ path: 'test-results/mobile-game.png', fullPage: true });
  });
  await check('Small smartphone: 320px and fullscreen controls fit', async () => {
    await phone.setViewportSize({ width: 320, height: 700 });
    assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await phone.locator('#view').tap();
    await phone.locator('.full-controls').waitFor({ state: 'visible' });
    assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await phone.screenshot({ path: 'test-results/mobile-full-320.png', fullPage: true });
  });
  await check('Mobile Modern: scrollable settings, large targets, profile independent of full view', async () => {
    await phone.locator('#profile').tap(); await phone.locator('#more').tap(); await phone.locator('#more-settings').tap();
    assert.equal(await phone.locator('#view').getAttribute('aria-pressed'), 'true');
    await phone.locator('.menu-item').filter({ hasText: 'Vibration' }).tap();
    await phone.locator('.menu-item').filter({ hasText: 'Aus' }).tap();
    await phone.locator('.menu-item').filter({ hasText: 'LCD-Darstellung' }).tap();
    await phone.locator('.menu-item').filter({ hasText: 'High Contrast' }).tap();
    assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok((await phone.locator('.menu-item').first().boundingBox()).height >= 44);
    await phone.screenshot({ path: 'test-results/mobile-modern-320.png', fullPage: true });
  });
  assert.deepEqual(errors, []);
  await mobile.close();
  const recovery = await browser.newContext();
  await recovery.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
  });
  const repair = await recovery.newPage(); repair.on('pageerror', e => errors.push(e.message));
  await repair.clock.install(); await repair.goto(url); await repair.clock.runFor(1800);
  await check('Corrupt save and v0.4 preferences migrate safely; missing feedback APIs do not throw', async () => {
    await repair.evaluate(() => { localStorage.setItem('snake3310_snapshot', '{broken'); localStorage.setItem('snake3310_best', '240'); localStorage.setItem('snake3310_lcd', 'silver'); localStorage.setItem('snake3310_vibration', 'true'); });
    await repair.reload(); await repair.clock.runFor(1800);
    await repair.locator('.standby').waitFor(); assert.equal(await snapshot(repair), null);
    assert.equal(await repair.locator('#resume').isVisible(), false);
    await repair.locator('#start').click(); await repair.locator('#sound').click();
    assert.equal(await repair.evaluate(() => localStorage.getItem('snake3310_best')), '240');
    assert.equal(await repair.locator('#lcd').getAttribute('data-phase'), 'playing');
  });
  await check('Game Over clears saved round; restart has no dialog and cannot reload a finished game', async () => {
    await repair.locator('#pause').click();
    const doomed = fixture({ walls: 'solid' }); doomed.snake = [{ x: 25, y: 8 }, { x: 24, y: 8 }, { x: 23, y: 8 }];
    // Seed after pagehide and before application startup, once per browser session.
    await repair.addInitScript(s => {
      if (!sessionStorage.getItem('fixture-seeded')) {
        localStorage.setItem('snake3310_snapshot', JSON.stringify(s)); sessionStorage.setItem('fixture-seeded', 'true');
      }
    }, doomed);
    await repair.reload(); await repair.clock.runFor(1800);
    assert.deepEqual(await snapshot(repair), doomed);
    await repair.locator('#resume').click();
    await repair.clock.runFor(220);
    assert.equal(await repair.locator('#lcd').getAttribute('data-phase'), 'over'); assert.equal(await snapshot(repair), null);
    const noRound = await recovery.newPage(); await noRound.clock.install(); await noRound.goto(url); await noRound.clock.runFor(1800);
    await noRound.locator('.standby').waitFor(); assert.equal(await noRound.locator('#resume').isVisible(), false);
    await noRound.close();
    await blurButton(repair); await repair.keyboard.press('Enter');
    assert.equal(await repair.locator('#confirm').isVisible(), false);
    assert.equal(await repair.locator('#lcd').getAttribute('data-phase'), 'playing');
  });
  await check('Autosave throttles writes; keyboard repeat and a full buffer do not create extra turns', async () => {
    await repair.evaluate(() => {
      window.snapshotWrites = 0; const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v) { if (k === 'snake3310_snapshot') window.snapshotWrites++; return original.call(this, k, v); };
    });
    await blurButton(repair);
    await repair.keyboard.down('w'); await repair.keyboard.down('w'); await repair.keyboard.up('w');
    await repair.keyboard.press('d');
    await repair.keyboard.press('s'); // Third valid turn must be rejected while full.
    await repair.clock.runFor(670);
    assert.equal(await repair.evaluate(() => window.snapshotWrites), 0);
    await repair.locator('#pause').click(); const s = await snapshot(repair);
    assert.equal(await repair.evaluate(() => window.snapshotWrites), 1);
    assert.deepEqual(s.snake[0], { x: 6, y: 7 });
  });
  await recovery.close();
  const upgrade = await browser.newContext();
  const update = await upgrade.newPage(); update.on('pageerror', e => errors.push(e.message));
  await update.clock.install(); await update.goto(url + '/snake/'); await update.clock.runFor(1800);
  await check('Subdirectory: manifest scope, offline round recovery and query navigation', async () => {
    await update.locator('#start').click(); await update.clock.runFor(220); await update.locator('#pause').click();
    const before = await snapshot(update);
    await update.evaluate(async () => navigator.serviceWorker.ready); await update.reload(); await update.clock.runFor(1800);
    await update.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.endsWith('/snake/sw.js'));
    await upgrade.setOffline(true); await update.goto(url + '/snake/?offline=1'); await update.clock.runFor(1800);
    assert.equal(await update.locator('#lcd').getAttribute('data-phase'), 'paused'); assert.deepEqual(await snapshot(update), before);
    await upgrade.setOffline(false);
  });
  await check('PWA update waits without interrupting round; new activation preserves snapshot and highscore', async () => {
    await update.evaluate(() => localStorage.setItem('snake3310_best', '330'));
    await update.locator('#resume').click(); const before = await snapshot(update);
    workerRevision++;
    await update.evaluate(async () => { const r = await navigator.serviceWorker.ready; await r.update(); });
    await update.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting);
    assert.equal(await update.locator('#lcd').getAttribute('data-phase'), 'playing');
    assert.deepEqual(await snapshot(update), before);
    const waiting = await update.evaluate(async () => (await navigator.serviceWorker.ready).waiting.state); assert.equal(waiting, 'installed');
    await update.locator('#pause').click(); const paused = await snapshot(update);
    await update.goto('about:blank');
    // A newly opened uncontrolled page lets us await activation without arbitrary sleeps.
    const probe = await upgrade.newPage(); await probe.goto(url + '/probe.html');
    await probe.waitForFunction(async () => (await caches.keys()).some(k => k.endsWith('-qa1')) && !(await navigator.serviceWorker.getRegistration('/snake/'))?.waiting);
    await probe.close(); await update.goto(url + '/snake/'); await update.clock.runFor(1800);
    assert.deepEqual(await snapshot(update), paused); assert.equal(await update.locator('#lcd').getAttribute('data-phase'), 'paused');
    assert.equal(await update.evaluate(() => localStorage.getItem('snake3310_best')), '330');
    await upgrade.setOffline(true); await update.reload(); await update.clock.runFor(1800);
    assert.deepEqual(await snapshot(update), paused); await upgrade.setOffline(false);
  });
  await upgrade.close();
  for (const [width, height] of [[320,568], [360,740], [390,844], [430,932], [844,390], [1366,768]]) {
    await check(`Layout ${width}×${height}: play, touch targets and paused view switch`, async () => {
      const small = width <= 960;
      const context = await browser.newContext({ viewport: { width, height }, isMobile: small, hasTouch: small, reducedMotion: 'reduce' });
      await context.addInitScript(() => { localStorage.setItem('snake3310_profile', 'modern'); localStorage.setItem('snake3310_full', 'true'); });
      const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
      await page.clock.install(); await page.goto(url + '/snake-3310/'); await page.clock.runFor(1800);
      await page.keyboard.press('*');
      const metrics = await page.evaluate(() => {
        const box = e => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height, right: b.right, bottom: b.bottom }; };
        return { viewport: { width: innerWidth, height: innerHeight }, scroll: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }, field: box(document.querySelector('#lcd')), controls: Array.from(document.querySelectorAll('.full-controls .up,.full-controls .left,.full-controls .down,.full-controls .right')).map(box) };
      });
      layouts.push({ width, height, ...metrics });
      assert.ok(metrics.scroll.width <= width, `horizontal overflow at ${width}`);
      {
        assert.ok(metrics.scroll.height <= height + 1, `vertical overflow ${metrics.scroll.height} > ${height}`);
        for (const box of [metrics.field, ...metrics.controls]) assert.ok(box.x >= 0 && box.y >= 0 && box.right <= width + 1 && box.bottom <= height + 1, JSON.stringify(box));
      }
      for (const box of metrics.controls) assert.ok(box.width >= 44 && box.height >= 44);
      assert.ok(metrics.field.width >= 200 && metrics.field.height >= 150);
      await page.screenshot({ path: `test-results/modern-full-${width}x${height}.png`, fullPage: true });
      await page.locator('#pause').click(); const before = await snapshot(page);
      await page.locator('#view').click();
      assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'paused');
      assert.deepEqual(await snapshot(page), before);
      assert.equal(await page.locator('#profile').getAttribute('aria-pressed'), 'true');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (small && height > width) {
        assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), `Nokia portrait height at ${width}×${height}`);
        for (const label of ['2 Nach oben', '4 Nach links', '6 Nach rechts', '8 Nach unten']) {
          const b = await page.getByRole('button', { name: label, exact: true }).boundingBox(); assert.ok(b.y >= 0 && b.y + b.height <= height);
        }
        await page.screenshot({ path: `test-results/modern-nokia-${width}x${height}.png`, fullPage: true });
      }
      await page.locator('#view').click(); assert.deepEqual(await snapshot(page), before);
      if (small) {
        await page.locator('#more').click(); await page.locator('#more-close').click();
        assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'paused');
      }
      await context.close();
    });
  }
  await check('Safe-area spacing and touch on compact Modern controls do not scroll', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await context.addInitScript(() => { localStorage.setItem('snake3310_profile', 'modern'); localStorage.setItem('snake3310_full', 'true'); });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.clock.install({ time: new Date('2026-10-18T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-18T12:00:01Z'));
    await page.goto(url); await page.clock.runFor(1800); await page.keyboard.press('*');
    await page.evaluate(() => { for (const [key, value] of Object.entries({ top: '30px', bottom: '24px', left: '10px', right: '10px' })) document.body.style.setProperty('--safe-' + key, value); });
    assert.ok((await page.locator('.toolbar').boundingBox()).y >= 30);
    const down = await page.locator('.full-controls .down').boundingBox(); assert.ok(down.y + down.height <= 844 - 24);
    await page.locator('.full-controls .up').tap(); await page.locator('.full-controls .right').tap();
    await page.clock.runFor(440); await page.locator('#pause').tap();
    assert.deepEqual((await snapshot(page)).snake[0], { x: 5, y: 7 });
    assert.equal(await page.evaluate(() => scrollY), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1));
    await page.screenshot({ path: 'test-results/modern-safe-area.png', fullPage: true });
    await context.close();
  });
  await check('GitHub Pages subpath: manifest, icons, scripts and styles', async () => {
    const context = await browser.newContext(); const page = await context.newPage();
    const responses = []; page.on('response', r => responses.push({ url: r.url(), status: r.status() }));
    await page.goto(url + '/snake-3310/'); await page.evaluate(async () => navigator.serviceWorker.ready);
    const manifestUrl = await page.locator('link[rel=manifest]').evaluate(e => e.href);
    assert.equal(new URL(manifestUrl).pathname, '/snake-3310/manifest.webmanifest');
    const manifest = await (await context.request.get(manifestUrl)).json();
    assert.equal(manifest.display, 'standalone'); assert.equal(new URL(manifest.scope, manifestUrl).pathname, '/snake-3310/');
    assert.equal(new URL(manifest.start_url, manifestUrl).pathname, '/snake-3310/');
    for (const icon of manifest.icons) assert.equal((await context.request.get(new URL(icon.src, manifestUrl).href)).status(), 200);
    assert.ok(responses.some(r => /\/snake-3310\/assets\/.*\.js$/.test(r.url) && r.status === 200));
    assert.ok(responses.some(r => /\/snake-3310\/assets\/.*\.css$/.test(r.url) && r.status === 200));
    assert.ok(responses.every(r => new URL(r.url).origin === url && r.status < 400));
    await context.close();
  });
  await check('Regular profile: installability and offline restore after a real browser restart', async () => {
    const parent = path.resolve('test-results'); const profileDir = await mkdtemp(path.join(parent, 'browser-profile-'));
    let persistent;
    try {
      persistent = await chromium.launchPersistentContext(profileDir, { headless: true, channel, viewport: { width: 390, height: 844 } });
      let page = persistent.pages()[0]; await page.clock.install(); await page.goto(url + '/snake-3310/'); await page.clock.runFor(1800);
      await page.locator('#start').click(); await page.clock.runFor(440); await page.locator('#pause').click();
      await page.evaluate(() => localStorage.setItem('snake3310_best', '410')); const before = await snapshot(page);
      await page.evaluate(async () => navigator.serviceWorker.ready); await page.reload(); await page.clock.runFor(1800);
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      // Regular persistent profile: incognito contexts deliberately forbid PWA installation.
      const cdp = await persistent.newCDPSession(page);
      const install = await cdp.send('Page.getInstallabilityErrors');
      assert.deepEqual(install.installabilityErrors, []);
      const manifest = await (await persistent.request.get(url + '/snake-3310/manifest.webmanifest')).json();
      await writeFile('test-results/installability.json', JSON.stringify({ manifest, ...install }, null, 2));
      await persistent.close(); persistent = null;
      persistent = await chromium.launchPersistentContext(profileDir, { headless: true, channel, viewport: { width: 390, height: 844 } });
      await persistent.setOffline(true); page = persistent.pages()[0]; await page.clock.install(); await page.goto(url + '/snake-3310/'); await page.clock.runFor(1800);
      assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'paused');
      assert.deepEqual(await snapshot(page), before);
      assert.equal(await page.evaluate(() => localStorage.getItem('snake3310_best')), '410');
      await page.locator('#resume').click(); assert.equal(await page.locator('#lcd').getAttribute('data-phase'), 'playing');
    } finally {
      await persistent?.close();
      // Only delete the fresh test-owned profile inside the verified output directory.
      if (!path.resolve(profileDir).startsWith(parent + path.sep)) throw Error('Unsafe cleanup path');
      await rm(profileDir, { recursive: true, force: true });
    }
  });
  for (const extension of ['js', 'css']) {
    await check(`Load recovery: missing ${extension.toUpperCase()} shows reload action and preserves local data`, async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const saved = fixture();
      await context.addInitScript(s => {
        if (!localStorage.getItem('snake3310_snapshot')) localStorage.setItem('snake3310_snapshot', JSON.stringify(s));
        localStorage.setItem('snake3310_best', '510');
      }, saved);
      await page.route(new RegExp(`/assets/[^/]+\\.${extension}$`), route => route.abort(), { times: 1 });
      await page.goto(url + '/snake-3310/');
      await page.locator('#load-error').waitFor({ state: 'visible' });
      await page.getByRole('button', { name: 'App neu laden', exact: true }).click();
      await page.locator('.boot').waitFor();
      await page.waitForFunction(() => document.querySelector('#lcd')?.dataset.phase === 'paused');
      assert.equal(await page.locator('#load-error').count(), 0);
      assert.deepEqual(await snapshot(page), saved);
      assert.equal(await page.evaluate(() => localStorage.getItem('snake3310_best')), '510');
      assert.equal(await page.locator('.lcd').evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(170, 189, 131)');
      await context.close();
    });
  }
  assert.deepEqual(errors, []);
} finally {
  await writeFile('test-results/browser-report.json', JSON.stringify({ date: new Date().toISOString(), passed: results, failed, pageErrors: errors, layouts }, null, 2));
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
console.log(`${results.length} browser scenarios passed.`);
