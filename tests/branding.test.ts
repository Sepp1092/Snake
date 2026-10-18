import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const uiFiles = ['index.html', 'src/main.ts', 'src/menu.ts', 'src/render.ts', 'public/manifest.webmanifest'];
const prohibited = ['no' + 'kia', 'connecting' + ' people', 'snake' + ' ii'];

test('public interface uses independent Bytecoil identity', () => {
  const html = readFileSync('index.html', 'utf8');
  const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
  assert.match(html, /Bytecoil – Retro Snake/);
  assert.equal(manifest.name, 'Bytecoil – Retro Snake');
  assert.equal(manifest.short_name, 'Bytecoil');
  for (const file of uiFiles) {
    const content = readFileSync(file, 'utf8').toLowerCase();
    for (const word of prohibited) assert.equal(content.includes(word), false, `${file} contains legacy public branding`);
  }
});
