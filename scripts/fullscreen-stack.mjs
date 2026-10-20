import assert from 'node:assert/strict';

/** Presentation contract: surplus portrait height belongs below the controls. */
export function assertFullscreenStack({status,controls},label='fullscreen stack') {
  const gap=controls.y-status.bottom;
  assert.ok(gap>=16-.2&&gap<=32+.2,`${label}: status-to-controls gap ${gap}px must be 16–32px`);
}
