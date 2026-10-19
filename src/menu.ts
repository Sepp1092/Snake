import type { GameMode } from './modes.ts';
export type MenuId = 'main' | 'games' | 'snake' | 'settings' | 'level' | 'maze' | 'highscores' | 'statistics' | 'duration' | 'challenge' | 'sound' | 'lcd' | 'control' | 'walls' | 'view' | 'volume' | 'vibration' | 'achievements' | 'touchLayout' | 'keySize' | 'controller' | 'achievementNotifications' | 'showControls';
export type Item = { label: string; menu?: MenuId; action?: string; value?: string | number; icon?: readonly string[]; detail?: string };
export const titles: Record<MenuId, string> = { achievements: 'Achievements', touchLayout: 'Touch-Layout', keySize: 'Tastengröße', controller: 'Controller', achievementNotifications: 'Erfolgsmeldungen', showControls: 'Steuerkreuz', main: 'Hauptmenü', games: 'Spiele', snake: 'Classic Snake', settings: 'Einstellungen', level: 'Spielstufe', maze: 'Labyrinth', highscores: 'Highscores', statistics: 'Statistik', duration: 'Zeitlimit', challenge: 'Challenges', sound: 'Sound', lcd: 'LCD-Darstellung', control: 'Steuerung', walls: 'Randmodus', view: 'Ansicht', volume: 'Lautstärke', vibration: 'Vibration' };
export const menus: Record<MenuId, Item[]> = {
  main: [{ label: 'Spiele', menu: 'games' }, { label: 'Einstellungen', menu: 'settings' }, { label: 'Statistik', menu: 'statistics' }, { label: 'Highscores', menu: 'highscores' }, { label: 'Achievements', menu: 'achievements' }],
  games: ['classic', 'zen', 'timeAttack', 'challenge'].map((value, i) => ({ label: ['Classic Snake', 'Zen Mode', 'Time Attack', 'Challenge Mode'][i], menu: 'snake' as const, action: 'chooseMode', value })),
  snake: [{ label: 'Neues Spiel', action: 'new' }, { label: 'Spiel fortsetzen', action: 'resume' }, { label: 'Spielstufe', menu: 'level' }, { label: 'Labyrinth', menu: 'maze' }, { label: 'Highscores', menu: 'highscores' }, { label: 'Einstellungen', menu: 'settings' }],
  settings: [{ label: 'Sound', menu: 'sound' }, { label: 'LCD-Darstellung', menu: 'lcd' }, { label: 'Steuerung', menu: 'control' }, { label: 'Randmodus', menu: 'walls' }, { label: 'Ansicht', menu: 'view' }, { label: 'Lautstärke', menu: 'volume' }, { label: 'Vibration', menu: 'vibration' }, { label: 'Touch-Layout', menu: 'touchLayout' }, { label: 'Tastengröße', menu: 'keySize' }, { label: 'Steuerkreuz (Vollbild)', menu: 'showControls' }, { label: 'Controller', menu: 'controller' }, { label: 'Erfolgsmeldungen', menu: 'achievementNotifications' }, { label: 'Standardeinstellungen', action: 'defaults' }],
  level: Array.from({ length: 9 }, (_, i) => ({ label: `Stufe ${i + 1}`, action: 'level', value: i + 1 })),
  maze: ['Frei', 'Box', 'Kreuz'].map((label, value) => ({ label, action: 'maze', value })),
  achievements: [],
  touchLayout: ['Standard','Kompakt','Ergonomisch'].map((label, i) => ({ label, action: 'touchLayout', value: ['standard','compact','ergonomic'][i] })),
  keySize: [{ label: 'Normal', action: 'keySize', value: 'normal' }, { label: 'Groß', action: 'keySize', value: 'large' }],
  controller: [{ label: 'Ein', action: 'controller', value: 'true' }, { label: 'Aus', action: 'controller', value: 'false' }],
  achievementNotifications: [{ label: 'Ein', action: 'achievementNotifications', value: 'true' }, { label: 'Aus', action: 'achievementNotifications', value: 'false' }],
  showControls: [{ label: 'Sichtbar', action: 'showControls', value: 'true' }, { label: 'Ausblenden · Wischen', action: 'showControls', value: 'false' }],
  statistics: [],
  duration: [60, 120, 180].map(value => ({ label: `${value} Sekunden`, action: 'duration', value })),
  challenge: [{ label: 'Food Hunter', action: 'challenge', value: 'hunter' }, { label: 'Survivor', action: 'challenge', value: 'survivor' }, { label: 'Maze Master', action: 'challenge', value: 'maze' }],
  highscores: [], sound: [{ label: 'Ein', action: 'sound', value: 'true' }, { label: 'Aus', action: 'sound', value: 'false' }],
  lcd: [{ label: 'Klassisch · Oliv', action: 'lcd', value: 'olive' }, { label: 'Silber', action: 'lcd', value: 'silver' }, { label: 'Bernstein', action: 'lcd', value: 'amber' }, { label: 'Dark LCD', action: 'lcd', value: 'dark' }, { label: 'High Contrast', action: 'lcd', value: 'contrast' }],
  control: [{ label: 'Tasten + Wischen', action: 'control', value: 'both' }, { label: 'Wischen', action: 'control', value: 'swipe' }, { label: 'Bildschirmtasten', action: 'control', value: 'keys' }],
  walls: [{ label: 'Durchgang', action: 'walls', value: 'wrap' }, { label: 'Wand', action: 'walls', value: 'solid' }],
  view: [{ label: 'Handy', action: 'full', value: 'false' }, { label: 'Vollbild', action: 'full', value: 'true' }],
  volume: Array.from({ length: 5 }, (_, value) => ({ label: value ? `Stufe ${value}` : 'Stumm', action: 'volume', value })),
  vibration: [{ label: 'Aus', action: 'vibration', value: 'false' }, { label: 'Ein (falls unterstützt)', action: 'vibration', value: 'true' }]
};
export class Menu {
  hasSaved = false;
  selectedMode: GameMode = 'classic';
  achievements: Item[] = [];
  statistics: Item[] = [];
  highscores: Item[] = [];
  stack: { id: MenuId; index: number }[] = [{ id: 'main', index: 0 }];
  get current() { return this.stack[this.stack.length - 1]; }
  get items(): Item[] {
    if (this.current.id === 'achievements') return this.achievements;
    if (this.current.id === 'statistics') return this.statistics;
    if (this.current.id === 'highscores') return this.highscores;
    const items = menus[this.current.id].filter(item => item.action !== 'resume' || this.hasSaved);
    if (this.current.id !== 'snake') return items;
    if (this.selectedMode === 'timeAttack') items.splice(1, 0, { label: 'Zeitlimit', menu: 'duration' });
    if (this.selectedMode === 'challenge') return [{ label: 'Neues Spiel', action: 'new' }, { label: 'Herausforderung', menu: 'challenge' }, ...items.filter(item => item.action === 'resume' || item.menu === 'highscores' || item.menu === 'settings')];
    return items;
  }
  move(delta: number) { const n = this.items.length; if (n) this.current.index = (this.current.index + delta + n) % n; }
  select(): Item | undefined { const item = this.items[this.current.index]; if (item?.menu) this.stack.push({ id: item.menu, index: 0 }); return item; }
  back() { if (this.stack.length > 1) { this.stack.pop(); return true; } return false; }
  home() { this.stack = [{ id: 'main', index: 0 }]; }
}
