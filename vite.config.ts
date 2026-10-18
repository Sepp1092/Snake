import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
export default defineConfig({
  base: './',
  plugins: [{
    name: 'inline-load-guard',
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [{ tag: 'script', children: readFileSync(new URL('./scripts/load-guard.js', import.meta.url), 'utf8'), injectTo: 'head-prepend' }];
      }
    }
  }],
  // Existing tabs can still reference an earlier hashed bundle during a local rebuild.
  build: { emptyOutDir: false, manifest: true }
});
