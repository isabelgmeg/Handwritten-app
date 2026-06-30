import { useMemo, useState } from "react";
import type { BrushType, BrushSettings, BrushSettingsActions } from "@/types";
import {
  DEFAULT_BRUSH_SIZE,
  DEFAULT_THINNING,
  DEFAULT_SMOOTHING,
  DEFAULT_STREAMLINE,
  DEFAULT_STABILIZER,
  DEFAULT_TAPER,
  DEFAULT_OPACITY,
  DEFAULT_GRAIN,
  BRUSH_DEFAULTS,
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

  const settings = useMemo<BrushSettings>(
    () => ({ brushType, brushSize, thinning, smoothing, streamline, stabilizer, taper, opacity, grain }),
    [brushType, brushSize, thinning, smoothing, streamline, stabilizer, taper, opacity, grain],
  );

  // useState setters are stable — empty deps is correct.
  // setBrushType is wrapped to also apply per-brush defaults on switch.
  const actions = useMemo<BrushSettingsActions>(
    () => ({
      setBrushType: (type: BrushType) => {
        const d = BRUSH_DEFAULTS[type];
        setBrushType(type);
        setBrushSize(d.brushSize);
        setThinning(d.thinning);
        setSmoothing(d.smoothing);
        setStreamline(d.streamline);
        setTaper(d.taper);
        setGrain(d.grain);
      },
      setBrushSize,
      setOpacity,
      setStabilizer,
      setSmoothing,
      setStreamline,
      setThinning,
      setTaper,
      setGrain,
    }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    settings,
    actions,
    // Individual fields still exposed for App.tsx internals (onPointerDown, grain effect, etc.)
    brushType, brushSize, thinning, smoothing, streamline, stabilizer, taper, opacity, grain,
  };
}
