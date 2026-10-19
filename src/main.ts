import './style.css';
import { installMobileLayout } from './mobile-layout.ts';
import { directions } from './engine.ts';
import { GameSession, modeNames, runLabel, challenges, type GameMode } from './modes.ts';
import { Records } from './records.ts';
import { Menu, titles } from './menu.ts';
import { Persistence, defaults, type Settings } from './storage.ts';
import { capture, restore } from './snapshot.ts';
import { draw, palettes } from './render.ts';
import { RetroAudio, vibrate, type SoundEvent } from './audio.ts';
import { Achievements, achievements, achievementProgress, type AchievementId } from './achievements.ts';
import { GamepadInput, type PadAction } from './gamepad.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let local: Storage | null = null;
try { local = window.localStorage; } catch { /* Private browsing fallback. */ }
const persistence = new Persistence(local), settings = persistence.load();
const records = new Records(persistence);
const awards = new Achievements(persistence);
awards.evaluate(records.data); // Silent, evidence-based migration of historical achievements.
const pads = new GamepadInput();
const game = new GameSession({ level: settings.level, maze: settings.maze, walls: settings.walls });
game.best = persistence.best();
const saved = persistence.loadSnapshot();
if (saved) {
  restore(game, saved);
  if (records.isFinalized(game.run.id)) { game.phase = 'ready'; persistence.clearSnapshot(); }
}
game.best = records.best(game.run);
const menu = new Menu(), audio = new RetroAudio();
const canvas = $<HTMLCanvasElement>('game'), screen = $('screen'), lcd = $('lcd'), status = $('status');
let mode: 'boot' | 'standby' | 'menu' | 'game' = 'boot';
let nextTick = 0, lastScreen = '', notice = '', lastSave = 0, recordSignalled = false;
let statsFilter = 0, displayedSecond = -1;
let initializing = true;
const dialog = $<HTMLDialogElement>('confirm');
const intro = $<HTMLDialogElement>('challenge-intro');
const morePanel = $<HTMLDialogElement>('more-panel');
let moreSession: { resume: boolean; queue: typeof game.queue; remainingTick: number } | null = null;
const achievementDialog = $<HTMLDialogElement>('achievement-detail');
let padStatus = 'Kein Controller erkannt', padSeen = false, lastPadPoll = -Infinity;
const awardQueue: AchievementId[] = [];
let awardTimer: ReturnType<typeof setTimeout> | undefined;
function pixelIcon(rows: readonly string[]) {
  return `<span class="achievement-icon" aria-hidden="true">${rows.join('').split('').map(bit => `<i${bit === '1' ? ' class="on"' : ''}></i>`).join('')}</span>`;
}
function announce(ids: AchievementId[]) {
  if (!settings.achievementNotifications) return;
  awardQueue.push(...ids);
  if (awardTimer !== undefined || !awardQueue.length) return;
  const show = () => {
    const id = awardQueue.shift(), toast = $('achievement-toast');
    if (!id || !settings.achievementNotifications) { toast.hidden = true; awardTimer = undefined; return; }
    const a = achievements.find(a => a.id === id)!;
    toast.innerHTML = `${pixelIcon(a.icon)}<span>Erfolg freigeschaltet<br><strong>${a.name}</strong></span>`;
    toast.hidden = false;
    awardTimer = setTimeout(show, 2400);
  };
  show();
}
const compactLayout = window.matchMedia('(max-width: 600px), (max-width: 960px) and (max-height: 500px)');
let pending: (() => void) | null = null;
const feedback = (event: SoundEvent) => { audio.signal(settings.sound, settings.volume, event); vibrate(settings.vibration, event); };
const hasRound = () => game.phase === 'playing' || game.phase === 'paused';
function saveRound() {
  game.advanceClock(); records.sync(game); game.best = records.best(game.run);
  const added = awards.evaluate(records.data, game);
  if (!initializing) announce(added);
  const snapshot = capture(game);
  if (snapshot) persistence.saveSnapshot(snapshot);
  else if (game.phase === 'over' || game.phase === 'won') persistence.clearSnapshot();
  lastSave = performance.now();
}
function confirmAction(title: string, message: string, action: () => void) {
  if (dialog.open) return;
  pause(); pending = action;
  $('confirm-title').textContent = title; $('confirm-message').textContent = message;
  dialog.showModal(); $('confirm-no').focus();
}
function requestNewGame() {
  const begin = () => {
    if (settings.gameMode !== 'challenge') { newGame(); return; }
    if ((game.phase === 'over' || game.phase === 'won') && game.run.mode === 'challenge' && game.run.challenge === settings.challenge) { newGame(); return; }
    const challenge = challenges[settings.challenge];
    $('challenge-title').textContent = challenge.name;
    $('challenge-goal').textContent = `${challenge.description} Stufe ${challenge.options.level}, ${challenge.options.maze === 1 ? 'Box' : challenge.options.maze === 2 ? 'Kreuz' : 'freies Feld'}, feste Randwände. Bonusfutter zählt mit.`;
    intro.showModal();
  };
  if (hasRound()) confirmAction('Neues Spiel?', 'Deine gespeicherte Partie wird ersetzt. Wirklich neu beginnen?', begin);
  else begin();
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
  document.body.dataset.touchLayout = settings.touchLayout;
  document.body.dataset.keySize = settings.keySize;
  document.body.dataset.showControls = String(settings.showControls);
  // A hidden D-pad always leaves swipe input available. No input is generated here.
  if (!settings.showControls && settings.control === 'keys') settings.control = 'both';
  gesture = null;
  document.querySelectorAll('.pressed').forEach(e => e.classList.remove('pressed'));
  if (!settings.achievementNotifications) { awardQueue.length = 0; clearTimeout(awardTimer); awardTimer = undefined; $('achievement-toast').hidden = true; }
  $('view').textContent = settings.full ? '▣ Handy-Ansicht' : '▣ Vollbildansicht';
  $('view').setAttribute('aria-pressed', String(settings.full));
  $('view').setAttribute('aria-label', settings.full ? 'Zur Handy-Ansicht wechseln' : 'Zur Vollbildansicht wechseln');
  updateViewLabel();
  $('sound').textContent = settings.sound ? '♪ Ton an' : '♪ Ton aus';
  $('sound').setAttribute('aria-pressed', String(settings.sound));
  updateMoreState();
}
function updateMoreState() {
  setText($('more-sound'), `Ton: ${settings.sound ? 'an' : 'aus'}`);
  $('more-sound').setAttribute('aria-pressed', String(settings.sound));
  setText($('more-state'), moreSession?.resume ? 'Spiel kurz angehalten. Danach geht es weiter.' : game.phase === 'paused' ? 'Dein Spiel bleibt pausiert.' : 'Weitere Aktionen');
  setText($('more-close'), moreSession?.resume ? 'Weiterspielen' : game.phase === 'paused' ? 'Zurück – pausiert' : 'Schließen');
}
function openMore() {
  if (morePanel.open) return;
  gesture = null;
  document.querySelectorAll('.pressed').forEach(e => e.classList.remove('pressed'));
  const session = { resume: game.phase === 'playing' && mode === 'game', queue: game.queue.map(p => ({ ...p })), remainingTick: Math.max(0, nextTick - performance.now()) };
  if (session.resume) pause();
  session.resume &&= game.phase === 'paused';
  moreSession = session;
  updateMoreState(); morePanel.showModal(); $('more-close').focus();
}
function leaveMore() {
  // Explicit navigation/new-game actions keep their existing pause/confirmation behavior.
  moreSession = null; morePanel.close();
}
morePanel.addEventListener('close', () => {
  if (morePanel.open) return;
  gesture = null;
  document.querySelectorAll('.pressed').forEach(e => e.classList.remove('pressed'));
  const session = moreSession; moreSession = null;
  if (session?.resume && mode === 'game' && game.phase === 'paused' && !document.hidden && document.hasFocus() && !dialog.open && !intro.open) {
    game.resume(); game.queue = session.queue;
    nextTick = performance.now() + session.remainingTick; notice = '';
  }
  render();
});
morePanel.addEventListener('keydown', e => {
  const delta = ['ArrowDown','ArrowRight'].includes(e.key) ? 1 : ['ArrowUp','ArrowLeft'].includes(e.key) ? -1 : 0;
  if (!delta && e.key !== 'Home' && e.key !== 'End') return;
  e.preventDefault();
  const buttons = Array.from(morePanel.querySelectorAll<HTMLButtonElement>('button'));
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  buttons[e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (index + delta + buttons.length) % buttons.length]?.focus();
});
function toggleSound() { settings.sound = !settings.sound; save(); feedback('menu'); render(); }
function updateViewLabel() {
  $('view').textContent = compactLayout.matches
    ? settings.full ? 'Handy' : 'Vollbild'
    : settings.full ? '▣ Handy-Ansicht' : '▣ Vollbildansicht';
}
compactLayout.addEventListener('change', () => {
  updateViewLabel();
  if (!compactLayout.matches && morePanel.open) morePanel.close();
});
function save() { if (!settings.showControls && settings.control === 'keys') settings.control = 'both'; persistence.save(settings); applySettings(); }
function newGame() {
  game.start(settings.gameMode, settings.duration, settings.challenge, { level: settings.level, maze: settings.maze, walls: settings.walls });
  game.best = records.best(game.run); recordSignalled = false; mode = 'game'; nextTick = performance.now() + game.interval;
  notice = ''; saveRound(); feedback('start'); render();
}
function resume() { if (dialog.open || morePanel.open || intro.open || game.phase !== 'paused') return; game.resume(); mode = 'game'; nextTick = performance.now() + game.interval; notice = ''; render(); }
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
  menu.selectedMode = settings.gameMode;
  if (mode === 'menu') {
  const progress = awards.progress(records.data, game);
  menu.achievements = achievements.map(a => ({ label: `${awards.unlocked[a.id] !== undefined ? '●' : '○'} ${a.name}`, icon: a.icon,
    detail: `${awards.unlocked[a.id] !== undefined ? 'Frei' : 'Gesperrt'} · ${achievementProgress(a.id, progress[a.id])}`, action: 'achievement', value: a.id }));
  const modes: (GameMode | 'total')[] = ['total', 'classic', 'zen', 'timeAttack', 'challenge'];
  const filter = modes[statsFilter], counters = filter === 'total' ? records.total() : records.data.modes[filter];
  menu.statistics = [
    { label: `Ansicht: ${filter === 'total' ? 'Gesamt' : modeNames[filter]}`, action: 'cycleStats' },
    ...[[`Partien`, counters.games], ['Aktiv (s)', Math.floor(counters.activeMs / 1000)], ['Futter', counters.food], ['Punkte', counters.points], ['Längste Schlange', counters.longest], ['Kollisionen', counters.collisions], ['Classic-Rekord', records.data.classicBest], ['TA 60s', records.data.timeBest['60']], ['TA 120s', records.data.timeBest['120']], ['TA 180s', records.data.timeBest['180']], ['Challenges', `${records.completedCount()}/3`]].map(([label, value]) => ({ label: `${label}: ${value}`, action: 'noop' }))
  ];
  menu.highscores = [
    { label: `Classic: ${records.data.classicBest}`, action: 'noop' },
    ...[60,120,180].map(s => ({ label: `TA ${s}s: ${records.data.timeBest[String(s) as '60']}`, action: 'noop' })),
    ...Object.entries(challenges).map(([id, c]) => ({ label: `${c.name}: ${records.data.completed[id as 'hunter'] ? 'Ja' : 'Offen'}`, action: 'noop' })),
    { label: 'Zen: ohne Rangliste', action: 'noop' }
  ];
  }
  const current = menu.current;
  if (mode === 'boot') screen.innerHTML = '<div class="boot"><div class="boot-mark" aria-hidden="true">▟▚▞</div><strong>BYTECOIL</strong><span>RETRO SNAKE ARCADE</span><button data-act="ok">Willkommen</button></div>';
  else if (mode === 'standby') screen.innerHTML = '<div class="lcd-top"><span>▂▄▆█</span></div><div class="standby"><span>PIXEL HANDHELD</span><strong>Retro Snake</strong><span>Bereit für eine neue Runde?</span><div class="pixel-snake">▰▰▰▰<br>▰<br>▰▰▰ &nbsp;▪</div></div><div class="softlabels"><button data-act="ok">Menü</button><span>BC-01</span></div>';
  else if (mode === 'menu') {
    const items = menu.items;
    const list = items.map((item, index) => {
      const selected = current.index === index;
      const checked = item.action && item.value !== undefined && String(settings[item.action as keyof Settings]) === String(item.value);
      return `<button class="menu-item ${selected ? 'selected' : ''}${item.icon ? ' award-item' : ''}" data-index="${index}" aria-current="${selected ? 'true' : 'false'}">${item.icon ? pixelIcon(item.icon) : checked ? '●' : item.menu ? '›' : '·'} <span>${item.label}${item.detail ? `<small>${item.detail}</small>` : ''}</span></button>`;
    }).join('');
    screen.innerHTML = `<div class="lcd-top"><strong>${current.id === 'snake' ? modeNames[settings.gameMode] : titles[current.id]}</strong><span>${current.id === 'achievements' ? `${awards.count()}/12` : items.length ? `${current.index + 1}/${items.length}` : '★'}</span></div><div class="menu-content">${list}</div><div class="softlabels"><button data-act="ok">${items.length ? 'Wählen' : 'OK'}</button><button data-act="back">Zurück</button></div>`;
    const selected = screen.querySelector<HTMLElement>('.selected'), menuList = screen.querySelector<HTMLElement>('.menu-content');
    if (selected && menuList) menuList.scrollTop = Math.max(0, selected.offsetTop - menuList.offsetTop - menuList.clientHeight / 2);
  }
  const identity = mode + ':' + current.id;
  if (identity !== lastScreen) { screen.classList.remove('menu-enter'); void screen.offsetWidth; screen.classList.add('menu-enter'); lastScreen = identity; }
  const displayPhase = mode === 'game' ? game.phase : mode;
  if (lcd.dataset.phase !== displayPhase) lcd.dataset.phase = displayPhase;
  lcd.dataset.gameMode = game.run.mode;
  lcd.dataset.remainingMs = String(game.remainingMs);
  displayedSecond = Math.floor(game.run.elapsedMs / 1000);
  if (document.body.dataset.scene !== mode) document.body.dataset.scene = mode;
  const messages = { ready: 'Bereit', playing: `${modeNames[game.run.mode]} · Punkte: ${game.score}`, paused: 'Pausiert · 5: Weiter · Menü: Optionen', over: `${game.run.outcome === 'timeout' ? 'Zeit vorbei' : 'Game Over'} · ${game.score} Punkte`, won: `${game.run.outcome === 'success' ? 'Challenge geschafft!' : 'Gewonnen!'} · ${game.score} Punkte` };
  setText(status, notice || (mode === 'game' ? messages[game.phase] : mode === 'menu' ? `${titles[current.id]} · ▲ ▼ wählen · 5 bestätigen` : 'Ein Klassiker. Eine Runde geht noch.'));
  if (mode === 'menu' && current.id === 'controller') setText(status, padStatus);
  const label = `Retro Snake · ${messages[game.phase]}`;
  if (canvas.getAttribute('aria-label') !== label) canvas.setAttribute('aria-label', label);
  setText($('pause'), game.phase === 'paused' ? 'Weiter' : 'Pause');
  updateMoreState();
  setText($('comfort'), `${modeNames[game.run.mode]} · Punkte ${game.score} · ${runLabel(game)}${game.run.mode === 'classic' || game.run.mode === 'timeAttack' ? ` · Rekord ${game.best}` : ''}${persistence.available ? '' : ' · Speicherung nicht verfügbar'}`);
}
function selectMenu() {
  const item = menu.select();
  if (!item) { menu.back(); render(); return; }
  if (item.action === 'achievement') {
    const a = achievements.find(a => a.id === item.value)!;
    $('achievement-title').textContent = a.name; $('achievement-description').textContent = a.description;
    $('achievement-icon').innerHTML = pixelIcon(a.icon);
    $('achievement-progress').textContent = `${awards.unlocked[a.id] !== undefined ? 'Freigeschaltet' : 'Gesperrt'} · ${achievementProgress(a.id, awards.progress(records.data, game)[a.id])}`;
    achievementDialog.showModal(); return;
  }
  if (item.action === 'chooseMode') { settings.gameMode = item.value as GameMode; save(); render(); return; }
  if (item.action === 'cycleStats') { statsFilter = (statsFilter + 1) % 5; menu.current.index = 0; render(); return; }
  if (item.action === 'challenge') { settings.challenge = item.value as Settings['challenge']; save(); requestNewGame(); return; }
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
      case 'full': settings.full = item.value === 'true'; break;
      case 'volume': settings.volume = Number(item.value); break;
      case 'vibration': settings.vibration = item.value === 'true'; break;
      case 'duration': settings.duration = Number(item.value) as Settings['duration']; break;
      case 'touchLayout': settings.touchLayout = item.value as Settings['touchLayout']; break;
      case 'keySize': settings.keySize = item.value as Settings['keySize']; break;
      case 'controller': settings.controller = item.value === 'true'; pads.suspend(); break;
      case 'achievementNotifications': settings.achievementNotifications = item.value === 'true'; break;
      case 'showControls': settings.showControls = item.value === 'true'; break;
    }
    save(); menu.back();
    notice = ['level', 'maze', 'walls'].includes(item.action) && game.phase === 'paused' ? 'Gespeichert · gilt ab dem nächsten Spiel' : 'Gespeichert';
  }
  render();
}
function act(action: string, source: 'key' | 'touch' | 'gamepad' = 'key') {
  if (dialog.open || morePanel.open || intro.open || achievementDialog.open || action === 'noop') return;
  if (action === 'sound') { toggleSound(); return; }
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
  if (dialog.open || morePanel.open || intro.open || achievementDialog.open) return;
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
  if (dialog.open || morePanel.open || intro.open || achievementDialog.open || mode !== 'game' || settings.control === 'keys' || !e.isPrimary || e.button !== 0) return;
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
$('achievement-close').onclick = () => achievementDialog.close();
$('challenge-start').onclick = () => { intro.close(); newGame(); };
$('challenge-cancel').onclick = () => intro.close();
$('settings').onclick = () => { showMenu(); menu.stack.push({ id: 'settings', index: 0 }); render(); };
$('more').onclick = openMore;
$('more-close').onclick = () => morePanel.close();
$('more-restart').onclick = () => { leaveMore(); $('start').click(); };
$('more-settings').onclick = () => { leaveMore(); $('settings').click(); };
$('more-sound').onclick = () => $('sound').click();
$('confirm-no').onclick = () => { pending = null; dialog.close(); };
$('confirm-yes').onclick = () => { const action = pending; pending = null; dialog.close(); action?.(); };
dialog.addEventListener('cancel', () => { pending = null; });
$('pause').onclick = () => { if (game.phase === 'paused') resume(); else togglePause(); };
$('menu').onclick = showMenu;
$('sound').onclick = toggleSound;
$('view').onclick = () => { settings.full = !settings.full; save(); render(); };
window.addEventListener('blur', () => { if (moreSession) moreSession.resume = false; pads.suspend(); pause(true); updateMoreState(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (moreSession) moreSession.resume = false; pads.suspend(); pause(true); updateMoreState(); } });
window.addEventListener('pagehide', () => { if (game.phase === 'playing') pause(true); else if (game.phase === 'paused') saveRound(); });
function tick(now: number) {
  if (now - lastPadPoll >= 16) {
    lastPadPoll = now;
    const input = pads.poll(settings.controller && typeof navigator.getGamepads === 'function' ? () => navigator.getGamepads() : undefined, settings.controller, !document.hidden && document.hasFocus());
    const label = !settings.controller ? 'Controller aus' : !input.supported ? 'Gamepad API nicht verfügbar' : input.standard ? 'Controller verbunden' : input.connected ? 'Controller ohne Standardbelegung' : 'Kein Controller erkannt';
    padSeen ||= input.connected > 0;
    if (label !== padStatus) { padStatus = label; setText($('controller-status'), label); if (mode === 'menu' && menu.current.id === 'controller') setText(status, label); }
    const hidden = !padSeen && !input.connected;
    if ($('controller-status').hidden !== hidden) $('controller-status').hidden = hidden;
    for (const action of input.actions) padAction(action);
  }
  if (mode === 'game' && game.phase === 'playing') {
    if (game.advanceClock(now)) { saveRound(); feedback('over'); render(); }
    else if (now >= nextTick) {
    // Never catch up multiple invisible steps after a throttled or blocked frame.
    nextTick = now + game.interval;
    const previousBest = records.best(game.run), result = game.step();
    if (result === 'eat' || result === 'bonus') {
      if ((game.run.mode === 'classic' || game.run.mode === 'timeAttack') && game.score > previousBest && !recordSignalled) { feedback('record'); recordSignalled = true; }
      else feedback(result);
    }
    if (result === 'over' || result === 'won') {
      saveRound(); feedback(result === 'over' ? 'over' : 'record');
    } else if (result === 'eat' || result === 'bonus' || now - lastSave >= 1000) saveRound();
    render();
    } else if (displayedSecond !== Math.floor(game.run.elapsedMs / 1000)) render();
  }
  requestAnimationFrame(tick);
}
function padAction(action: PadAction) {
  const activeDialog = [dialog, morePanel, intro, achievementDialog].find(d => d.open);
  if (activeDialog) {
    const buttons = Array.from(activeDialog.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    if (action === 'back') { if (activeDialog === dialog) $('confirm-no').click(); else activeDialog.close(); return; }
    if (action === 'ok') { (document.activeElement instanceof HTMLButtonElement && activeDialog.contains(document.activeElement) ? document.activeElement : buttons[0])?.click(); return; }
    if (['up','down','left','right'].includes(action)) {
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement), delta = action === 'up' || action === 'left' ? -1 : 1;
      buttons[(index + delta + buttons.length) % buttons.length]?.focus();
    }
    return;
  }
  if (action === 'pause' && game.phase === 'paused') { resume(); return; }
  act(action, 'gamepad');
}
if (saved && hasRound()) saveRound();
initializing = false;
applySettings(); render(); installMobileLayout(); requestAnimationFrame(tick);
setTimeout(() => { if (mode === 'boot') finishBoot(); }, 1700);
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('./sw.js').catch(() => { /* Offline support is optional. */ }); });
}
