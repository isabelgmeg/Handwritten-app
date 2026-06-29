import { LabeledSlider, Section } from "../common";

interface GrainSectionProps {
  grain: number;
  onGrainChange: (v: number) => void;
}

export function GrainSection({ grain, onGrainChange }: GrainSectionProps) {
  return (
    <Section label="Texture" collapsible defaultOpen={false}>
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
      {grain > 0 && (
        <div
          className="mt-2 h-6 rounded overflow-hidden"
          style={{ border: "1px solid rgba(28,20,9,0.1)" }}
        >
          <div
            className="h-full w-full"
            style={{
              background: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4'><rect width='4' height='4' fill='%231c1409'/><rect x='0' y='0' width='1' height='1' fill='%23ffffff' opacity='0.${Math.round(grain * 0.4)}'/><rect x='2' y='2' width='1' height='1' fill='%23ffffff' opacity='0.${Math.round(grain * 0.25)}'/></svg>")`,
              opacity: 0.85,
            }}
          />
        </div>
      )}
    </Section>
  );
}
