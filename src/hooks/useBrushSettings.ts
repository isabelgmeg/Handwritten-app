/**
 * Hook for managing brush settings
 */

import { useState } from "react";
import type { BrushType } from "@/types";
import {
  DEFAULT_BRUSH_SIZE,
  DEFAULT_THINNING,
  DEFAULT_SMOOTHING,
  DEFAULT_STREAMLINE,
  DEFAULT_STABILIZER,
  DEFAULT_TAPER,
  DEFAULT_OPACITY,
  DEFAULT_GRAIN,
} from "@/constants";

export function useBrushSettings() {
  const [brushType, setBrushType] = useState<BrushType>("round");
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const [thinning, setThinning] = useState(DEFAULT_THINNING);
  const [smoothing, setSmoothing] = useState(DEFAULT_SMOOTHING);
  const [streamline, setStreamline] = useState(DEFAULT_STREAMLINE);
  const [stabilizer, setStabilizer] = useState(DEFAULT_STABILIZER);
  const [taper, setTaper] = useState(DEFAULT_TAPER);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [grain, setGrain] = useState(DEFAULT_GRAIN);

  return {
    brushType,
    setBrushType,
    brushSize,
    setBrushSize,
    thinning,
    setThinning,
    smoothing,
    setSmoothing,
    streamline,
    setStreamline,
    stabilizer,
    setStabilizer,
    taper,
    setTaper,
    opacity,
    setOpacity,
    grain,
    setGrain,
  };
}
