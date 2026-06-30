/**
 * Brush Configuration Utilities
 */

import type { BrushType, PFOptions } from "@/types";

/**
 * Build perfect-freehand options based on brush type and settings
 */
export function buildBrushOptions(
  brushType: BrushType,
  size: number,
  thinning: number,
  smoothing: number,
  streamline: number,
  taper: number,
): PFOptions {
  const base: PFOptions = {
    size,
    thinning,
    smoothing,
    streamline,
    simulatePressure: true,
    start: { cap: true, taper: 0 },
    end: { cap: true, taper: 0 },
  };

  if (brushType === "inkpen") {
    // Always pointed ends — enforce a minimum taper so inkpen is immediately
    // distinct from round even when the taper slider is at zero.
    const t = Math.max(taper, 30);
    return {
      ...base,
      start: { cap: false, taper: t },
      end: { cap: false, taper: t },
    };
  }

  if (brushType === "calligraphy") {
    // Width variation comes from direction-based pressure in getEffectivePoints,
    // not from PF thinning. Ensure thinning is high enough to let that through.
    return {
      ...base,
      thinning: Math.max(0.7, thinning),
      smoothing: Math.max(0.5, smoothing),
      start: { cap: false, taper: taper * 0.5 },
      end: { cap: false, taper },
    };
  }

  if (brushType === "ballpoint") {
    return {
      ...base,
      thinning: Math.min(0.2, thinning * 0.25),
      smoothing: Math.max(smoothing, 0.5),
      streamline: Math.max(streamline, 0.6),
    };
  }

  if (brushType === "brushpen") {
    return {
      ...base,
      size: size * 1.3,
      thinning: Math.min(1, thinning * 1.6),
      smoothing: Math.max(0.5, smoothing),
      start: { cap: false, taper: Math.max(taper, 20) },
      end: { cap: false, taper: Math.max(taper * 1.5, 50) },
    };
  }

  if (brushType === "marker") {
    return {
      ...base,
      size: size * 1.1,
      thinning: Math.min(0.25, thinning * 0.35),
      smoothing: Math.max(0.4, smoothing),
      streamline: Math.max(0.45, streamline),
    };
  }

  if (brushType === "chisel") {
    return {
      ...base,
      thinning: 0.99,
      smoothing: Math.max(0.5, smoothing),
      streamline: Math.max(0.4, streamline),
      start: { cap: false, taper: 0 },
      end: { cap: false, taper: 0 },
    };
  }

  return base;
}
