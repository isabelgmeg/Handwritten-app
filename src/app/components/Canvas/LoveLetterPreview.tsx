import { PreviewCanvas } from "./PreviewCanvas";
import type { Stroke, ScriptMode } from "@/types";

interface LoveLetterPreviewProps {
  toName: string;
  dateText: string;
  bodyText: string;
  glyphs: Record<string, Stroke[]>;
  previewSize: number;
  letterSpacing: number;
  lineHeight: number;
  scriptMode: ScriptMode;
}

export function LoveLetterPreview({
  toName,
  dateText,
  bodyText,
  glyphs,
  previewSize,
  letterSpacing,
  lineHeight,
  scriptMode,
}: LoveLetterPreviewProps) {
  const letterScale = previewSize / 40;

  return (
    <div
      className="love-letter-card"
      style={{ "--letter-scale": letterScale } as React.CSSProperties}
    >
      <img
        src="/images/adhesive_tape.png"
        alt=""
        aria-hidden
        className="love-letter-tape"
      />
      <div className="love-letter-note-header">NOTE</div>

      <div className="love-letter-rule" />

      <div className="love-letter-fields">
        <div className="love-letter-field">
          <span className="love-letter-label">TO:</span>
          <span className="love-letter-field-value">{toName || "Myself"}</span>
        </div>
        <div className="love-letter-field">
          <span className="love-letter-label">DATE:</span>
          <span className="love-letter-field-value">{dateText}</span>
        </div>
      </div>

      <div className="love-letter-rule" />

      <div className="love-letter-body-box">
        <PreviewCanvas
          previewText={bodyText}
          glyphs={glyphs}
          previewSize={previewSize}
          letterSpacing={letterSpacing}
          lineHeight={lineHeight}
          scriptMode={scriptMode}
        />
      </div>

      <div className="love-letter-footer">
        <span className="love-letter-label">VOLUME</span>
        <span className="love-letter-footer-dash" />
        <span className="love-letter-footer-italic">one</span>
      </div>
    </div>
  );
}
