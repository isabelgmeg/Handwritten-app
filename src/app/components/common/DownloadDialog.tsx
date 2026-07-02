import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import type { DownloadProgress } from "@/services/fontGenerator";

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFontName: string;
  drawnStyleLabels: string[];
  onDownload: (fontName: string) => void;
  isDownloading: boolean;
  progress?: DownloadProgress | null;
  startedAt?: number | null;
}

export function DownloadDialog({
  open,
  onOpenChange,
  initialFontName,
  drawnStyleLabels,
  onDownload,
  isDownloading,
  progress,
  startedAt,
}: DownloadDialogProps) {
  const [fontName, setFontName] = useState(initialFontName);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (open) setFontName(initialFontName);
  }, [open, initialFontName]);

  useEffect(() => {
    if (!isDownloading || startedAt == null) {
      setElapsedMs(0);
      return;
    }
    setElapsedMs(Date.now() - startedAt);
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), 200);
    return () => clearInterval(id);
  }, [isDownloading, startedAt]);

  const elapsedLabel = (elapsedMs / 1000).toFixed(1);
  const buttonLabel = isDownloading
    ? progress
      ? `Generating ${progress.styleLabel} (${progress.index}/${progress.total})… ${elapsedLabel}s`
      : `Generating… ${elapsedLabel}s`
    : "Download";

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

          {/* Scope hint */}
          <p className="field-hint">
            Downloading:{" "}
            <span className="font-medium text-foreground">
              {drawnStyleLabels.length > 1
                ? `${drawnStyleLabels.join(", ")} (as a .zip)`
                : `${drawnStyleLabels[0] ?? ""} (.otf)`}
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
            onClick={() => onDownload(fontName.trim() || "My Handwriting")}
            disabled={isDownloading}
            className="btn btn-md btn-neu-accent gap-1.5"
          >
            <Download size={13} />
            {buttonLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
