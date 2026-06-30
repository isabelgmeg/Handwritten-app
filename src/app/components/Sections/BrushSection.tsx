import type { BrushType } from "@/types";
import { Section, BrushIcon } from "../common";

interface BrushSectionProps {
  brushType: BrushType;
  onBrushTypeChange: (type: BrushType) => void;
}

const BRUSH_OPTIONS: [BrushType, string][] = [
  ["round",       "Round"],
  ["inkpen",      "Ink Pen"],
  ["calligraphy", "Calligraphy"],
  ["ballpoint",   "Ballpoint"],
  ["brushpen",    "Brush Pen"],
  ["marker",      "Marker"],
  ["chisel",      "Chisel"],
];

export function BrushSection({ brushType, onBrushTypeChange }: BrushSectionProps) {
  return (
    <Section label="Brush">
      <div className="grid grid-cols-2 gap-2">
        {BRUSH_OPTIONS.map(([t, label]) => (
          <button
            key={t}
            onClick={() => onBrushTypeChange(t)}
            className={["brush-card", brushType === t ? "brush-card-active" : ""].join(" ")}
          >
            <BrushIcon type={t} />
            {label}
          </button>
        ))}
      </div>
    </Section>
  );
}
