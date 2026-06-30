import { X } from "lucide-react";
import type { FontStyle, StyleGlyphs } from "@/types";
import { CHAR_GROUPS } from "@/constants";

interface LeftPanelProps {
  isOpen: boolean;
  glyphs: StyleGlyphs;
  activeStyle: FontStyle;
  currentChar: string;
  onCharSelect: (char: string) => void;
  onClose: () => void;
}

export function LeftPanel({
  isOpen,
  glyphs,
  activeStyle,
  currentChar,
  onCharSelect,
  onClose,
}: LeftPanelProps) {
  return (
    <aside
      className="panel-aside border-r fixed left-0 bottom-0 z-50 flex flex-col"
      style={{
        top: "var(--header-height, 53px)",
        width: isOpen ? "min(208px, 100vw)" : 0,
        boxShadow: isOpen ? "2px 0 12px rgba(0,0,0,0.08)" : "none",
      }}
    >
      {/* Header — stays fixed while content scrolls */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border flex-shrink-0" style={{ minWidth: 208 }}>
        <span className="label-caps">Characters</span>
        <button onClick={onClose} className="btn btn-icon-sm btn-ghost" aria-label="Close panel">
          <X size={13} />
        </button>
      </div>

      {/* Scrollable character list */}
      <div className="panel-scroll py-3 flex-1" style={{ minWidth: 208 }}>
        {CHAR_GROUPS.map((group) => (
          <div key={group.label} className="mb-5 px-3">
            <div className="label-caps mb-2 px-1">{group.label}</div>
            <div className="flex flex-wrap gap-1">
              {group.chars.map((char) => {
                const drawn = (glyphs[activeStyle][char]?.length ?? 0) > 0;
                const active = char === currentChar;
                return (
                  <button
                    key={char}
                    onClick={() => onCharSelect(char)}
                    className={["char-btn", active ? "char-btn-active" : ""].join(" ")}
                  >
                    {char}
                    {drawn && !active && <span className="char-btn-dot" />}
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
