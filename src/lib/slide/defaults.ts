import type { Slide } from './types';

// Standard PowerPoint 16:9 dimensions in pixels
// PPTX standard: 33.867cm x 19.05cm at 96 DPI ≈ 1280 x 720
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

export const DEFAULT_SLIDE: Slide = {
  objects: [],
  width: SLIDE_WIDTH,
  height: SLIDE_HEIGHT,
  backgroundColor: '#FFFFFF',
};

export const DEFAULT_FONT_FAMILY = 'Calibri';
export const DEFAULT_FONT_SIZE = 24;