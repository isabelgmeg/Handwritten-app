import type { BrushType } from "@/types";
import { LabeledSlider, Section } from "../common";

const TAPER_BRUSHES: BrushType[] = ["inkpen", "calligraphy", "brushpen"];

interface StrokeQualitySectionProps {
  brushType: BrushType;
  smoothing: number;
  streamline: number;
  thinning: number;
  taper: number;
  grain: number;
  onSmoothingChange: (v: number) => void;
  onStreamlineChange: (v: number) => void;
  onThinningChange: (v: number) => void;
  onTaperChange: (v: number) => void;
  onGrainChange: (v: number) => void;
}

export function StrokeQualitySection({
  brushType,
  smoothing,
  streamline,
  thinning,
  taper,
  grain,
  onSmoothingChange,
  onStreamlineChange,
  onThinningChange,
  onTaperChange,
  onGrainChange,
}: StrokeQualitySectionProps) {
  const taperApplied = TAPER_BRUSHES.includes(brushType);
  const thinningFixed = brushType === "chisel";

  return (
    <Section label="Stroke Detail" collapsible defaultOpen={false}>
      <LabeledSlider
        label="Smoothing"
        value={smoothing}
        min={0}
        max={1}
        step={0.05}
        onChange={onSmoothingChange}
        display={`${Math.round(smoothing * 100)}%`}
        hint="Smooths the outline edges of the stroke."
      />
      <LabeledSlider
        label="Streamline"
        value={streamline}
        min={0}
        max={0.99}
        step={0.05}
        onChange={onStreamlineChange}
        display={`${Math.round(streamline * 100)}%`}
        hint="Reduces input tremor — higher values lag slightly behind the pointer."
      />
      <LabeledSlider
        label="Thinning"
        value={thinning}
        min={-1}
        max={1}
        step={0.05}
        onChange={onThinningChange}
        display={`${Math.round(thinning * 100)}%`}
        hint={
          thinningFixed
            ? "Fixed for chisel — width is controlled by stroke angle instead."
            : "How much speed or pressure narrows the stroke."
        }
      />
      <LabeledSlider
        label="Taper"
        value={taper}
        min={0}
        max={100}
        step={5}
        onChange={onTaperChange}
        display={taper === 0 ? "Off" : `${taper}`}
        hint={taperApplied ? "Length of the stroke tip taper." : "Not used by this brush type."}
      />
      <LabeledSlider
        label="Grain"
        value={grain}
        min={0}
        max={100}
        step={5}
        onChange={onGrainChange}
        display={grain === 0 ? "Off" : `${grain}%`}
        hint="Simulates ink on textured paper."
      />
    </Section>
  );
}
