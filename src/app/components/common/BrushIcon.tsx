import type { BrushType } from "@/types";

interface BrushIconProps {
  type: BrushType;
}

export function BrushIcon({ type }: BrushIconProps) {
  if (type === "round") {
    return (
      <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor">
        <ellipse cx="4.5" cy="8" rx="3.5" ry="3.5" />
        <ellipse cx="11" cy="8" rx="2.5" ry="2.5" />
        <ellipse cx="17" cy="8" rx="1.5" ry="1.5" />
      </svg>
    );
  }

  if (type === "inkpen") {
    return (
      <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor">
        <path d="M1 8 Q10 2 19 8 Q10 14 1 8Z" />
      </svg>
    );
  }

  if (type === "calligraphy") {
    return (
      <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor">
        <path d="M2 14 L8 2 L11 2 L17 11 L15 12 L10 4 L5 15Z" />
      </svg>
    );
  }

  if (type === "ballpoint") {
    return (
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
        <path
          d="M2 12 Q7 5 11 8 Q15 11 18 3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="18" cy="3" r="1.3" fill="currentColor" />
      </svg>
    );
  }

  if (type === "brushpen") {
    return (
      <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor">
        <path d="M1 11 Q5 3 10 5.5 Q15 8 19 7 L19 8 Q15 9 10 6.5 Q5 5 2 13Z" />
      </svg>
    );
  }

  if (type === "marker") {
    return (
      <svg width="20" height="16" viewBox="0 0 20 16">
        <rect x="1" y="5" width="18" height="6" rx="1.5" fill="currentColor" opacity="0.7" />
        <rect x="1" y="5" width="18" height="6" rx="1.5" fill="none" stroke="currentColor" strokeWidth="0.6" />
      </svg>
    );
  }

  // chisel
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor">
      <rect x="1" y="5.5" width="18" height="5" rx="0.5" />
      <line x1="10" y1="1" x2="10" y2="15" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}
