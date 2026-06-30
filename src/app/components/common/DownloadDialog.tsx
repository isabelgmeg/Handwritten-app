import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import type { FontFormat } from "@/services/fontGenerator";

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFontName: string;
  mode: "single" | "all";
  styleLabel: string;
  onDownload: (fontName: string, format: FontFormat) => void;
  isDownloading: boolean;
}

const FORMAT_OPTIONS: { value: FontFormat; label: string; desc: string }[] = [
  { value: "otf", label: "OTF", desc: "Desktop & print apps" },
  { value: "woff2", label: "WOFF2", desc: "Web (CSS @font-face)" },
  { value: "both", label: "Both", desc: "OTF + WOFF2" },
];

export function DownloadDialog({
  open,
  onOpenChange,
  initialFontName,
  mode,
  styleLabel,
  onDownload,
  isDownloading,
}: DownloadDialogProps) {
  const [fontName, setFontName] = useState(initialFontName);
  const [format, setFormat] = useState<FontFormat>("otf");

  useEffect(() => {
    if (open) setFontName(initialFontName);
  }, [open, initialFontName]);

  return (
    <Dialog open={open} onOpenChange={isDownloading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Download font</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Font name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dl-font-name" className="label-caps">
              Font name
            </label>
            <input
              id="dl-font-name"
              type="text"
              value={fontName}
              onChange={(e) => setFontName(e.target.value)}
              placeholder="My Handwriting"
              disabled={isDownloading}
              style={{ boxShadow: "var(--shadow-neu-inset-sm)" }}
              className="w-full rounded-md bg-background border-none px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
            />
            <p className="field-hint">
              This sets the name shown in your font menu — renaming the file alone won't change it.
            </p>
          </div>

          {/* Format selector */}
          <div className="flex flex-col gap-1.5">
            <span className="label-caps">Format</span>
            <div className="flex gap-2">
              {FORMAT_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setFormat(value)}
                  disabled={isDownloading}
                  style={{
                    boxShadow: format === value
                      ? "var(--shadow-neu-inset-xs)"
                      : "var(--shadow-neu-raised-sm)",
                  }}
                  className={[
                    "flex flex-1 flex-col rounded-md bg-background border-none px-3 py-2 text-left text-sm cursor-pointer",
                    "transition-all disabled:opacity-50",
                    format === value
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  <span className="font-semibold text-xs">{label}</span>
                  <span className="text-xs opacity-70">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scope hint */}
          <p className="field-hint">
            Downloading:{" "}
            <span className="font-medium text-foreground">
              {mode === "all" ? "All drawn styles" : styleLabel}
            </span>
          </p>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            disabled={isDownloading}
            className="btn btn-md btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={() => onDownload(fontName.trim() || "My Handwriting", format)}
            disabled={isDownloading}
            className="btn btn-md btn-neu-accent gap-1.5"
          >
            <Download size={13} />
            {isDownloading ? "Generating…" : "Download"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
