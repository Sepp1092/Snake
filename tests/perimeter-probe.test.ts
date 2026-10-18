import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectPerimeter } from '../scripts/perimeter-probe.mjs';

function raster(scale = .55, dpr = 1) {
  const width = 512 * dpr, height = 400 * dpr;
  const reference = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < reference.length; i += 4) reference.set([170, 189, 131, 255], i);
  const box = { x: 40.2, y: 10.5, width: 320 * scale, height: 244 * scale };
  const snake = [{ x: 0, y: 0 }, { x: 25, y: 0 }, { x: 25, y: 16 }, { x: 0, y: 16 }];
  // Model a half-device-pixel raster origin difference. Bounds remain inside
  // the predicted segment footprint, but a near-edge nominal probe can miss.
  for (const p of snake) {
    const left = Math.ceil((box.x + (4 + p.x * 12 + 1) * scale) * dpr - .5);
    const top = Math.ceil((box.y + (4 + 32 + p.y * 12 + 1) * scale) * dpr - .5);
    const right = Math.floor((box.x + (4 + p.x * 12 + 11) * scale) * dpr - .5);
    const bottom = Math.floor((box.y + (4 + 32 + p.y * 12 + 11) * scale) * dpr - .5);
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) reference.set([83, 108, 64, 255], (y * width + x) * 4);
  }
  return { actual: reference.slice(), reference, width, height, box, bitmap: { width: 320, height: 244 }, snake, pad: 4, cell: 12, status: 32, viewportWidth: 512 };
}

test('reference raster handles fractional downscaling at DPR 1/2/3 with several interior points in all corners', () => {
  for (const dpr of [1, 2, 3]) for (const scale of [.55, .7, 1.2]) {
    const result = inspectPerimeter(raster(scale, dpr));
    assert.deepEqual(result.failures, []);
    for (const segment of result.segments) assert.ok(segment.interiorPoints >= 4 && segment.expectedPixels > 0);
  }
});

test('old nominal near-edge probe can land on paper although the complete reference silhouette is visible', () => {
  const input = raster(); const { x, y } = input.snake[2];
  const px = Math.floor(input.box.x + (4 + x * 12 + 6) * .55);
  const py = Math.floor(input.box.y + (4 + 32 + y * 12 + 9.5) * .55);
  assert.deepEqual(Array.from(input.actual.slice((py * input.width + px) * 4, (py * input.width + px) * 4 + 4)), [170, 189, 131, 255]);
  assert.deepEqual(inspectPerimeter(input).failures, []);
});

test('one missing physical row or column is rejected at every corner; paper never counts as a segment', () => {
  for (const corner of [0, 1, 2, 3]) for (const axis of ['row', 'column']) {
    const input = raster(); const p = input.snake[corner];
    const result = inspectPerimeter(input).segments[corner]; assert.ok(result.expectedPixels > 0);
    const pixels = [];
    for (let y = 0; y < input.height; y++) for (let x = 0; x < input.width; x++) {
      const i = (y * input.width + x) * 4;
      if (input.reference[i] === 83 && Math.abs(x - (input.box.x + (4 + p.x * 12 + 6) * .55)) < 4 && Math.abs(y - (input.box.y + (4 + 32 + p.y * 12 + 6) * .55)) < 4) pixels.push({ x, y, i });
    }
    const last = Math.max(...pixels.map(p => axis === 'row' ? p.y : p.x));
    for (const pixel of pixels) if ((axis === 'row' ? pixel.y : pixel.x) === last) input.actual.set([170, 189, 131, 255], pixel.i);
    assert.ok(inspectPerimeter(input).failures.some(f => f.cell.x === p.x && f.cell.y === p.y));
  }
});
