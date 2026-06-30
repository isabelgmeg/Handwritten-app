/**
 * Font Metrics and Canvas Constants
 */

// Canvas dimensions (internal pixels)
export const CANVAS_WIDTH = 420;
export const CANVAS_HEIGHT = 480;

// Effective advance width in canvas pixels — intentionally narrower than CANVAS_WIDTH
// so characters render at a natural ~0.6× cap-height ratio in the preview.
export const ADVANCE_CANVAS_WIDTH = 160;

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
export const GLYPH_ADVANCE_WIDTH_BASE = 460;
export const SPACE_WIDTH = 320;

// Preview canvas settings
export const PREVIEW_PADDING_X = 24;
export const PREVIEW_PADDING_TOP = 24;
export const PREVIEW_LINE_HEIGHT_MULTIPLIER = 1.15;

// Connected script connection zones (canvas pixels)
// Math: EXIT_X - ENTRY_X must equal (BASE_ADVANCE - OVERLAP)/BASE_ADVANCE * ADVANCE_CANVAS_WIDTH
// so that strokes drawn to the guides meet exactly in the preview at default letter spacing.
// 269 - 151 = 118 ≈ (460 - 120)/460 * 160 = 118.3 ✓
export const CONNECT_ENTRY_X = 151;  // entry stroke should arrive here (centered in advance zone)
export const CONNECT_EXIT_X = 269;   // exit stroke should leave here (centered in advance zone)
export const CONNECT_OVERLAP = 120;  // font units subtracted from advance width on export
