/**
 * Hook for managing glyph state
 */

import { useCallback } from "react";
import type { StyleGlyphs, FontStyle, GlyphMap, Stroke } from "@/types";

export function useGlyphState(
  setGlyphs: (updater: (prev: StyleGlyphs) => StyleGlyphs) => void,
  activeStyle: FontStyle,
) {
  /**
   * Update glyphs for current style
   */
  const updateStyleGlyphs = useCallback(
    (updater: (prev: GlyphMap) => GlyphMap) => {
      setGlyphs((prev: StyleGlyphs) => ({
        ...prev,
        [activeStyle]: updater(prev[activeStyle]),
      }));
    },
    [activeStyle, setGlyphs],
  );

  /**
   * Add a new stroke to current character
   */
  const addStroke = useCallback(
    (character: string, stroke: Stroke) => {
      updateStyleGlyphs((sg) => ({
        ...sg,
        [character]: [...(sg[character] ?? []), stroke],
      }));
    },
    [updateStyleGlyphs],
  );

  /**
   * Remove last stroke from a character
   */
  const undoStroke = useCallback(
    (character: string) => {
      updateStyleGlyphs((sg) => {
        const s = sg[character] ?? [];
        return s.length === 0 ? sg : { ...sg, [character]: s.slice(0, -1) };
      });
    },
    [updateStyleGlyphs],
  );

  /**
   * Clear all strokes from a character
   */
  const clearGlyph = useCallback(
    (character: string) => {
      updateStyleGlyphs((sg) => ({ ...sg, [character]: [] }));
    },
    [updateStyleGlyphs],
  );

  return {
    updateStyleGlyphs,
    addStroke,
    undoStroke,
    clearGlyph,
  };
}
