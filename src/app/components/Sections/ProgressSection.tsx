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
                <span className="text-xs text-foreground/70">{g.label}</span>
                <span
                  className="text-[10px] tabular-nums text-muted-foreground"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {n}/{g.chars.length}
                </span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
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
