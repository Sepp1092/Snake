import './style.css';
import { Game, directions } from './engine.ts';
import { Menu, titles } from './menu.ts';
import { Persistence, defaults, type Settings } from './storage.ts';
import { capture, restore } from './snapshot.ts';
import { draw, palettes } from './render.ts';
import { RetroAudio, vibrate, type SoundEvent } from './audio.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let local: Storage | null = null;
try { local = window.localStorage; } catch { /* Private browsing fallback. */ }
const persistence = new Persistence(local), settings = persistence.load();
const game = new Game({ level: settings.level, maze: settings.maze, walls: settings.walls });
game.best = persistence.best();
const saved = persistence.loadSnapshot();
if (saved) restore(game, saved);
const menu = new Menu(), audio = new RetroAudio();
const canvas = $<HTMLCanvasElement>('game'), screen = $('screen'), lcd = $('lcd'), status = $('status');
let mode: 'boot' | 'standby' | 'menu' | 'game' = 'boot';
let nextTick = 0, lastScreen = '', notice = '', lastSave = 0, recordSignalled = false;
const dialog = $<HTMLDialogElement>('confirm');
const morePanel = $<HTMLDialogElement>('more-panel');
const compactLayout = window.matchMedia('(max-width: 600px), (max-width: 960px) and (max-height: 500px)');
let pending: (() => void) | null = null;
const feedback = (event: SoundEvent) => { audio.signal(settings.sound, settings.volume, event); vibrate(settings.vibration, event); };
const hasRound = () => game.phase === 'playing' || game.phase === 'paused';
function saveRound() {
  const snapshot = capture(game);
  if (snapshot) persistence.saveSnapshot(snapshot);
  lastSave = performance.now();
}
function confirmAction(title: string, message: string, action: () => void) {
  if (dialog.open) return;
  pause(); pending = action;
  $('confirm-title').textContent = title; $('confirm-message').textContent = message;
  dialog.showModal(); $('confirm-no').focus();
}
function requestNewGame() {
  if (hasRound()) confirmAction('Neues Spiel?', 'Deine gespeicherte Partie wird ersetzt. Wirklich neu beginnen?', newGame);
  else newGame();
}
function finishBoot() {
  mode = game.phase === 'paused' ? 'game' : 'standby';
  if (game.phase === 'paused') notice = 'Spielstand geladen · pausiert · 5: Weiter';
  render();
}
function applySettings() {
  const colors = palettes[settings.lcd];
  for (const [name, color] of Object.entries(colors)) document.documentElement.style.setProperty('--' + name, color);
  document.body.classList.toggle('full', settings.full);
  document.body.classList.toggle('modern', settings.profile === 'modern');
  if (morePanel.open) morePanel.close();
  $('profile').textContent = settings.profile === 'modern' ? 'Profil: Modern' : 'Profil: Classic';
  $('profile').setAttribute('aria-pressed', String(settings.profile === 'modern'));
  $('view').textContent = settings.full ? '▣ Nokia-Ansicht' : '▣ Vollbildansicht';
  $('view').setAttribute('aria-pressed', String(settings.full));
  $('view').setAttribute('aria-label', settings.full ? 'Zur Nokia-Ansicht wechseln' : 'Zur Vollbildansicht wechseln');
  updateViewLabel();
  $('sound').textContent = settings.sound ? '♪ Ton an' : '♪ Ton aus';
  $('sound').setAttribute('aria-pressed', String(settings.sound));
}
function updateViewLabel() {
  $('view').textContent = compactLayout.matches && settings.profile === 'modern'
    ? settings.full ? 'Nokia' : 'Vollbild'
    : settings.full ? '▣ Nokia-Ansicht' : '▣ Vollbildansicht';
}
compactLayout.addEventListener('change', () => {
  updateViewLabel();
  if (!compactLayout.matches && morePanel.open) morePanel.close();
});
function save() { persistence.save(settings); applySettings(); }
function newGame() {
  game.options = { level: settings.level, maze: settings.maze, walls: settings.walls };
  game.reset(); recordSignalled = false; mode = 'game'; nextTick = performance.now() + game.interval;
  notice = ''; saveRound(); feedback('start'); render();
}
function resume() { if (dialog.open || morePanel.open || game.phase !== 'paused') return; game.resume(); mode = 'game'; nextTick = performance.now() + game.interval; notice = ''; render(); }
function pause(automatic = false) {
  if (game.phase === 'playing') { game.pause(); saveRound(); notice = automatic ? 'Automatisch pausiert' : ''; render(); }
}
function showMenu() { pause(); mode = 'menu'; menu.home(); notice = ''; render(); }
function togglePause() {
  if (mode !== 'game') return;
  if (game.phase === 'playing') { pause(); feedback('pause'); } else if (game.phase === 'paused') resume();
}
function setText(element: HTMLElement, text: string) { if (element.textContent !== text) element.textContent = text; }
function render() {
  if (mode === 'game') draw(canvas, game, settings);
  if (canvas.hidden !== (mode !== 'game')) canvas.hidden = mode !== 'game';
  if (screen.hidden !== (mode === 'game')) screen.hidden = mode === 'game';
  menu.hasSaved = hasRound();
  const current = menu.current;
  if (mode === 'boot') screen.innerHTML = '<div class="boot"><div class="handshake">▐▰▰▰▰▌</div><strong>NOKIA</strong><span>CONNECTING PEOPLE</span><button data-act="ok">Willkommen</button></div>';
  else if (mode === 'standby') screen.innerHTML = '<div class="lcd-top"><span>▂▄▆█</span><span>▰▰▰ ▯</span></div><div class="standby"><span>RETRO MOBILE</span><strong>Snake II</strong><span>Bereit für eine neue Runde?</span><div class="pixel-snake">▰▰▰▰<br>▰<br>▰▰▰ &nbsp;▪</div></div><div class="softlabels"><button data-act="ok">Menü</button><span>2001</span></div>';
  else if (mode === 'menu') {
    const items = menu.items, start = settings.profile === 'modern' ? 0 : Math.max(0, Math.min(current.index - 2, items.length - 4));
    const list = items.slice(start, settings.profile === 'modern' ? items.length : start + 4).map((item, offset) => {
      const selected = current.index === start + offset;
      const checked = item.action && String(settings[item.action as keyof Settings]) === String(item.value);
      return `<button class="menu-item ${selected ? 'selected' : ''}" data-index="${start + offset}" aria-current="${selected ? 'true' : 'false'}">${checked ? '●' : item.menu ? '›' : '·'} ${item.label}</button>`;
    }).join('');
    const highscore = `<div class="highscore"><span>♛ REKORD</span><strong>${String(game.best).padStart(4, '0')}</strong><span>Punkte · auf diesem Gerät</span><small>${persistence.available ? 'Seit deiner ersten Runde.' : 'Speicherung nicht verfügbar.'}</small></div>`;
    screen.innerHTML = `<div class="lcd-top"><strong>${titles[current.id]}</strong><span>${items.length ? `${current.index + 1}/${items.length}` : '★'}</span></div><div class="menu-content">${current.id === 'highscores' ? highscore : list}</div><div class="softlabels"><button data-act="ok">${items.length ? 'Wählen' : 'OK'}</button><button data-act="back">Zurück</button></div>`;
    if (settings.profile === 'modern') {
      const selected = screen.querySelector<HTMLElement>('.selected'), list = screen.querySelector<HTMLElement>('.menu-content');
      if (selected && list) list.scrollTop = Math.max(0, selected.offsetTop - list.offsetTop - list.clientHeight / 2);
    }
  }
  const identity = mode + ':' + current.id;
  if (identity !== lastScreen) { screen.classList.remove('menu-enter'); void screen.offsetWidth; screen.classList.add('menu-enter'); lastScreen = identity; }
  const displayPhase = mode === 'game' ? game.phase : mode;
  if (lcd.dataset.phase !== displayPhase) lcd.dataset.phase = displayPhase;
  if (document.body.dataset.scene !== mode) document.body.dataset.scene = mode;
  const messages = { ready: 'Bereit', playing: `Spielt · Punkte: ${game.score}`, paused: 'Pausiert · 5: Weiter · Menü: Optionen', over: `Game Over · ${game.score} Punkte`, won: `Gewonnen! · ${game.score} Punkte` };
  setText(status, notice || (mode === 'game' ? messages[game.phase] : mode === 'menu' ? `${titles[current.id]} · ▲ ▼ wählen · 5 bestätigen` : 'Ein Klassiker. Eine Runde geht noch.'));
  const label = `Snake II · ${messages[game.phase]}`;
  if (canvas.getAttribute('aria-label') !== label) canvas.setAttribute('aria-label', label);
  setText($('pause'), game.phase === 'paused' ? 'Weiter' : 'Pause');
  if ($('resume').hidden !== (game.phase !== 'paused')) $('resume').hidden = game.phase !== 'paused';
  setText($('comfort'), `Punkte ${game.score} · Rekord ${game.best} · Stufe ${game.options.level} · ${game.options.walls === 'wrap' ? 'Durchgang' : 'Wand'}${persistence.available ? '' : ' · Speicherung nicht verfügbar'}`);
}
function selectMenu() {
  const item = menu.select();
  if (!item) { menu.back(); render(); return; }
  if (item.action === 'new') { requestNewGame(); return; }
  if (item.action === 'resume') { resume(); return; }
  if (item.action === 'defaults') {
    confirmAction('Einstellungen zurücksetzen?', 'Nur Einstellungen zurücksetzen. Rekorde und gespeicherte Partie bleiben erhalten.', () => {
      Object.assign(settings, defaults); save(); notice = 'Standardeinstellungen wiederhergestellt'; render();
    }); return;
  }
  if (item.action && item.value !== undefined) {
    switch (item.action) {
      case 'level': settings.level = Number(item.value); break;
      case 'maze': settings.maze = Number(item.value); break;
      case 'walls': settings.walls = item.value as Settings['walls']; break;
      case 'sound': settings.sound = item.value === 'true'; break;
      case 'lcd': settings.lcd = item.value as Settings['lcd']; break;
      case 'control': settings.control = item.value as Settings['control']; break;
      case 'profile': settings.profile = item.value as Settings['profile']; break;
      case 'full': settings.full = item.value === 'true'; break;
      case 'volume': settings.volume = Number(item.value); break;
      case 'vibration': settings.vibration = item.value === 'true'; break;
    }
    save(); menu.back();
    notice = ['level', 'maze', 'walls'].includes(item.action) && game.phase === 'paused' ? 'Gespeichert · gilt ab dem nächsten Spiel' : 'Gespeichert';
  }
  render();
}
function act(action: string, source: 'key' | 'touch' = 'key') {
  if (dialog.open || morePanel.open || action === 'noop') return;
  if (action === 'sound') { settings.sound = !settings.sound; save(); feedback('menu'); render(); return; }
  if (action === 'restart') { requestNewGame(); return; }
  if (mode === 'boot') { finishBoot(); return; }
  if (mode === 'standby') { mode = 'menu'; menu.home(); feedback('menu'); render(); return; }
  if (mode === 'menu') {
    notice = '';
    if (action === 'up') menu.move(-1);
    else if (action === 'down') menu.move(1);
    else if (action === 'ok' || action === 'right') { selectMenu(); feedback('menu'); return; }
    else if (action === 'back' || action === 'left') {
      if (!menu.back()) { if (game.phase === 'paused') mode = 'game'; else mode = 'standby'; }
    }
    feedback('menu'); render(); return;
  }
  if (action in directions) {
    if (source === 'touch' && settings.control === 'swipe') return;
    game.turn(directions[action as keyof typeof directions]);
  } else if (action === 'pause' || action === 'back') togglePause();
  else if (action === 'ok') {
    if (game.phase === 'paused') resume();
    else if (game.phase === 'over' || game.phase === 'won' || game.phase === 'ready') newGame();
  }
}
document.addEventListener('keydown', e => {
  if (dialog.open || morePanel.open) return;
  if (e.ctrlKey || e.metaKey || e.altKey || (e.target instanceof HTMLElement && (e.target.matches('input,select,textarea') || e.target.isContentEditable))) return;
  const action = ({ arrowup: 'up', w: 'up', '2': 'up', arrowdown: 'down', s: 'down', '8': 'down', arrowleft: 'left', a: 'left', '4': 'left', arrowright: 'right', d: 'right', '6': 'right', ' ': 'pause', '0': 'pause', enter: 'ok', '5': 'ok', escape: 'back', backspace: 'back', '*': 'restart', '#': 'sound' } as Record<string, string>)[e.key.toLowerCase()];
  // Native buttons retain Enter/Space activation when explicitly focused.
  if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof HTMLButtonElement) { if (e.repeat) e.preventDefault(); return; }
  if (action) { e.preventDefault(); if (!e.repeat) act(action); }
});
document.querySelectorAll<HTMLElement>('.keys [data-act], .full-controls [data-act]').forEach(button => {
  button.addEventListener('pointerdown', e => { if (e.button !== 0) return; e.preventDefault(); button.setPointerCapture(e.pointerId); button.classList.add('pressed'); act(button.dataset.act!, 'touch'); });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, () => button.classList.remove('pressed'));
  button.addEventListener('click', e => { if (e.detail === 0) act(button.dataset.act!); });
});
screen.addEventListener('click', e => {
  const target = (e.target as HTMLElement).closest<HTMLElement>('button');
  if (!target) return;
  if (target.dataset.index !== undefined) { menu.current.index = Number(target.dataset.index); selectMenu(); feedback('menu'); }
  else if (target.dataset.act) act(target.dataset.act);
});
let gesture: { x: number; y: number; id: number; moved: boolean } | null = null;
lcd.addEventListener('pointerdown', e => {
  if (dialog.open || morePanel.open || mode !== 'game' || settings.control === 'keys' || !e.isPrimary || e.button !== 0) return;
  e.preventDefault(); lcd.setPointerCapture(e.pointerId); gesture = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
});
lcd.addEventListener('pointermove', e => {
  if (!gesture || e.pointerId !== gesture.id) return;
  const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 14 || Math.abs(Math.abs(dx) - Math.abs(dy)) < 5) return;
  game.turn(Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) });
  gesture.x = e.clientX; gesture.y = e.clientY; gesture.moved = true;
});
lcd.addEventListener('pointerup', e => { if (gesture?.id === e.pointerId) { if (!gesture.moved && game.phase !== 'playing') act('ok'); gesture = null; } });
for (const event of ['pointercancel', 'lostpointercapture']) lcd.addEventListener(event, () => { gesture = null; });
$('start').onclick = requestNewGame;
$('restart').onclick = requestNewGame;
$('resume').onclick = resume;
$('settings').onclick = () => { showMenu(); menu.stack.push({ id: 'settings', index: 0 }); render(); };
$('more').onclick = () => { pause(); morePanel.showModal(); };
$('more-close').onclick = () => morePanel.close();
$('more-restart').onclick = () => { morePanel.close(); requestNewGame(); };
$('more-settings').onclick = () => { morePanel.close(); $('settings').click(); };
$('more-profile').onclick = () => { morePanel.close(); settings.profile = 'classic'; save(); render(); };
$('profile').onclick = () => { settings.profile = settings.profile === 'classic' ? 'modern' : 'classic'; save(); render(); };
$('confirm-no').onclick = () => { pending = null; dialog.close(); };
$('confirm-yes').onclick = () => { const action = pending; pending = null; dialog.close(); action?.(); };
dialog.addEventListener('cancel', () => { pending = null; });
$('pause').onclick = () => { if (game.phase === 'paused') resume(); else togglePause(); };
$('menu').onclick = showMenu;
$('sound').onclick = () => act('sound');
$('view').onclick = () => { settings.full = !settings.full; save(); render(); };
window.addEventListener('blur', () => pause(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });
window.addEventListener('pagehide', () => { if (game.phase === 'playing') pause(true); else if (game.phase === 'paused') saveRound(); });
function tick(now: number) {
  if (mode === 'game' && game.phase === 'playing' && now >= nextTick) {
    // Never catch up multiple invisible steps after a throttled or blocked frame.
    nextTick = now + game.interval;
    const previousBest = game.best, result = game.step();
    if (game.best > previousBest) persistence.saveBest(game.best);
    if (result === 'eat' || result === 'bonus') {
      if (game.best > previousBest && !recordSignalled) { feedback('record'); recordSignalled = true; }
      else feedback(result);
    }
    if (result === 'over' || result === 'won') {
      persistence.clearSnapshot(); feedback(result === 'over' ? 'over' : 'record');
    } else if (result === 'eat' || result === 'bonus' || now - lastSave >= 1000) saveRound();
    render();
  }
  requestAnimationFrame(tick);
}
applySettings(); render(); requestAnimationFrame(tick);
setTimeout(() => { if (mode === 'boot') finishBoot(); }, 1700);
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('./sw.js').catch(() => { /* Offline support is optional. */ }); });
}
