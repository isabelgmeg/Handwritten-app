/**
 * Brush Type Configurations and Metadata
 */

import type { BrushType } from "@/types";

export interface BrushConfig {
  type: BrushType;
  label: string;
  description: string;
}

export const BRUSH_CONFIGS: BrushConfig[] = [
  { type: "round", label: "Round", description: "Standard round brush" },
  { type: "inkpen", label: "Ink Pen", description: "Fine-tipped pen" },
  {
    type: "calligraphy",
    label: "Calligraphy",
    description: "Calligraphy brush",
  },
  { type: "ballpoint", label: "Ballpoint", description: "Ballpoint pen" },
  {
    type: "brushpen",
    label: "Brush Pen",
    description: "Brush pen with bristles",
  },
  { type: "marker", label: "Marker", description: "Marker pen" },
  { type: "chisel", label: "Chisel", description: "Chisel tip brush" },
];

// Global defaults (also used as the "round" brush defaults)
export const DEFAULT_BRUSH_SIZE = 20;
export const DEFAULT_THINNING = 0.6;
export const DEFAULT_SMOOTHING = 0.5;
export const DEFAULT_STREAMLINE = 0.5;
export const DEFAULT_STABILIZER = 4;
export const DEFAULT_TAPER = 0;
export const DEFAULT_OPACITY = 1;
export const DEFAULT_GRAIN = 0;

export interface BrushDefaults {
  brushSize: number;
  thinning: number;
  smoothing: number;
  streamline: number;
  taper: number;
  grain: number;
}

/** Per-brush default settings applied automatically when switching brush type. */
export const BRUSH_DEFAULTS: Record<BrushType, BrushDefaults> = {
  round:       { brushSize: 20, thinning: 0.6,  smoothing: 0.5, streamline: 0.5, taper: 0,  grain: 0  },
  inkpen:      { brushSize: 12, thinning: 0.7,  smoothing: 0.5, streamline: 0.5, taper: 50, grain: 0  },
  calligraphy: { brushSize: 28, thinning: 0.8,  smoothing: 0.6, streamline: 0.5, taper: 20, grain: 0  },
  ballpoint:   { brushSize: 14, thinning: 0.1,  smoothing: 0.6, streamline: 0.6, taper: 0,  grain: 35 },
  brushpen:    { brushSize: 24, thinning: 0.8,  smoothing: 0.6, streamline: 0.5, taper: 60, grain: 0  },
  marker:      { brushSize: 32, thinning: 0.15, smoothing: 0.5, streamline: 0.5, taper: 0,  grain: 0  },
  chisel:      { brushSize: 30, thinning: 0.9,  smoothing: 0.5, streamline: 0.4, taper: 0,  grain: 0  },
};

// Brush size constraints
export const BRUSH_SIZE_MIN = 4;
export const BRUSH_SIZE_MAX = 48;
export const BRUSH_SIZE_STEP = 2;

// Stabilizer constraints (lazy brush radius)
export const STABILIZER_MIN = 0;
export const STABILIZER_MAX = 30;
export const STABILIZER_STEP = 1;

// Opacity constraints
export const OPACITY_MIN = 0.2;
export const OPACITY_MAX = 1;
export const OPACITY_STEP = 0.05;

// Stroke quality parameter ranges
export const THINNING_MIN = -1;
export const THINNING_MAX = 1;
export const THINNING_STEP = 0.05;

export const SMOOTHING_MIN = 0;
export const SMOOTHING_MAX = 1;
export const SMOOTHING_STEP = 0.05;

export const STREAMLINE_MIN = 0;
export const STREAMLINE_MAX = 0.99;
export const STREAMLINE_STEP = 0.05;

export const TAPER_MIN = 0;
export const TAPER_MAX = 100;
export const TAPER_STEP = 5;

// Ink color — dark oak-blood: near-black with deep warm red undertone
export const INK_COLOR = "#180806";

// Grain/texture constraints
export const GRAIN_MIN = 0;
export const GRAIN_MAX = 100;
export const GRAIN_STEP = 5;

export const GRAIN_TEXTURE_SIZE = 256;

// Preview settings
export const PREVIEW_SIZE_MIN = 16;
export const PREVIEW_SIZE_MAX = 96;
export const PREVIEW_SIZE_STEP = 4;
export const DEFAULT_PREVIEW_SIZE = 40;

export const LETTER_SPACING_MIN = -200;
export const LETTER_SPACING_MAX = 300;
export const LETTER_SPACING_STEP = 10;
export const DEFAULT_LETTER_SPACING = 0;

export const LINE_HEIGHT_MIN = 0.8;
export const LINE_HEIGHT_MAX = 2.5;
export const LINE_HEIGHT_STEP = 0.05;
export const DEFAULT_LINE_HEIGHT = 1.15;
