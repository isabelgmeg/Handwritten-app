/**
 * Font Style Manipulation Service
 * Handles auto-generation of bold, italic, and bold-italic variants
 */

import type { StyleGlyphs } from "@/types";
import { applyItalicToPoints } from "@/utils";

/**
 * Auto-generate bold variant from regular glyphs
 */
export function autoGenerateBold(glyphs: StyleGlyphs): StyleGlyphs {
  return {
    ...glyphs,
    bold: Object.fromEntries(
      Object.entries(glyphs.regular).map(([char, strokes]) => [
        char,
        strokes.map((s) => ({
          ...s,
          options: {
            ...s.options,
            size: s.options.size * 1.5,
          },
        })),
      ]),
    ),
  };
}

/**
 * Auto-generate italic variant from regular glyphs
 */
export function autoGenerateItalic(glyphs: StyleGlyphs): StyleGlyphs {
  return {
    ...glyphs,
    italic: Object.fromEntries(
      Object.entries(glyphs.regular).map(([char, strokes]) => [
        char,
        strokes.map((s) => ({
          ...s,
          points: applyItalicToPoints(s.points),
        })),
      ]),
    ),
  };
}

/**
 * Auto-generate bold-italic variant from regular glyphs
 */
export function autoGenerateBoldItalic(glyphs: StyleGlyphs): StyleGlyphs {
  return {
    ...glyphs,
    "bold-italic": Object.fromEntries(
      Object.entries(glyphs.regular).map(([char, strokes]) => [
        char,
        strokes.map((s) => ({
          ...s,
          options: {
            ...s.options,
            size: s.options.size * 1.5,
          },
          points: applyItalicToPoints(s.points),
        })),
      ]),
    ),
  };
}
