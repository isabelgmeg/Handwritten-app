import { Section } from "../common";

const PRESETS = [
  { label: "Terracotta", hue: 48 },
  { label: "Sage",       hue: 140 },
  { label: "Rose",       hue: 320 },
  { label: "Blue",       hue: 260 },
] as const;

interface ThemeSectionProps {
  themeHue: number;
  onThemeHueChange: (hue: number) => void;
}

export function ThemeSection({ themeHue, onThemeHueChange }: ThemeSectionProps) {
  const swatchColor = `oklch(0.390 0.165 ${themeHue})`;

  return (
    <Section label="Theme Colour" display={`${Math.round(themeHue)}°`}>
      {/* Preset swatches */}
      <div className="flex gap-2 mb-3">
        {PRESETS.map(({ label, hue }) => (
          <button
            key={hue}
            title={label}
            onClick={() => onThemeHueChange(hue)}
            className="w-6 h-6 rounded-full border-2 transition-all"
            aria-pressed={Math.round(themeHue) === hue}
            aria-label={label}
            style={{
              background: `oklch(0.390 0.165 ${hue})`,
              borderColor: Math.round(themeHue) === hue
                ? "var(--color-text-base)"
                : "transparent",
              boxShadow: Math.round(themeHue) === hue
                ? "0 0 0 1px var(--color-surface-base), 0 0 0 3px var(--color-text-base)"
                : "var(--shadow-neu-raised-xs)",
            }}
          />
        ))}

        {/* Live swatch showing current hue */}
        <div
          title={`Current: ${Math.round(themeHue)}°`}
          className="w-6 h-6 rounded-full ml-auto"
          style={{
            background: swatchColor,
            boxShadow: "var(--shadow-neu-raised-xs)",
          }}
        />
      </div>

      {/* Hue slider */}
      <div className="slider-row">
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={themeHue}
          onChange={(e) => onThemeHueChange(+e.target.value)}
          className="slider-input flex-1"
          style={{
            background: `linear-gradient(to right,
              hsl(0,65%,45%), hsl(30,65%,45%), hsl(60,65%,45%),
              hsl(90,65%,45%), hsl(120,65%,45%), hsl(150,65%,45%),
              hsl(180,65%,45%), hsl(210,65%,45%), hsl(240,65%,45%),
              hsl(270,65%,45%), hsl(300,65%,45%), hsl(330,65%,45%),
              hsl(360,65%,45%))`,
          }}
        />
      </div>

    </Section>
  );
}
