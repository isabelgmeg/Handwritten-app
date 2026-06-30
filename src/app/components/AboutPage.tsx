import { LogoMark } from "./common/LogoMark";

export function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-var(--header-height,53px))] bg-background text-foreground flex flex-col items-center justify-center px-6 py-12 sm:py-20">
      <div className="w-full max-w-md flex flex-col items-center gap-10 sm:gap-12">

        <img
          src="/images/WIP.png"
          alt="Work in progress illustration"
          className="w-full max-w-[320px] sm:max-w-[400px] h-auto object-contain select-none"
          style={{ mixBlendMode: "difference" }}
          draggable={false}
        />

        <div className="flex flex-col items-center gap-5 text-center">
          <h1
            className="text-foreground leading-tight"
            style={{ fontFamily: "var(--font-script)", fontSize: "clamp(2rem, 6vw, 2.8rem)" }}
          >
            perpetually wip.
          </h1>

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
