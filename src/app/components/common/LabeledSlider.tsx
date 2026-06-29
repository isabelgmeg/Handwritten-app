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
        <span className="text-xs text-foreground/75">{label}</span>
        <span
          className="text-[10px] font-medium tabular-nums bg-secondary text-muted-foreground rounded px-1.5 py-0.5"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full h-1.5 accent-[#c4782a] cursor-pointer"
      />
      {hint && (
        <p className="text-[10px] text-muted-foreground/60 mt-1 leading-tight">
          {hint}
        </p>
      )}
    </div>
  );
}
