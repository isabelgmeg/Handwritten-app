import { SliderRow, Section } from "../common";

interface OpacitySectionProps {
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  onOpacityMinus: () => void;
  onOpacityPlus: () => void;
}

export function OpacitySection({
  opacity,
  onOpacityChange,
  onOpacityMinus,
  onOpacityPlus,
}: OpacitySectionProps) {
  return (
    <Section label="Opacity" display={`${Math.round(opacity * 100)}%`}>
      <SliderRow
        value={opacity}
        min={0.2}
        max={1}
        step={0.05}
        onMinus={onOpacityMinus}
        onPlus={onOpacityPlus}
        onChange={onOpacityChange}
      />
    </Section>
  );
}
