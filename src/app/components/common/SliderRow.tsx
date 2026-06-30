import { Minus, Plus } from "lucide-react";

interface SliderRowProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display?: string;
}

export function SliderRow({ value, min, max, step, onChange, display }: SliderRowProps) {
  const dec = () => onChange(Math.max(min, parseFloat((value - step).toFixed(10))));
  const inc = () => onChange(Math.min(max, parseFloat((value + step).toFixed(10))));

  return (
    <div className="slider-row">
      <button onClick={dec} className="btn btn-icon-sm btn-ghost">
        <Minus size={10} />
      </button>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="slider-input flex-1"
      />
      <button onClick={inc} className="btn btn-icon-sm btn-ghost">
        <Plus size={10} />
      </button>
      {display && <span className="slider-row-value">{display}</span>}
    </div>
  );
}
