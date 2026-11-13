/**
 * Glyph Layout — the single source of truth for how a drawn glyph is placed
 * in a line of text. Used by BOTH the on-screen preview (previewEngine) and
 * the font export (fontGenerator), so what the user previews is what the
 * downloaded font does.
 *
 * Geometry, all derived from the drawing canvas:
 *  - Uniform scale: FU_PER_PX font units per canvas pixel on both axes
 *    (the template cap line lands at CAP_HEIGHT_FU, the baseline at 0).
 *  - Normal mode: proportional spacing. Each glyph's advance is its own ink
 *    width + a side bearing on each side + the user's letter spacing.
 *  - Connected mode: fixed advance between the entry/exit anchors shown on
 *    the canvas, so strokes drawn to the anchors meet in running text.
 */

import getStroke from "perfect-freehand";
import type { Stroke, ScriptMode } from "@/types";
import {
  FU_PER_PX,
  SIDE_BEARING_FU,
  SPACE_WIDTH,
  GLYPH_ADVANCE_WIDTH_BASE,
  ADVANCE_CANVAS_WIDTH,
  CONNECT_OVERLAP,
} from "@/constants";
import { ACCENT_BASE_MAP } from "@/constants/characters";
import { getEffectivePoints } from "@/utils";
import { getAnchorPositions } from "./drawingEngine";

export interface StrokeOutline {
  stroke: Stroke;
  /** perfect-freehand outline polygon, in canvas pixels */
  points: number[][];
}

export interface GlyphLayout {
  outlines: StrokeOutline[];
  /** Canvas-pixel x that maps to x = 0 in font units (the glyph origin) */
  originPx: number;
  /** Advance width in canvas pixels */
  advancePx: number;
  /** Ink bounds in canvas pixels (unset when the glyph has no ink) */
  inkMinX: number;
  inkMaxX: number;
}

/**
 * "proportional" is the current layout. "legacy" reproduces the fixed-cell
 * layout used before v2, so community notes shared back then still render
 * exactly as their authors saw them (their letter spacing was chosen for it).
 */
export type LayoutVersion = "proportional" | "legacy";

/** Space width in canvas pixels */
export const SPACE_ADVANCE_PX = SPACE_WIDTH / FU_PER_PX;
const LEGACY_SPACE_ADVANCE_PX = (320 / GLYPH_ADVANCE_WIDTH_BASE) * ADVANCE_CANVAS_WIDTH;

export function spaceAdvancePx(version: LayoutVersion = "proportional"): number {
  return version === "legacy" ? LEGACY_SPACE_ADVANCE_PX : SPACE_ADVANCE_PX;
}

/** Pre-v2 fixed advance in canvas pixels; the glyph origin was canvas x = 0 */
export function legacyAdvancePx(letterSpacing: number, scriptMode: ScriptMode): number {
  const overlap = scriptMode === "connected" ? CONNECT_OVERLAP : 0;
  return ((GLYPH_ADVANCE_WIDTH_BASE + letterSpacing - overlap) / GLYPH_ADVANCE_WIDTH_BASE) * ADVANCE_CANVAS_WIDTH;
}

/**
 * Strokes that make up a character. Accented characters combine the base
 * letter's strokes with the user-drawn accent marks, so "é" renders even when
 * only "e" (and optionally the accent) has been drawn.
 */
export function resolveGlyphStrokes(
  char: string,
  glyphMap: Record<string, Stroke[]>,
): Stroke[] {
  const own = glyphMap[char] ?? [];
  const baseChar = ACCENT_BASE_MAP[char];
  if (!baseChar) return own;
  const base = glyphMap[baseChar] ?? [];
  return base.length ? [...base, ...own] : own;
}

/**
 * Outline every stroke and lay the glyph out horizontally.
 * Returns null when no stroke produces a usable outline.
 */
export function layoutGlyph(
  strokes: Stroke[],
  letterSpacing: number,
  scriptMode: ScriptMode,
  version: LayoutVersion = "proportional",
): GlyphLayout | null {
  const outlines: StrokeOutline[] = [];
  let inkMinX = Infinity;
  let inkMaxX = -Infinity;

  for (const stroke of strokes) {
    const points = getStroke(getEffectivePoints(stroke), stroke.options);
    if (points.length < 4) continue;
    for (const [x] of points) {
      if (x < inkMinX) inkMinX = x;
      if (x > inkMaxX) inkMaxX = x;
    }
    outlines.push({ stroke, points });
  }

  if (!outlines.length || !isFinite(inkMinX)) return null;

  if (version === "legacy") {
    return { outlines, originPx: 0, advancePx: legacyAdvancePx(letterSpacing, scriptMode), inkMinX, inkMaxX };
  }

  const spacingPx = letterSpacing / FU_PER_PX;

  if (scriptMode === "connected") {
    // getAnchorPositions already folds letter spacing into the anchor spread
    const { entryX, exitX } = getAnchorPositions(letterSpacing, scriptMode);
    return { outlines, originPx: entryX, advancePx: exitX - entryX, inkMinX, inkMaxX };
  }

  const sideBearingPx = SIDE_BEARING_FU / FU_PER_PX;
  return {
    outlines,
    originPx: inkMinX - sideBearingPx,
    // Never let negative letter spacing collapse a glyph to nothing
    advancePx: Math.max(sideBearingPx, inkMaxX - inkMinX + 2 * sideBearingPx + spacingPx),
    inkMinX,
    inkMaxX,
  };
}
