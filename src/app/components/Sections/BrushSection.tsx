import type { BrushType } from "@/types";
import { Section, BrushIcon } from "../common";

interface BrushSectionProps {
  brushType: BrushType;
  onBrushTypeChange: (type: BrushType) => void;
}

const BRUSH_OPTIONS: [BrushType, string][] = [
  ["round", "Round"],
  ["inkpen", "Ink Pen"],
  ["calligraphy", "Calligraphy"],
  ["ballpoint", "Ballpoint"],
  ["brushpen", "Brush Pen"],
  ["marker", "Marker"],
  ["chisel", "Chisel"],
];

export function BrushSection({
  brushType,
  onBrushTypeChange,
}: BrushSectionProps) {
  return (
    <Section label="Brush">
      <div className="flex flex-col gap-0.5">
        {BRUSH_OPTIONS.map(([t, label]) => (
          <button
            key={t}
            onClick={() => onBrushTypeChange(t)}
            className={[
              "flex items-center gap-2.5 w-full px-2.5 py-2 rounded text-xs font-medium transition-all",
              brushType === t
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:bg-secondary hover:text-foreground",
            ].join(" ")}
          >
            <span className="flex-shrink-0">
              <BrushIcon type={t} active={brushType === t} />
            </span>
            <span className="flex-1 text-left">{label}</span>
            {brushType === t && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </Section>
  );
}
