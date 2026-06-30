interface LabeledSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  hint?: string;
}

export function LabeledSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  hint,
}: LabeledSliderProps) {
  return (
    <div className="mb-3.5 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[var(--color-text-subtle)]">{label}</span>
        <span className="value-badge">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="slider-input"
      />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
