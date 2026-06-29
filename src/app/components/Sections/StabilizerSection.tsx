import { SliderRow, Section } from "../common";

interface StabilizerSectionProps {
  stabilizer: number;
  onStabilizerChange: (stabilizer: number) => void;
  onStabilizerMinus: () => void;
  onStabilizerPlus: () => void;
}

export function StabilizerSection({
  stabilizer,
  onStabilizerChange,
  onStabilizerMinus,
  onStabilizerPlus,
}: StabilizerSectionProps) {
  return (
    <Section
      label="Stabilizer"
      display={stabilizer === 0 ? "Off" : `${stabilizer}px`}
    >
      <SliderRow
        value={stabilizer}
        min={0}
        max={30}
        step={1}
        onMinus={onStabilizerMinus}
        onPlus={onStabilizerPlus}
        onChange={onStabilizerChange}
      />
      <p className="text-[10px] text-muted-foreground/65 mt-1.5 leading-snug">
        Higher = smoother, slower strokes.
      </p>
    </Section>
  );
}
