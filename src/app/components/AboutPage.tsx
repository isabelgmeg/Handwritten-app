import { LogoMark } from "./common/LogoMark";

export function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-var(--header-height,53px))] bg-background text-foreground flex flex-col items-center px-6 py-12 sm:py-20">

      {/* ── Manifesto: overlapping typographic stack (moved here from the old home hero) ── */}
      <section className="w-full max-w-4xl mx-auto px-2 pb-8 text-center" style={{ isolation: "isolate" }}>
        {/* Grid trick: both elements share the same cell so they center on each other */}
        <div style={{ display: "grid", placeItems: "center" }}>
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

      <p
        className="text-muted-foreground text-center px-8 mb-16 max-w-sm"
        style={{ fontFamily: "var(--font-script)", fontSize: "clamp(0.95rem, 1.6vw, 1.2rem)" }}
      >
        Made from my own handwriting, sweat and ADHD
      </p>

      <div className="w-full max-w-md flex flex-col items-center gap-10 sm:gap-12">

        <img
          src="/images/WIP.png"
          alt="Work in progress illustration"
          className="w-full max-w-[320px] sm:max-w-[400px] h-auto object-contain select-none"
          style={{ mixBlendMode: "difference" }}
          draggable={false}
        />

        <div className="flex flex-col items-center gap-5 text-center">
          <h2
            className="text-foreground leading-tight"
            style={{ fontFamily: "var(--font-script)", fontSize: "clamp(2rem, 6vw, 2.8rem)" }}
          >
            perpetually wip.
          </h2>

          <p
            className="leading-relaxed max-w-[30ch]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(0.95rem, 2.5vw, 1.05rem)",
              color: "var(--color-text-secondary)",
            }}
          >
            I don't have a portfolio. I get lost in the details and end up switching to something new before finishing the last thing.
          </p>

          <p
            className="leading-relaxed max-w-[28ch]"
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "clamp(1.4rem, 4.5vw, 1.8rem)",
              color: "var(--color-mark-vivid)",
              lineHeight: 1.4,
            }}
          >
            I hope you enjoy the font — and keep on being gloriously, imperfectly human.
          </p>
        </div>

        <LogoMark className="h-[12px] w-auto opacity-40" />

      </div>
    </div>
  );
}
