import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface SectionProps {
  label: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  display?: string;
}

export function Section({
  label,
  children,
  collapsible = false,
  defaultOpen = true,
  display,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-4 pb-4 border-b border-border last:border-0 last:mb-0 last:pb-0">
      <div
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
        onKeyDown={
          collapsible
            ? (e) =>
                (e.key === "Enter" || e.key === " ") && setOpen((v) => !v)
            : undefined
        }
        className={[
          "flex items-center justify-between mb-3",
          collapsible ? "cursor-pointer select-none group" : "",
        ].join(" ")}
      >
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {display && (
            <span
              className="text-[10px] font-medium tabular-nums bg-secondary text-muted-foreground rounded px-1.5 py-0.5"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {display}
            </span>
          )}
          {collapsible && (
            <ChevronDown
              size={11}
              className={[
                "text-muted-foreground/50 group-hover:text-muted-foreground transition-transform duration-150",
                open ? "rotate-180" : "",
              ].join(" ")}
            />
          )}
        </div>
      </div>
      {(!collapsible || open) && children}
    </div>
  );
}
