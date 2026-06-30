import { X } from "lucide-react";
import {
  ConnectedScriptSection,
  BrushSection,
  BrushSettingsSection,
  StrokeQualitySection,
  PreviewSettingsSection,
  ThemeSection,
} from "../Sections";
import type { BrushSettings, BrushSettingsActions, ScriptMode } from "@/types";

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  brushSettings: BrushSettings;
  brushActions: BrushSettingsActions;
  scriptMode: ScriptMode;
  onScriptModeChange: (mode: ScriptMode) => void;
  previewSize: number;
  onPreviewSizeChange: (v: number) => void;
  letterSpacing: number;
  onLetterSpacingChange: (v: number) => void;
  lineHeight: number;
  onLineHeightChange: (v: number) => void;
  themeHue: number;
  onThemeHueChange: (hue: number) => void;
}

export function RightPanel({
  isOpen,
  onClose,
  brushSettings,
  brushActions,
  scriptMode,
  onScriptModeChange,
  previewSize,
  onPreviewSizeChange,
  letterSpacing,
  onLetterSpacingChange,
  lineHeight,
  onLineHeightChange,
  themeHue,
  onThemeHueChange,
}: RightPanelProps) {
  const { brushType, brushSize, opacity, stabilizer, smoothing, streamline, thinning, taper, grain } = brushSettings;
  const { setBrushType, setBrushSize, setOpacity, setStabilizer, setSmoothing, setStreamline, setThinning, setTaper, setGrain } = brushActions;

  return (
    <aside
      className="panel-aside border-l fixed right-0 bottom-0 z-50 flex flex-col"
      style={{
        top: "var(--header-height, 53px)",
        width: isOpen ? "min(272px, 100vw)" : 0,
        boxShadow: isOpen ? "-2px 0 12px rgba(0,0,0,0.08)" : "none",
      }}
    >
      {/* Header — stays fixed while content scrolls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0" style={{ minWidth: 272 }}>
        <span className="label-caps">Brush & settings</span>
        <button onClick={onClose} className="btn btn-icon-sm btn-ghost" aria-label="Close panel">
          <X size={13} />
        </button>
      </div>

      {/* Scrollable settings */}
      <div className="panel-scroll flex-1" style={{ minWidth: 272 }}>
        <div className="px-4 py-4">
          <BrushSection brushType={brushType} onBrushTypeChange={setBrushType} />
          <BrushSettingsSection
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            opacity={opacity}
            onOpacityChange={setOpacity}
            stabilizer={stabilizer}
            onStabilizerChange={setStabilizer}
          />
          <StrokeQualitySection
            brushType={brushType}
            smoothing={smoothing}
            onSmoothingChange={setSmoothing}
            streamline={streamline}
            onStreamlineChange={setStreamline}
            thinning={thinning}
            onThinningChange={setThinning}
            taper={taper}
            onTaperChange={setTaper}
            grain={grain}
            onGrainChange={setGrain}
          />
          <ConnectedScriptSection scriptMode={scriptMode} onScriptModeChange={onScriptModeChange} />
          <PreviewSettingsSection
            previewSize={previewSize}
            onPreviewSizeChange={onPreviewSizeChange}
            letterSpacing={letterSpacing}
            onLetterSpacingChange={onLetterSpacingChange}
            lineHeight={lineHeight}
            onLineHeightChange={onLineHeightChange}
          />
          <ThemeSection themeHue={themeHue} onThemeHueChange={onThemeHueChange} />
        </div>
      </div>
    </aside>
  );
}
