// Pure screenshot inspection, also exercised with synthetic rasters in Node tests.
// Coordinates refer to pixel CENTRES in the actual PNG, not to nominal DPR.
export function inspectPerimeter({ actual, reference, width, height, box, bitmap, snake, pad, cell, status, viewportWidth }) {
  const scale = width / viewportWidth;
  const palette = { ink: [41, 62, 40], mid: [83, 108, 64], paper: [170, 189, 131], light: [182, 201, 145], grid: [135, 155, 107] };
  const kind = (data, x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 'outside';
    const i = (y * width + x) * 4;
    if (data[i + 3] !== 255) return 'transparent';
    // Only small LCD scanline compositing differences are permitted. Paper is
    // never accepted as snake; this is stricter than the old broad RGB cutoffs.
    for (const [name, rgb] of Object.entries(palette)) {
      if (rgb.every((v, n) => Math.abs(data[i + n] - v) <= 12)) return name;
    }
    return 'other';
  };
  const projectX = x => (box.x + x * box.width / bitmap.width) * scale;
  const projectY = y => (box.y + y * box.height / bitmap.height) * scale;
  const failures = [], segments = [];
  for (const p of snake) {
    const x0 = pad + p.x * cell + 1, y0 = pad + status + p.y * cell + 1;
    const inner = new Set();
    // A 3×3 set well INSIDE the ten-pixel artwork, not the last source row.
    for (const dy of [3, 5, 7]) for (const dx of [3, 5, 7]) {
      const x = Math.floor(projectX(x0 + dx)), y = Math.floor(projectY(y0 + dy));
      if (['ink', 'mid'].includes(kind(reference, x, y))) inner.add(`${x},${y}`);
    }
    let expectedPixels = 0, missingPixels = 0;
    // Check the complete reference silhouette too, including its final visible
    // row/column. Merely moving the single probe to the centre would miss clips.
    for (let y = Math.max(0, Math.floor(projectY(y0)) - 1); y < Math.min(height, Math.ceil(projectY(y0 + 10)) + 1); y++) {
      for (let x = Math.max(0, Math.floor(projectX(x0)) - 1); x < Math.min(width, Math.ceil(projectX(x0 + 10)) + 1); x++) {
        const expected = kind(reference, x, y);
        if (expected !== 'ink' && expected !== 'mid') continue;
        expectedPixels++;
        if (kind(actual, x, y) !== expected) {
          missingPixels++;
          if (failures.length < 12) failures.push({ cell: p, pixel: { x, y }, expected, actual: kind(actual, x, y) });
        }
      }
    }
    if (inner.size < 4 || !expectedPixels) failures.push({ cell: p, reason: 'reference has insufficient distinct interior points', inner: inner.size, expectedPixels });
    for (const point of inner) {
      const [x, y] = point.split(',').map(Number);
      if (kind(actual, x, y) !== kind(reference, x, y) && failures.length < 12) failures.push({ cell: p, pixel: { x, y }, reason: 'interior mismatch' });
    }
    segments.push({ cell: p, interiorPoints: inner.size, expectedPixels, missingPixels });
  }
  return { scale, failures, segments };
}
