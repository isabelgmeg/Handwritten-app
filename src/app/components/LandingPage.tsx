interface LandingPageProps {
  onEnterStudio: () => void;
  hideCta?: boolean;
}

export function LandingPage({ onEnterStudio, hideCta }: LandingPageProps) {
  return (
    <main className="flex-1 flex flex-col items-center overflow-y-auto bg-background">

      {/* ── Hero: overlapping typographic stack ── */}
      <section
        className="w-full max-w-4xl mx-auto px-8 pt-14 pb-8 text-center"
        style={{ isolation: "isolate" }}
      >
        {/* Grid trick: both elements share the same cell so they center on each other */}
        <div
          style={{
            display: "grid",
            placeItems: "center",
          }}
        >
          <h1
            className="leading-none mix-blend-multiply select-none"
            style={{
              gridArea: "1 / 1",
              fontFamily: "var(--font-script)",
              fontSize: "clamp(4rem, 11vw, 9rem)",
              color: "var(--color-mark-vivid)",
              lineHeight: 1,
              width: "100%",
            }}
          >
            A love letter in times of AI
          </h1>

          <p
            className="mix-blend-multiply"
            style={{
              gridArea: "1 / 1",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.3rem, 2.8vw, 2.2rem)",
              color: "var(--color-text-base)",
              lineHeight: 1.25,
              maxWidth: "32rem",
              zIndex: 10,
            }}
          >
            Anyone feels like we are losing some of the expression,
            creativity and warmth that makes us human?
          </p>
        </div>
      </section>

      {/* Sub-tagline */}
      <p
        className="text-muted-foreground text-center px-8 mb-14 max-w-sm"
        style={{
          fontFamily: "var(--font-script)",
          fontSize: "clamp(0.95rem, 1.6vw, 1.2rem)",
        }}
      >
        Made from my own handwriting, sweat and ADHD
      </p>

      {/* ── CTA ── */}
      {!hideCta && (
        <section className="flex flex-col items-center pb-20 px-6">
          <button
            onClick={onEnterStudio}
            className="btn btn-lg btn-neu-accent"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.03em" }}
          >
            Open the Love Letter Studio
          </button>
        </section>
      )}
    </main>
  );
}
