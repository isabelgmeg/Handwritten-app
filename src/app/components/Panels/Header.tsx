import { LogoMark } from "../common/LogoMark";

interface HeaderProps {
  view: "landing" | "studio" | "about";
  onAbout: () => void;
  onBack?: () => void;
}

export function Header({ view, onAbout, onBack }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card px-5 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <LogoMark className="text-foreground h-[14px] w-auto flex-shrink-0" />
        <span className="text-border select-none text-lg opacity-60">|</span>
        <span
          className="text-foreground leading-none"
          style={{ fontFamily: "var(--font-script)", fontSize: "1.4rem" }}
        >
          Love letter studio
        </span>
      </div>

      <div className="flex items-center">
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
