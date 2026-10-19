export type PadAction = 'up' | 'down' | 'left' | 'right' | 'ok' | 'back' | 'pause';
export interface Pad { index: number; id: string; connected: boolean; mapping: string; axes: readonly number[]; buttons: readonly { pressed: boolean; value: number }[] }
export interface PadResult { supported: boolean; connected: number; standard: number; actions: PadAction[] }
/** Input edges only. Held controls never fill the Snake queue or repeat menu actions. */
export class GamepadInput {
  private held = new Set<string>();
  private stick: PadAction | null = null;
  private selected = '';
  private needsNeutral = false;
  suspend() { this.needsNeutral = true; }
  poll(read: (() => readonly (Pad | null)[]) | undefined, enabled = true, active = true): PadResult {
    if (!active) this.needsNeutral = true;
    let pads: readonly (Pad | null)[];
    try { if (!read) throw Error('unavailable'); pads = read(); }
    catch { this.held.clear(); this.stick = null; return { supported: false, connected: 0, standard: 0, actions: [] }; }
    const connected = pads.filter((p): p is Pad => !!p?.connected);
    const standard = connected.filter(p => p.mapping === 'standard');
    const pad = standard[0], next = new Set<string>(), actions: PadAction[] = [];
    const selected = pad ? `${pad.index}:${pad.id}` : '';
    if (selected !== this.selected) { this.stick = null; this.selected = selected; }
    if (pad) {
      const pressed = (i: number) => pad.buttons[i]?.pressed || (pad.buttons[i]?.value ?? 0) > .5;
      const x = Number.isFinite(pad.axes[0]) ? pad.axes[0] : 0, y = Number.isFinite(pad.axes[1]) ? pad.axes[1] : 0;
      const magnitude = Math.max(Math.abs(x), Math.abs(y));
      const direction = magnitude >= .55 ? (Math.abs(x) > Math.abs(y) ? x > 0 ? 'right' : 'left' : y > 0 ? 'down' : 'up') : null;
      this.stick = direction ?? (magnitude > .35 ? this.stick : null);
      const dpad = pressed(12) ? 'up' : pressed(13) ? 'down' : pressed(14) ? 'left' : pressed(15) ? 'right' : null;
      for (const action of [dpad ?? this.stick, pressed(0) ? 'ok' : null, pressed(1) ? 'back' : null, pressed(9) ? 'pause' : null] as (PadAction | null)[]) {
        if (!action) continue;
        const key = `${pad.index}:${pad.id}:${action}`; next.add(key);
        if (!this.held.has(key) && enabled && active) actions.push(action);
      }
    } else this.stick = null;
    this.held = next;
    if (this.needsNeutral) { actions.length = 0; if (active && !next.size) this.needsNeutral = false; }
    return { supported: true, connected: connected.length, standard: standard.length, actions };
  }
}
