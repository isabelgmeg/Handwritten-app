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
export const XHEIGHT_Y = CANVAS_HEIGHT * 0.44; // 211.2
export const DESC_Y = CANVAS_HEIGHT * 0.88; // 422.4

// The grey template letter is set at this em size. Its lowercase lands on the
// x guide; the cap guide sits where its capitals actually end.
export const TEMPLATE_EM_PX = CANVAS_HEIGHT * 0.55; // 264
/** Cap height / em of the default template font (Open Sans: 1462 / 2048) */
export const TEMPLATE_CAP_RATIO = 1462 / 2048;
export const CAP_Y = BASELINE_Y - TEMPLATE_EM_PX * TEMPLATE_CAP_RATIO; // ≈ 166.7

// Reference height for scaling glyphs: baseline to cap guide
export const CAP_TO_BASE = BASELINE_Y - CAP_Y; // ≈ 188.5

/** Before v2 the cap guide sat at 19% of the canvas; old notes keep that scale */
export const LEGACY_CAP_TO_BASE = BASELINE_Y - CANVAS_HEIGHT * 0.19; // 264

// OpenType font metrics (units per em)
export const UPM = 1000;

// Uniform canvas → font scale (same on both axes, so exported glyphs keep the
// proportions they were drawn with). The template cap line maps to
// CAP_HEIGHT_FU and the baseline to 0.
export const CAP_HEIGHT_FU = 700;
export const FU_PER_PX = CAP_HEIGHT_FU / CAP_TO_BASE; // ≈ 3.71
export const X_HEIGHT_FU = Math.round((BASELINE_Y - XHEIGHT_Y) * FU_PER_PX); // ≈ 535

// Line metrics shared by every style in the family. hhea and OS/2 typo carry
// the same values (USE_TYPO_METRICS is set), so line spacing matches on
// macOS and Windows: 900 + 300 = 1.2 em.
export const ASCENDER = 900;
export const DESCENDER = -300;

// Windows clipping bounds: cover the whole drawable canvas plus the widest
// possible stroke radius, identical for every style so nothing is clipped
// and switching styles never changes line height.
const MAX_STROKE_RADIUS_PX = 32; // BRUSH_SIZE_MAX / 2 × brush-pen widening (1.3)
export const WIN_ASCENT = Math.ceil((BASELINE_Y + MAX_STROKE_RADIUS_PX) * FU_PER_PX);
export const WIN_DESCENT = Math.ceil((CANVAS_HEIGHT - BASELINE_Y + MAX_STROKE_RADIUS_PX) * FU_PER_PX);

// Underline: just below the baseline, about one default stroke thick
export const UNDERLINE_POSITION = -130;
export const UNDERLINE_THICKNESS = 50;

// Proportional spacing: blank space each side of a glyph's ink
export const SIDE_BEARING_FU = 40;

// Italic transformation (also written to the font as its italic angle)
export const ITALIC_ANGLE_DEG = 12;
export const ITALIC_SHEAR = Math.tan((ITALIC_ANGLE_DEG * Math.PI) / 180);

// Advance widths (in font units)
// GLYPH_ADVANCE_WIDTH_BASE only drives the on-canvas cell/anchor guides now;
// real advances are proportional (see services/glyphLayout.ts).
export const GLYPH_ADVANCE_WIDTH_BASE = 460;
export const SPACE_WIDTH = 250;

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
