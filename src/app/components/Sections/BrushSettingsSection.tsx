import { LabeledSlider, SliderRow, Section } from "../common";

interface BrushSettingsSectionProps {
  brushSize: number;
  onBrushSizeChange: (v: number) => void;
  opacity: number;
  onOpacityChange: (v: number) => void;
  stabilizer: number;
  onStabilizerChange: (v: number) => void;
}

export function BrushSettingsSection({
  brushSize,
  onBrushSizeChange,
  opacity,
  onOpacityChange,
  stabilizer,
  onStabilizerChange,
}: BrushSettingsSectionProps) {
  return (
    <Section label="Settings">
      {/* Size — kept inline to show circle preview */}
      <div className="mb-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[var(--color-text-subtle)]">Size</span>
          <span className="value-badge">{brushSize}px</span>
        </div>
        <div className="flex items-center justify-center mb-2 h-7">
          <div
            className="brush-preview-dot"
            style={{ width: Math.min(brushSize, 28), height: Math.min(brushSize, 28) }}
          />
        </div>
        <SliderRow value={brushSize} min={4} max={48} step={2} onChange={onBrushSizeChange} />
      </div>

      <LabeledSlider
        label="Opacity"
        value={opacity}
        min={0.2}
        max={1}
        step={0.05}
        onChange={onOpacityChange}
        display={`${Math.round(opacity * 100)}%`}
      />

      <LabeledSlider
        label="Stabilizer"
        value={stabilizer}
        min={0}
        max={30}
        step={1}
        onChange={onStabilizerChange}
        display={stabilizer === 0 ? "Off" : `${stabilizer}`}
        hint="Higher = smoother, slower strokes."
      />
    </Section>
  );
}
