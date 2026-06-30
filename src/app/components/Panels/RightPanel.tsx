import {
  ConnectedScriptSection,
  BrushSection,
  BrushSettingsSection,
  StrokeQualitySection,
  PreviewSettingsSection,
} from "../Sections";
import type { BrushSettings, BrushSettingsActions, ScriptMode } from "@/types";

interface RightPanelProps {
  isOpen: boolean;
  brushSettings: BrushSettings;
  brushActions: BrushSettingsActions;
  scriptMode: ScriptMode;
  onScriptModeChange: (mode: ScriptMode) => void;
  previewSize: number;
  onPreviewSizeChange: (v: number) => void;
  letterSpacing: number;
  onLetterSpacingChange: (v: number) => void;
}

export function RightPanel({
  isOpen,
  brushSettings,
  brushActions,
  scriptMode,
  onScriptModeChange,
  previewSize,
  onPreviewSizeChange,
  letterSpacing,
  onLetterSpacingChange,
}: RightPanelProps) {
  const { brushType, brushSize, opacity, stabilizer, smoothing, streamline, thinning, taper, grain } = brushSettings;
  const { setBrushType, setBrushSize, setOpacity, setStabilizer, setSmoothing, setStreamline, setThinning, setTaper, setGrain } = brushActions;

  return (
    <aside
      className="panel-aside border-l max-lg:absolute max-lg:right-0 max-lg:top-0 max-lg:bottom-0 max-lg:z-50"
      style={{ width: isOpen ? 272 : 0 }}
    >
      <div className="panel-scroll w-[272px]">
        <div className="px-4 py-5">
          {/* ── Drawing tool ───────────────────────────────── */}
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

          {/* ── Font behavior ──────────────────────────────── */}
          <ConnectedScriptSection scriptMode={scriptMode} onScriptModeChange={onScriptModeChange} />

          {/* ── Preview output ─────────────────────────────── */}
          <PreviewSettingsSection
            previewSize={previewSize}
            onPreviewSizeChange={onPreviewSizeChange}
            letterSpacing={letterSpacing}
            onLetterSpacingChange={onLetterSpacingChange}
          />
        </div>
      </div>
    </aside>
  );
}
