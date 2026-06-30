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
    <div className="section-root">
      <div
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
        onKeyDown={
          collapsible
            ? (e) => (e.key === "Enter" || e.key === " ") && setOpen((v) => !v)
            : undefined
        }
        className={["section-header", collapsible ? "cursor-pointer select-none" : ""].join(" ")}
      >
        <span className="label-caps">{label}</span>
        <div className="flex items-center gap-2">
          {display && <span className="value-badge">{display}</span>}
          {collapsible && (
            <ChevronDown
              size={11}
              className="text-[var(--color-text-ghost)] transition-transform duration-150"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          )}
        </div>
      </div>
      {(!collapsible || open) && children}
    </div>
  );
}
