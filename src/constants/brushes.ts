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

// Brush defaults
export const DEFAULT_BRUSH_SIZE = 20;
export const DEFAULT_THINNING = 0.6;
export const DEFAULT_SMOOTHING = 0.5;
export const DEFAULT_STREAMLINE = 0.5;
export const DEFAULT_STABILIZER = 4;
export const DEFAULT_TAPER = 0;
export const DEFAULT_OPACITY = 1;
export const DEFAULT_GRAIN = 0;

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

export const LETTER_SPACING_MIN = -100;
export const LETTER_SPACING_MAX = 300;
export const LETTER_SPACING_STEP = 10;
export const DEFAULT_LETTER_SPACING = 0;
