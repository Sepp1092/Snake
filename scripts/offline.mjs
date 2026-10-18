// Content-addressed cache; same output also works below a hosting subdirectory.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'));
const currentAssets = new Set(Object.values(manifest).flatMap(entry => [entry.file, ...(entry.css ?? []), ...(entry.assets ?? [])]));
const files = (await readdir('dist', { recursive: true, withFileTypes: true }))
  .filter(e => e.isFile() && e.name !== 'sw.js')
  .map(e => (e.parentPath + '/' + e.name).replaceAll('\\', '/').replace(/^dist\//, ''))
  // Keep old assets on the server, but cache only the current build and public files.
  .filter(file => !file.startsWith('.vite/') && (!file.startsWith('assets/') || currentAssets.has(file))).sort();
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile('dist/' + file));
const version = hash.digest('hex').slice(0, 12);
await writeFile('dist/sw.js', `
const PREFIX = 'snake3310-' + new URL(self.registration.scope).pathname + '-';
const CACHE = PREFIX + '${version}';
const ASSETS = ${JSON.stringify(files.map(f => './' + f))};
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Navigation URLs (including ?parameters) always use this worker's matching shell.
    const hit = await cache.match(event.request.mode === 'navigate' ? './index.html' : event.request);
    if (hit) return hit;
    try { return await fetch(event.request); }
    catch (error) { if (event.request.mode === 'navigate') return await cache.match('./index.html'); throw error; }
  })());
});
`);
console.log(`Offline cache ${version}: ${files.length} assets`);
