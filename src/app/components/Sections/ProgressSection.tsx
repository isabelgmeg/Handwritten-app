import { CHAR_GROUPS } from "@/constants";
import { Section } from "../common";

interface ProgressSectionProps {
  glyphCounts: Record<string, number>;
}

export function ProgressSection({ glyphCounts }: ProgressSectionProps) {
  return (
    <Section label="Progress">
      <div className="space-y-2.5">
        {CHAR_GROUPS.map((g) => {
          const n = glyphCounts[g.label] || 0;
          return (
            <div key={g.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--color-text-subtle)]">{g.label}</span>
                <span className="mono-num text-[10px] text-muted-foreground">
                  {n}/{g.chars.length}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${(n / g.chars.length) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
