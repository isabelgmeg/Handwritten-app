import { SliderRow, Section } from "../common";

interface SizeSectionProps {
  brushSize: number;
  onSizeChange: (size: number) => void;
  onSizeMinus: () => void;
  onSizePlus: () => void;
}

export function SizeSection({
  brushSize,
  onSizeChange,
  onSizeMinus,
  onSizePlus,
}: SizeSectionProps) {
  return (
    <Section label="Size" display={`${brushSize}px`}>
      <SliderRow
        value={brushSize}
        min={4}
        max={48}
        step={2}
        onMinus={onSizeMinus}
        onPlus={onSizePlus}
        onChange={onSizeChange}
      />
      <div className="flex items-center justify-center mt-2 h-9">
        <div
          className="rounded-full bg-foreground/75 transition-all duration-150"
          style={{
            width: Math.min(brushSize, 36),
            height: Math.min(brushSize, 36),
          }}
        />
      </div>
    </Section>
  );
}
