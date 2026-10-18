import { COLS, ROWS } from './engine.ts';

// Logical LCD pixels: retain the engine grid and the original cell artwork.
export const CELL = 12;
export const STATUS_HEIGHT = 32;
export const LCD_PADDING = 4;
export const BOARD_WIDTH = COLS * CELL;
export const BOARD_HEIGHT = ROWS * CELL;
export const LCD_WIDTH = BOARD_WIDTH + LCD_PADDING * 2;
export const LCD_HEIGHT = STATUS_HEIGHT + BOARD_HEIGHT + LCD_PADDING * 2;
