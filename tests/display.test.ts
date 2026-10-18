import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COLS, ROWS } from '../src/engine.ts';
import { CELL, STATUS_HEIGHT, LCD_PADDING, LCD_WIDTH, LCD_HEIGHT } from '../src/display.ts';

test('LCD bitmap retains 26 × 17 twelve-pixel cells, 32-pixel status and four-pixel reserve', () => {
  assert.deepEqual([COLS, ROWS, CELL, STATUS_HEIGHT, LCD_PADDING, LCD_WIDTH, LCD_HEIGHT], [26, 17, 12, 32, 4, 320, 244]);
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, new RegExp(`<canvas[^>]+width="${LCD_WIDTH}" height="${LCD_HEIGHT}"`));
});

test('artwork in all corners and every bottom-row cell fits inside the reserved LCD area', () => {
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const left = LCD_PADDING + x * CELL + 1, top = LCD_PADDING + STATUS_HEIGHT + y * CELL + 1;
    assert.ok(left >= LCD_PADDING && top >= LCD_PADDING + STATUS_HEIGHT);
    assert.ok(left + 10 <= LCD_WIDTH - LCD_PADDING);
    assert.ok(top + 10 <= LCD_HEIGHT - LCD_PADDING);
  }
  assert.equal(LCD_HEIGHT - (LCD_PADDING + STATUS_HEIGHT + (ROWS - 1) * CELL + 11), 5);
});
