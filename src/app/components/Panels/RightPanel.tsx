import {
  BrushSection,
  SizeSection,
  OpacitySection,
  StabilizerSection,
  StrokeQualitySection,
  GrainSection,
  ProgressSection,
} from "../Sections";
import type { BrushType, StyleGlyphs, FontStyle } from "@/types";
import { CHAR_GROUPS } from "@/constants";

interface RightPanelProps {
  isOpen: boolean;
  brushType: BrushType;
  onBrushTypeChange: (type: BrushType) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onBrushSizeMinus: () => void;
  onBrushSizePlus: () => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  onOpacityMinus: () => void;
  onOpacityPlus: () => void;
  stabilizer: number;
  onStabilizerChange: (stabilizer: number) => void;
  onStabilizerMinus: () => void;
  onStabilizerPlus: () => void;
  smoothing: number;
  onSmoothingChange: (v: number) => void;
  streamline: number;
  onStreamlineChange: (v: number) => void;
  thinning: number;
  onThinningChange: (v: number) => void;
  taper: number;
  onTaperChange: (v: number) => void;
  grain: number;
  onGrainChange: (v: number) => void;
  glyphs: StyleGlyphs;
  activeStyle: FontStyle;
}

export function RightPanel({
  isOpen,
  brushType,
  onBrushTypeChange,
  brushSize,
  onBrushSizeChange,
  onBrushSizeMinus,
  onBrushSizePlus,
  opacity,
  onOpacityChange,
  onOpacityMinus,
  onOpacityPlus,
  stabilizer,
  onStabilizerChange,
  onStabilizerMinus,
  onStabilizerPlus,
  smoothing,
  onSmoothingChange,
  streamline,
  onStreamlineChange,
  thinning,
  onThinningChange,
  taper,
  onTaperChange,
  grain,
  onGrainChange,
  glyphs,
  activeStyle,
}: RightPanelProps) {
  // Calculate glyph counts for progress
  const glyphCounts = Object.fromEntries(
    CHAR_GROUPS.map((group) => [
      group.label,
      group.chars.filter((c) => (glyphs[activeStyle][c]?.length ?? 0) > 0)
        .length,
    ])
  );

  return (
    <aside
      className="border-l border-border bg-card flex-shrink-0 overflow-hidden"
      style={{ width: isOpen ? 272 : 0, transition: "width 200ms ease" }}
    >
      <div className="w-[272px] h-full overflow-y-auto">
        <div className="px-4 py-5 space-y-0">
          <BrushSection
            brushType={brushType}
            onBrushTypeChange={onBrushTypeChange}
          />

          <SizeSection
            brushSize={brushSize}
            onSizeChange={onBrushSizeChange}
            onSizeMinus={onBrushSizeMinus}
            onSizePlus={onBrushSizePlus}
          />

          <OpacitySection
            opacity={opacity}
            onOpacityChange={onOpacityChange}
            onOpacityMinus={onOpacityMinus}
            onOpacityPlus={onOpacityPlus}
          />

          <StabilizerSection
            stabilizer={stabilizer}
            onStabilizerChange={onStabilizerChange}
            onStabilizerMinus={onStabilizerMinus}
            onStabilizerPlus={onStabilizerPlus}
          />

          <StrokeQualitySection
            smoothing={smoothing}
            onSmoothingChange={onSmoothingChange}
            streamline={streamline}
            onStreamlineChange={onStreamlineChange}
            thinning={thinning}
            onThinningChange={onThinningChange}
            taper={taper}
            onTaperChange={onTaperChange}
          />

          <GrainSection grain={grain} onGrainChange={onGrainChange} />

          <ProgressSection glyphCounts={glyphCounts} />
        </div>
      </div>
    </aside>
  );
}
