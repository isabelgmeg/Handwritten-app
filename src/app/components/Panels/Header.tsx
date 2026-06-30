import React from "react";
import { Download, Pencil, PanelLeft, PanelRight, Eye, EyeOff } from "lucide-react";
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
          className="btn btn-icon-md btn-ghost flex-shrink-0"
          title="Toggle character panel"
        >
          <PanelLeft size={14} />
        </button>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Pencil size={14} className="text-accent" />
          <span className="wordmark text-base hidden sm:inline">A Love Letter</span>
        </div>

        <span className="text-muted-foreground text-lg select-none hidden sm:inline opacity-30">|</span>

        <input
          value={fontName}
          onChange={(e) => onFontNameChange(e.target.value)}
          className="bg-transparent text-sm text-muted-foreground outline-none border-b border-transparent hover:border-border focus:border-accent transition-colors px-0 py-0.5 min-w-0 w-28 sm:w-40 hidden sm:block"
          placeholder="Font name…"
        />
      </div>

      {/* Right group */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="mono-num text-xs text-muted-foreground hidden lg:inline">
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
              "btn btn-sm gap-1",
              showTemplate ? "btn-ghost-active" : "btn-ghost",
            ].join(" ")}
          >
            {showTemplate ? <Eye size={12} /> : <EyeOff size={12} />}
            {templateFontLabel
              ? <span className="max-w-[72px] truncate">{templateFontLabel}</span>
              : "Template"}
          </button>
          <button
            onClick={onImportFont}
            className="btn btn-sm btn-ghost border-0 border-l border-border rounded-none text-muted-foreground hover:text-accent"
            title="Import your own font as template"
          >
            {templateFontLabel ? "change" : "import"}
          </button>
        </div>

        {/* Guides toggle */}
        <button
          onClick={() => onShowGuidesChange(!showGuides)}
          className="hidden md:flex btn btn-sm btn-ghost gap-1"
        >
          {showGuides ? <Eye size={12} /> : <EyeOff size={12} />}
          <span className="hidden lg:inline">Guides</span>
        </button>

        {/* Download — split button */}
        <div className="flex items-center rounded overflow-hidden">
          <button
            onClick={onDownloadFont}
            className="btn btn-md btn-accent btn-split-start gap-1.5"
          >
            <Download size={13} />
            <span className="hidden sm:inline">
              {FONT_STYLES.find((s) => s.key === activeStyle)!.label}
            </span>
          </button>
          <button
            onClick={onDownloadAllStyles}
            className="btn btn-md btn-accent btn-split-end"
            title="Download all styles"
          >
            All
          </button>
        </div>

        <button
          onClick={onRightPanelToggle}
          className="btn btn-icon-md btn-ghost flex-shrink-0"
          title="Toggle brush panel"
        >
          <PanelRight size={14} />
        </button>
      </div>
    </header>
  );
}
