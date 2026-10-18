export type MenuId = 'main' | 'games' | 'snake' | 'settings' | 'level' | 'maze' | 'highscores' | 'sound' | 'lcd' | 'control' | 'walls' | 'profile' | 'view' | 'volume' | 'vibration';
export type Item = { label: string; menu?: MenuId; action?: string; value?: string | number };
export const titles: Record<MenuId, string> = { main: 'Hauptmenü', games: 'Spiele', snake: 'Snake II', settings: 'Einstellungen', level: 'Spielstufe', maze: 'Labyrinth', highscores: 'Highscores', sound: 'Sound', lcd: 'LCD-Darstellung', control: 'Steuerung', walls: 'Randmodus', profile: 'Darstellungsprofil', view: 'Ansicht', volume: 'Lautstärke', vibration: 'Vibration' };
export const menus: Record<MenuId, Item[]> = {
  main: [{ label: 'Spiele', menu: 'games' }, { label: 'Einstellungen', menu: 'settings' }],
  games: [{ label: 'Snake II', menu: 'snake' }],
  snake: [{ label: 'Neues Spiel', action: 'new' }, { label: 'Spiel fortsetzen', action: 'resume' }, { label: 'Spielstufe', menu: 'level' }, { label: 'Labyrinth', menu: 'maze' }, { label: 'Highscores', menu: 'highscores' }, { label: 'Einstellungen', menu: 'settings' }],
  settings: [{ label: 'Sound', menu: 'sound' }, { label: 'LCD-Darstellung', menu: 'lcd' }, { label: 'Steuerung', menu: 'control' }, { label: 'Randmodus', menu: 'walls' }, { label: 'Darstellungsprofil', menu: 'profile' }, { label: 'Ansicht', menu: 'view' }, { label: 'Lautstärke', menu: 'volume' }, { label: 'Vibration', menu: 'vibration' }, { label: 'Standardeinstellungen', action: 'defaults' }],
  level: Array.from({ length: 9 }, (_, i) => ({ label: `Stufe ${i + 1}`, action: 'level', value: i + 1 })),
  maze: ['Frei', 'Box', 'Kreuz'].map((label, value) => ({ label, action: 'maze', value })),
  highscores: [], sound: [{ label: 'Ein', action: 'sound', value: 'true' }, { label: 'Aus', action: 'sound', value: 'false' }],
  lcd: [{ label: 'Klassisch · Oliv', action: 'lcd', value: 'olive' }, { label: 'Silber', action: 'lcd', value: 'silver' }, { label: 'Bernstein', action: 'lcd', value: 'amber' }, { label: 'Dark LCD', action: 'lcd', value: 'dark' }, { label: 'High Contrast', action: 'lcd', value: 'contrast' }],
  control: [{ label: 'Tasten + Wischen', action: 'control', value: 'both' }, { label: 'Wischen', action: 'control', value: 'swipe' }, { label: 'Bildschirmtasten', action: 'control', value: 'keys' }],
  walls: [{ label: 'Durchgang', action: 'walls', value: 'wrap' }, { label: 'Wand', action: 'walls', value: 'solid' }],
  profile: [{ label: 'Classic', action: 'profile', value: 'classic' }, { label: 'Modern', action: 'profile', value: 'modern' }],
  view: [{ label: 'Nokia', action: 'full', value: 'false' }, { label: 'Vollbild', action: 'full', value: 'true' }],
  volume: Array.from({ length: 5 }, (_, value) => ({ label: value ? `Stufe ${value}` : 'Stumm', action: 'volume', value })),
  vibration: [{ label: 'Aus', action: 'vibration', value: 'false' }, { label: 'Ein (falls unterstützt)', action: 'vibration', value: 'true' }]
};
export class Menu {
  hasSaved = false;
  stack: { id: MenuId; index: number }[] = [{ id: 'main', index: 0 }];
  get current() { return this.stack[this.stack.length - 1]; }
  get items() { return menus[this.current.id].filter(item => item.action !== 'resume' || this.hasSaved); }
  move(delta: number) { const n = this.items.length; if (n) this.current.index = (this.current.index + delta + n) % n; }
  select(): Item | undefined { const item = this.items[this.current.index]; if (item?.menu) this.stack.push({ id: item.menu, index: 0 }); return item; }
  back() { if (this.stack.length > 1) { this.stack.pop(); return true; } return false; }
  home() { this.stack = [{ id: 'main', index: 0 }]; }
}
