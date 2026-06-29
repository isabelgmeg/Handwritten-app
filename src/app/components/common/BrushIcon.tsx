import type { BrushType } from "@/types";

interface BrushIconProps {
  type: BrushType;
  active: boolean;
}

export function BrushIcon({ type, active }: BrushIconProps) {
  const c = active ? "rgba(255,255,255,0.85)" : "rgba(28,20,9,0.5)";
  const cb = active ? "rgba(120,140,220,0.9)" : "rgba(40,40,120,0.55)";

  if (type === "round") {
    return (
      <svg width="18" height="14" viewBox="0 0 18 14">
        <ellipse cx="4" cy="7" rx="3.5" ry="3.5" fill={c} />
        <ellipse cx="10" cy="7" rx="2.5" ry="2.5" fill={c} />
        <ellipse cx="15" cy="7" rx="1.5" ry="1.5" fill={c} />
      </svg>
    );
  }

  if (type === "inkpen") {
    return (
      <svg width="18" height="14" viewBox="0 0 18 14">
        <path d="M1 7 Q9 2 17 7 Q9 12 1 7Z" fill={c} />
      </svg>
    );
  }

  if (type === "calligraphy") {
    return (
      <svg width="18" height="14" viewBox="0 0 18 14">
        <path d="M2 12 L8 2 L10 2 L16 10 L14 11 L9 4 L5 13Z" fill={c} />
      </svg>
    );
  }

  if (type === "ballpoint") {
    return (
      <svg width="18" height="14" viewBox="0 0 18 14">
        <path
          d="M2 11 Q6 5 10 7 Q14 9 16 3"
          stroke={cb}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="16" cy="3" r="1.2" fill={cb} />
      </svg>
    );
  }

  if (type === "brushpen") {
    return (
      <svg width="18" height="14" viewBox="0 0 18 14">
        <path d="M1 10 Q5 3 9 5 Q13 7 17 6 L17 7 Q13 8 9 6 Q5 5 2 12Z" fill={c} />
      </svg>
    );
  }

  if (type === "marker") {
    return (
      <svg width="18" height="14" viewBox="0 0 18 14">
        <rect
          x="1"
          y="4.5"
          width="16"
          height="5"
          rx="1"
          fill={c}
          opacity="0.75"
        />
        <rect
          x="1"
          y="4.5"
          width="16"
          height="5"
          rx="1"
          fill="none"
          stroke={c}
          strokeWidth="0.5"
        />
      </svg>
    );
  }

  // Chisel
  return (
    <svg width="18" height="14" viewBox="0 0 18 14">
      <rect x="1" y="5" width="16" height="4" rx="0.5" fill={c} />
      <line x1="9" y1="1" x2="9" y2="13" stroke={c} strokeWidth="0.8" />
    </svg>
  );
}
