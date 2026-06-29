/**
 * Font Metrics and Canvas Constants
 */

// Canvas dimensions (internal pixels)
export const CANVAS_WIDTH = 420;
export const CANVAS_HEIGHT = 480;

// Baseline positioning (as percentage of canvas height)
export const BASELINE_Y = CANVAS_HEIGHT * 0.74; // 355.2
export const CAP_Y = CANVAS_HEIGHT * 0.19; //  91.2
export const XHEIGHT_Y = CANVAS_HEIGHT * 0.44; // 211.2
export const DESC_Y = CANVAS_HEIGHT * 0.88; // 422.4

// Reference height for scaling glyphs
export const CAP_TO_BASE = BASELINE_Y - CAP_Y; // ~264

// OpenType font metrics (units per em)
export const UPM = 1000;
export const ASCENDER = 800;
export const DESCENDER = -200;

// Italic transformation
export const ITALIC_SHEAR = Math.tan((12 * Math.PI) / 180);

// Advance widths (in font units)
export const GLYPH_ADVANCE_WIDTH_BASE = 520;
export const SPACE_WIDTH = 320;

// Preview canvas settings
export const PREVIEW_PADDING_X = 24;
export const PREVIEW_PADDING_TOP = 24;
export const PREVIEW_LINE_HEIGHT_MULTIPLIER = 1.15;
