import { LabeledSlider, Section } from "../common";

interface StrokeQualitySectionProps {
  smoothing: number;
  streamline: number;
  thinning: number;
  taper: number;
  onSmoothingChange: (v: number) => void;
  onStreamlineChange: (v: number) => void;
  onThinningChange: (v: number) => void;
  onTaperChange: (v: number) => void;
}

export function StrokeQualitySection({
  smoothing,
  streamline,
  thinning,
  taper,
  onSmoothingChange,
  onStreamlineChange,
  onThinningChange,
  onTaperChange,
}: StrokeQualitySectionProps) {
  return (
    <Section label="Stroke Quality" collapsible defaultOpen={false}>
      <LabeledSlider
        label="Smoothing"
        value={smoothing}
        min={0}
        max={1}
        step={0.05}
        onChange={onSmoothingChange}
        display={`${Math.round(smoothing * 100)}%`}
      />
      <LabeledSlider
        label="Streamline"
        value={streamline}
        min={0}
        max={0.99}
        step={0.05}
        onChange={onStreamlineChange}
        display={`${Math.round(streamline * 100)}%`}
        hint="Reduces input tremor"
      />
      <LabeledSlider
        label="Thinning"
        value={thinning}
        min={-1}
        max={1}
        step={0.05}
        onChange={onThinningChange}
        display={`${Math.round(thinning * 100)}%`}
        hint="Pressure → width"
      />
      <LabeledSlider
        label="Taper"
        value={taper}
        min={0}
        max={100}
        step={5}
        onChange={onTaperChange}
        display={taper === 0 ? "Off" : `${taper}`}
        hint="End taper length"
      />
    </Section>
  );
}
