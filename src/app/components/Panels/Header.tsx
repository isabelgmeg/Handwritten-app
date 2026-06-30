import { Download } from "lucide-react";
import { LogoMark } from "../common/LogoMark";

interface HeaderProps {
  view: "landing" | "studio" | "about";
  onAbout: () => void;
  onBack?: () => void;
  onDownload?: () => void;
  onDownloadAll?: () => void;
  drawnCount?: number;
  totalDrawnCount?: number;
  activeStyleLabel?: string;
}

export function Header({
  view,
  onAbout,
  onBack,
  onDownload,
  onDownloadAll,
  drawnCount = 0,
  totalDrawnCount = 0,
  activeStyleLabel = "",
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card px-5 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <LogoMark className="text-foreground h-[14px] w-auto flex-shrink-0" />
        <span className="text-border select-none text-lg opacity-60">|</span>
        <span
          className="text-foreground leading-none truncate"
          style={{ fontFamily: "var(--font-script)", fontSize: "1.4rem" }}
        >
          Love letter studio
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {view === "studio" && (
          <>
            <button
              onClick={onDownload}
              disabled={drawnCount === 0}
              title={drawnCount === 0 ? `Draw some ${activeStyleLabel} characters first` : `Download ${activeStyleLabel}`}
              className="btn btn-sm btn-neu-accent gap-1.5"
            >
              <Download size={12} />
              <span className="hidden sm:inline">{activeStyleLabel}</span>
              {drawnCount > 0 && <span className="opacity-60 text-[10px]">{drawnCount}</span>}
            </button>
            <button
              onClick={onDownloadAll}
              disabled={totalDrawnCount === 0}
              title={totalDrawnCount === 0 ? "Draw some characters first" : "Download all drawn styles"}
              className="btn btn-sm btn-ghost gap-1.5"
            >
              All
              {totalDrawnCount > 0 && <span className="opacity-50 text-[10px]">{totalDrawnCount}</span>}
            </button>
            <span className="text-border opacity-40 select-none">|</span>
          </>
        )}

        {view === "about" ? (
          <button onClick={onBack} className="btn btn-sm btn-ghost">
            ← studio
          </button>
        ) : (
          <button
            onClick={onAbout}
            className="btn btn-sm btn-ghost"
            style={{ fontFamily: "var(--font-script)", fontSize: "1rem" }}
          >
            about
          </button>
        )}
      </div>
    </header>
  );
}
