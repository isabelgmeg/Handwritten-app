import { useLayoutEffect, useRef } from "react";
import { Download } from "lucide-react";
import { LogoMark } from "../common/LogoMark";

interface HeaderProps {
  view: "landing" | "studio" | "about" | "community";
  onAbout: () => void;
  onBack?: () => void;
  onCommunity?: () => void;
  onDownload?: () => void;
  totalDrawnCount?: number;
}

export function Header({
  view,
  onAbout,
  onBack,
  onCommunity,
  onDownload,
  totalDrawnCount = 0,
}: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setHeight = () => {
      document.documentElement.style.setProperty("--header-height", `${el.offsetHeight}px`);
    };
    setHeight();
    const observer = new ResizeObserver(setHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 border-b px-5 flex items-center justify-between gap-4"
      style={{
        paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
        paddingBottom: "0.75rem",
        ...(view === "community"
          ? { backgroundColor: "#F5F0E4", borderColor: "oklch(0 0 0 / 0.07)" }
          : { backgroundColor: "var(--card)", borderColor: "var(--border)" }),
      }}
    >
      <div className="flex items-center gap-3">
        <LogoMark className="text-foreground h-[14px] w-auto flex-shrink-0 hidden sm:inline" />
        <span className="text-border select-none text-lg opacity-60 hidden sm:inline">|</span>
        <span
          className="text-foreground leading-none"
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
              disabled={totalDrawnCount === 0}
              title={totalDrawnCount === 0 ? "Draw some characters first" : "Download all drawn styles"}
              className="btn btn-sm btn-neu-accent gap-1.5"
            >
              <Download size={12} />
              <span className="hidden sm:inline">Download</span>
              {totalDrawnCount > 0 && <span className="opacity-60 text-[10px]">{totalDrawnCount}</span>}
            </button>
            <span className="text-border opacity-40 select-none">|</span>
          </>
        )}

        {view === "about" || view === "community" ? (
          <button
            onClick={onBack}
            className="btn btn-sm btn-ghost"
            style={view === "community"
              ? { backgroundColor: "#F5F0E4", boxShadow: "3px 3px 6px #d7d1c4, -3px -3px 6px #ffffff" }
              : undefined
            }
          >
            ← studio
          </button>
        ) : (
          <>
            <button
              onClick={onCommunity}
              className="btn btn-sm btn-ghost hidden sm:inline-flex"
              style={{ fontFamily: "var(--font-script)", fontSize: "1rem" }}
            >
              community
            </button>
            <button
              onClick={onAbout}
              className="btn btn-sm btn-ghost"
              style={{ fontFamily: "var(--font-script)", fontSize: "1rem" }}
            >
              about
            </button>
          </>
        )}
      </div>
    </header>
  );
}
