import type { ScriptMode } from "@/types";

interface ConnectedScriptSectionProps {
  scriptMode: ScriptMode;
  onScriptModeChange: (mode: ScriptMode) => void;
}

export function ConnectedScriptSection({ scriptMode, onScriptModeChange }: ConnectedScriptSectionProps) {
  const isConnected = scriptMode === "connected";

  return (
    <div className="section-root">
      <div className="section-header" style={{ marginBottom: 0 }}>
        <span className="label-caps">Connected Script</span>
        <button
          role="switch"
          aria-checked={isConnected}
          onClick={() => onScriptModeChange(isConnected ? "normal" : "connected")}
          className="toggle-switch"
          data-state={isConnected ? "on" : "off"}
        />
      </div>
      {isConnected && (
        <p className="field-hint mt-2 leading-relaxed">
          Start each glyph at the left guide dot and end at the right — glyphs join at the baseline in preview and export.
        </p>
      )}
    </div>
  );
}
