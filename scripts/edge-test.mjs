import assert from 'node:assert/strict';
import { validateSnapshot } from '../src/snapshot.ts';
import { CELL, STATUS_HEIGHT, LCD_PADDING, LCD_WIDTH, LCD_HEIGHT } from '../src/display.ts';
import { inspectPerimeter } from './perimeter-probe.mjs';

export async function testEdges({ browser, check, frozenPage, modeFixture, layouts, engine = 'chrome' }) {
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) for (const dpr of [1, 2, 3]) {
    await check(`${engine} LCD perimeter ${width}×${height} DPR ${dpr}: both profiles and views, raster and screenshot`, async () => {
      for (const profile of ['classic', 'modern']) for (const full of [false, true]) {
        const seed = modeFixture('classic');
        // Connected clockwise perimeter: entire bottom row and all four corners occupied.
        seed.snake = [];
        for (let x = 0; x < 26; x++) seed.snake.push({ x, y: 0 });
        for (let y = 1; y < 17; y++) seed.snake.push({ x: 25, y });
        for (let x = 24; x >= 0; x--) seed.snake.push({ x, y: 16 });
        for (let y = 15; y > 0; y--) seed.snake.push({ x: 0, y });
        seed.dir = { x: -1, y: 0 }; seed.food = { x: 13, y: 8 };
        seed.run.longest = seed.snake.length;
        assert.ok(validateSnapshot(seed));
        const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
        try {
          await context.addInitScript(({ profile, full }) => {
            localStorage.setItem('snake3310_profile', profile);
            localStorage.setItem('snake3310_full', String(full));
          }, { profile, full });
          const page = await frozenPage(context, seed);
          const metrics = await page.locator('#game').evaluate((canvas, g) => {
            const lcd = canvas.parentElement, c = canvas.getBoundingClientRect(), b = lcd.getBoundingClientRect(), css = getComputedStyle(lcd);
            const left = b.left + parseFloat(css.borderLeftWidth), top = b.top + parseFloat(css.borderTopWidth);
            const right = b.right - parseFloat(css.borderRightWidth), bottom = b.bottom - parseFloat(css.borderBottomWidth);
            const ctx = canvas.getContext('2d');
            const rgb = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
            let allBodyPixels = true;
            for (const p of g.snake) {
              // All ten artwork rows/columns are present, including the very last bottom pixel.
              for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
                const head = p.x === 0 && p.y === 0;
                // This fixture faces left: its two-pixel eye starts at (3,4).
                const expected = head ? (x >= 3 && x < 5 && y >= 4 && y < 6 ? '182,201,145,255' : '41,62,40,255') : '83,108,64,255';
                if (rgb(g.pad + p.x * g.cell + x, g.pad + g.status + p.y * g.cell + y).join() !== expected) allBodyPixels = false;
              }
            }
            return { width: canvas.width, height: canvas.height, dpr: devicePixelRatio,
              canvas: { x: c.x, y: c.y, right: c.right, bottom: c.bottom, width: c.width, height: c.height },
              content: { left, top, right, bottom }, smoothing: ctx.imageSmoothingEnabled, rendering: getComputedStyle(canvas).imageRendering,
              allBodyPixels,
              reserve: [rgb(0, 243), rgb(319, 243), rgb(160, 243)],
              scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight };
          }, { snake: seed.snake, pad: LCD_PADDING, cell: CELL, status: STATUS_HEIGHT });
          assert.deepEqual([metrics.width, metrics.height, metrics.dpr], [LCD_WIDTH, LCD_HEIGHT, dpr]);
          assert.ok(metrics.allBodyPixels); assert.equal(metrics.smoothing, false); assert.equal(metrics.rendering, 'pixelated');
          assert.ok(Math.abs(metrics.canvas.width / metrics.canvas.height - LCD_WIDTH / LCD_HEIGHT) < .001, 'uniform scale');
          assert.ok(metrics.canvas.x >= metrics.content.left - .05 && metrics.canvas.y >= metrics.content.top - .05);
          assert.ok(metrics.canvas.right <= metrics.content.right + .05 && metrics.canvas.bottom <= metrics.content.bottom + .05, 'canvas must fit inside border, including bottom row');
          for (const p of metrics.reserve) assert.deepEqual(p, [170, 189, 131, 255]);
          assert.ok(metrics.scrollWidth <= width);
          const name = `v061-${engine}-bottom-${width}x${height}-dpr${dpr}-${profile}-${full ? 'full' : 'handheld'}`;
          const shot = await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
          if (profile === 'modern') assert.ok(metrics.scrollHeight <= height + 1, `${name}: ${metrics.scrollHeight} > ${height}`);
          // Rasterize an unclipped LCD twin at the SAME fractional page position.
          // It shares the bitmap, pixelated scaling and LCD overlay, but none of
          // the original ancestors' clipping. Browser-specific rounding is thus
          // measured instead of guessed from one near-edge source coordinate.
          const position = await page.locator('#game').evaluate(canvas => {
            const lcd = canvas.parentElement, b = lcd.getBoundingClientRect(), c = canvas.getBoundingClientRect();
            const twin = lcd.cloneNode(false); twin.removeAttribute('id'); twin.dataset.edgeReference = 'true';
            Object.assign(twin.style, { position: 'absolute', left: `${b.x + scrollX}px`, top: `${b.y + scrollY}px`,
              width: `${c.width}px`, height: `${c.height}px`, margin: '0', transform: 'none', overflow: 'visible',
              clipPath: 'none', zIndex: '2147483647', pointerEvents: 'none' });
            const copy = canvas.cloneNode(false); copy.removeAttribute('id'); copy.getContext('2d').drawImage(canvas, 0, 0);
            twin.append(copy); document.body.append(twin);
            return { x: c.x + scrollX, y: c.y + scrollY, width: c.width, height: c.height, viewportWidth: innerWidth };
          });
          let reference;
          try { reference = await page.screenshot({ path: `test-results/${name}-reference.png`, fullPage: true }); }
          finally { await page.locator('[data-edge-reference]').evaluate(e => e.remove()); }
          await page.addScriptTag({ content: `window.inspectEdgePerimeter = ${inspectPerimeter.toString()};` });
          const inspect = async screenshot => {
            return page.evaluate(async ({ png, reference, geometry }) => {
              const decode = async value => {
                const image = new Image(); image.src = 'data:image/png;base64,' + value; await image.decode();
                const output = document.createElement('canvas'); output.width = image.width; output.height = image.height;
                const ctx = output.getContext('2d'); ctx.drawImage(image, 0, 0);
                return { width: image.width, height: image.height, data: ctx.getImageData(0, 0, image.width, image.height).data };
              };
              const a = await decode(png), b = await decode(reference);
              if (a.width !== b.width) throw Error('reference screenshot width differs');
              // Full-page PNGs can round the distant document/footer height by
              // one pixel. Never resize either image; require the entire LCD in
              // both, then inspect their common original-coordinate region.
              const height = Math.min(a.height, b.height);
              if ((geometry.box.y + geometry.box.height) * a.width / geometry.viewportWidth > height) throw Error('LCD outside screenshot');
              return window.inspectEdgePerimeter({ ...geometry, actual: a.data, reference: b.data, width: a.width, height });
            }, { png: screenshot.toString('base64'), reference: reference.toString('base64'),
              geometry: { box: position, viewportWidth: position.viewportWidth,
                bitmap: { width: LCD_WIDTH, height: LCD_HEIGHT }, snake: seed.snake, pad: LCD_PADDING, cell: CELL, status: STATUS_HEIGHT } });
          };
          const probe = await inspect(shot);
          assert.deepEqual(probe.failures, [], `visible perimeter in ${name}: ${JSON.stringify(probe.failures)}`);
          // Negative controls: crop each edge in turn without changing the canvas
          // bitmap or its bounding box. The screenshot probe MUST reject them.
          if (width === 320 && dpr === 1 && profile === 'classic' && !full) {
            for (const edge of ['top', 'right', 'bottom', 'left']) {
              await page.locator('#lcd').evaluate((lcd, { edge, box }) => {
                const scale = box.width / 320;
                const cut = { top: 3 + 37 * scale + 2, right: 3 + 5 * scale + 2, bottom: 3 + 5 * scale + 2, left: 3 + 5 * scale + 2 };
                const inset = ['top', 'right', 'bottom', 'left'].map(e => `${e === edge ? cut[e] : 0}px`).join(' ');
                lcd.style.clipPath = `inset(${inset})`;
              }, { edge, box: metrics.canvas });
              const clipped = await page.screenshot({ path: `test-results/${name}-negative-${edge}.png`, fullPage: true });
              assert.ok((await inspect(clipped)).failures.length, `screenshot probe must detect ${edge} clipping`);
            }
            await page.locator('#lcd').evaluate(e => e.style.removeProperty('clip-path'));
          }
          layouts.push({ edgeFixture: name, ...metrics, screenshotProbe: probe });
        } finally { await context.close(); }
      }
    });
  }
}
