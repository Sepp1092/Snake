import assert from 'node:assert/strict';
import { validateSnapshot } from '../src/snapshot.ts';
import { CELL, STATUS_HEIGHT, LCD_PADDING, LCD_WIDTH, LCD_HEIGHT } from '../src/display.ts';

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
            const cells = [];
            for (const p of g.snake) {
              // All ten artwork rows/columns are present, including the very last bottom pixel.
              for (let y = 1; y <= 10; y++) for (let x = 1; x <= 10; x++) {
                if (p.x === 0 && p.y === 0) continue; // head eye uses the light colour
                cells.push(rgb(g.pad + p.x * g.cell + x, g.pad + g.status + p.y * g.cell + y));
              }
            }
            return { width: canvas.width, height: canvas.height, dpr: devicePixelRatio,
              canvas: { x: c.x, y: c.y, right: c.right, bottom: c.bottom, width: c.width, height: c.height },
              content: { left, top, right, bottom }, smoothing: ctx.imageSmoothingEnabled, rendering: getComputedStyle(canvas).imageRendering,
              allBodyPixels: cells.every(v => v.join() === '83,108,64,255'),
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
          // Inspect the composited browser screenshot too: canvas-only checks cannot detect CSS clipping.
          const samples = await page.evaluate(async ({ png, box, scale, snake, pad, cell, status }) => {
            const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode();
            const output = document.createElement('canvas'); output.width = image.width; output.height = image.height;
            const ctx = output.getContext('2d'); ctx.drawImage(image, 0, 0);
            return snake.map(p => {
              const x = Math.floor((box.x + (pad + p.x * cell + 6) * box.width / 320) * scale);
              const y = Math.floor((box.y + (pad + status + p.y * cell + 9.5) * box.height / 244) * scale);
              return Array.from(ctx.getImageData(x, y, 1, 1).data);
            });
          }, { png: shot.toString('base64'), box: metrics.canvas, scale: dpr, snake: seed.snake, pad: LCD_PADDING, cell: CELL, status: STATUS_HEIGHT });
          for (const p of samples) assert.ok(p[0] < 130 && p[1] < 150 && p[2] < 110 && p[3] === 255, `visible perimeter in ${name}: ${p}`);
          layouts.push({ edgeFixture: name, ...metrics });
        } finally { await context.close(); }
      }
    });
  }
}
