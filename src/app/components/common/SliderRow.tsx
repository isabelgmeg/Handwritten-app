import { Minus, Plus } from "lucide-react";

interface SliderRowProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onMinus: () => void;
  onPlus: () => void;
  onChange: (v: number) => void;
  display?: string;
}

export function SliderRow({
  value,
  min,
  max,
  step,
  onMinus,
  onPlus,
  onChange,
  display,
}: SliderRowProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onMinus}
        className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
      >
        <Minus size={10} />
      </button>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="flex-1 h-1.5 accent-[#c4782a] cursor-pointer"
      />
      <button
        onClick={onPlus}
        className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus size={10} />
      </button>
      {display && (
        <span
          className="text-xs w-9 text-right flex-shrink-0 tabular-nums font-medium text-foreground/75"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {display}
        </span>
      )}
    </div>
  );
}
