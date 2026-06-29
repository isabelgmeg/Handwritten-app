import React from "react";
import {
  Download,
  Pencil,
  PanelLeft,
  PanelRight,
  Eye,
  EyeOff,
} from "lucide-react";
import type { FontStyle } from "@/types";
import { FONT_STYLES, ALL_CHARS } from "@/constants";

interface HeaderProps {
  fontName: string;
  onFontNameChange: (name: string) => void;
  drawnCount: number;
  showTemplate: boolean;
  onShowTemplateChange: (show: boolean) => void;
  templateFontLabel?: string;
  onImportFont: () => void;
  showGuides: boolean;
  onShowGuidesChange: (show: boolean) => void;
  activeStyle: FontStyle;
  onDownloadFont: () => void;
  onDownloadAllStyles: () => void;
  onLeftPanelToggle: () => void;
  onRightPanelToggle: () => void;
  fontInputRef: React.RefObject<HTMLInputElement>;
}

export function Header({
  fontName,
  onFontNameChange,
  drawnCount,
  showTemplate,
  onShowTemplateChange,
  templateFontLabel,
  onImportFont,
  showGuides,
  onShowGuidesChange,
  activeStyle,
  onDownloadFont,
  onDownloadAllStyles,
  onLeftPanelToggle,
  onRightPanelToggle,
  fontInputRef,
}: HeaderProps) {
  return (
    <header className="border-b border-border bg-card px-3 sm:px-5 py-2 flex items-center justify-between gap-2 flex-shrink-0 min-w-0">
      {/* Left group */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onLeftPanelToggle}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded border border-border hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
          title="Toggle character panel"
        >
          <PanelLeft size={14} />
        </button>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Pencil size={14} className="text-accent" />
          <span
            className="text-base font-semibold tracking-tight hidden sm:inline"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Font Studio
          </span>
        </div>
        <span className="text-border text-lg select-none hidden sm:inline">
          |
        </span>
        <input
          value={fontName}
          onChange={(e) => onFontNameChange(e.target.value)}
          className="bg-transparent text-sm text-muted-foreground outline-none border-b border-transparent hover:border-border focus:border-accent transition-colors px-0 py-0.5 min-w-0 w-28 sm:w-40 hidden sm:block"
          placeholder="Font name…"
        />
      </div>

      {/* Right group */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs text-muted-foreground hidden lg:inline">
          {drawnCount}/{ALL_CHARS.length}
        </span>

        {/* Hidden font file input */}
        <input
          ref={fontInputRef}
          type="file"
          accept=".otf,.ttf,.woff,.woff2"
          className="hidden"
          onChange={onImportFont}
        />

        {/* Template font import */}
        <div className="hidden md:flex items-center rounded border border-border overflow-hidden">
          <button
            onClick={() => onShowTemplateChange(!showTemplate)}
            className={[
              "flex items-center gap-1 text-xs px-2.5 py-1.5 transition-all",
              showTemplate
                ? "text-foreground bg-secondary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            ].join(" ")}
          >
            {showTemplate ? <Eye size={12} /> : <EyeOff size={12} />}
            {templateFontLabel ? (
              <span className="max-w-[72px] truncate">{templateFontLabel}</span>
            ) : (
              "Template"
            )}
          </button>
          <button
            onClick={onImportFont}
            className="text-[10px] text-muted-foreground hover:text-accent px-2 py-1.5 border-l border-border hover:bg-secondary transition-all"
            title="Import your own font as template"
          >
            {templateFontLabel ? "change" : "import"}
          </button>
        </div>

        {/* Guides toggle */}
        <button
          onClick={() => onShowGuidesChange(!showGuides)}
          className="hidden md:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded border border-border hover:border-foreground/25 transition-all"
        >
          {showGuides ? <Eye size={12} /> : <EyeOff size={12} />}
          <span className="hidden lg:inline">Guides</span>
        </button>

        {/* Download */}
        <div className="flex items-center rounded overflow-hidden">
          <button
            onClick={onDownloadFont}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-accent text-white px-2.5 sm:px-3.5 py-1.5 hover:bg-accent/90 active:scale-95 transition-all"
          >
            <Download size={13} />
            <span className="hidden sm:inline">
              {FONT_STYLES.find((s) => s.key === activeStyle)!.label}
            </span>
          </button>
          <button
            onClick={onDownloadAllStyles}
            className="text-xs bg-accent/80 text-white px-2 py-1.5 border-l border-white/20 hover:bg-accent transition-all"
            title="Download all styles"
          >
            All
          </button>
        </div>

        <button
          onClick={onRightPanelToggle}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded border border-border hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
          title="Toggle brush panel"
        >
          <PanelRight size={14} />
        </button>
      </div>
    </header>
  );
}
