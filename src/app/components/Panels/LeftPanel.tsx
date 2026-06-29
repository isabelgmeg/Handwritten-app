import type { FontStyle, StyleGlyphs } from "@/types";
import { CHAR_GROUPS } from "@/constants";

interface LeftPanelProps {
  isOpen: boolean;
  glyphs: StyleGlyphs;
  activeStyle: FontStyle;
  currentChar: string;
  onCharSelect: (char: string) => void;
}

export function LeftPanel({
  isOpen,
  glyphs,
  activeStyle,
  currentChar,
  onCharSelect,
}: LeftPanelProps) {
  return (
    <aside
      className="border-r border-border bg-card flex-shrink-0 overflow-hidden"
      style={{ width: isOpen ? 208 : 0, transition: "width 200ms ease" }}
    >
      <div className="w-52 h-full overflow-y-auto py-4">
        {CHAR_GROUPS.map((group) => (
          <div key={group.label} className="mb-5 px-3">
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2 px-1">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-1">
              {group.chars.map((char) => {
                const drawn =
                  (glyphs[activeStyle][char]?.length ?? 0) > 0;
                const active = char === currentChar;
                return (
                  <button
                    key={char}
                    onClick={() => onCharSelect(char)}
                    className={[
                      "relative w-8 h-8 text-sm rounded font-medium transition-all",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-muted",
                    ].join(" ")}
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {char}
                    {drawn && !active && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
