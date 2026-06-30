import { useState, useRef, useEffect, useCallback } from "react";
import getStroke from "perfect-freehand";
import { ChevronLeft, ChevronRight, Undo2, Trash2, Type } from "lucide-react";

// Types
import type { BrushType, Stroke, StyleGlyphs, PFOptions } from "@/types";

// Constants
import {
  CANVAS_WIDTH as CW,
  CANVAS_HEIGHT as CH,
  CAP_Y,
  DESC_Y,
} from "@/constants";
import { ALL_CHARS, FONT_STYLES } from "@/constants";

// Services
import {
  LazyBrush,
  fullRedraw,
  downloadFont,
  downloadAllStyles,
  autoGenerateBold,
  autoGenerateItalic,
  autoGenerateBoldItalic,
  getOrCreateGrainCanvas,
  getOrCreateGrainPixels,
  getAnchorPositions,
  applyBrushFill,
  drawBallpointDabs,
} from "@/services";
import { buildBrushOptions, svgPathFromStroke, getCanvasTheme } from "@/utils";
import type { CanvasTheme } from "@/utils/canvasTheme";

// Hooks
import {
  useGlyphState,
  useBrushSettings,
  usePreviewState,
  useCanvasState,
  useLayoutState,
  useLazyDot,
} from "@/hooks";

// Components
import { Header } from "./components/Panels/Header";
import { StyleCircle } from "./components/common/StyleCircle";
import { LeftPanel } from "./components/Panels/LeftPanel";
import { RightPanel } from "./components/Panels/RightPanel";
import { DrawingCanvas } from "./components/Canvas/DrawingCanvas";
import { PreviewCanvas } from "./components/Canvas/PreviewCanvas";

// ── Initial State ────────────────────────────────────────────────────────────

const EMPTY_STYLE_GLYPHS: StyleGlyphs = {
  regular: {},
  bold: {},
  italic: {},
  "bold-italic": {},
};

// ── Main App Component ───────────────────────────────────────────────────────

export default function App() {
  // Refs for canvas and drawing
  const committedRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef<HTMLCanvasElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const lazy = useRef(new LazyBrush());
  const isDrawing = useRef(false);
  const currentPoints = useRef<[number, number, number][]>([]);
  const currentOpts = useRef<PFOptions | null>(null);
  const currentOpacRef = useRef(1);
  const currentBrushTR = useRef<BrushType>("round");
  const canvasDisplayScale = useRef(1);
  const isDraggingAnchor = useRef(false);
  const canvasThemeRef = useRef<CanvasTheme>(getCanvasTheme());
  const [anchorCursor, setAnchorCursor] = useState("crosshair");

  // Glyph state
  const [glyphs, setGlyphs] = useState<StyleGlyphs>(EMPTY_STYLE_GLYPHS);

  // Brush settings
  const brushSettings = useBrushSettings();

  // Preview state
  const previewState = usePreviewState();

  // Canvas state
  const canvasState = useCanvasState();

  const glyphState = useGlyphState(setGlyphs, canvasState.activeStyle);

  // Layout state
  const layoutState = useLayoutState();

  // Lazy dot state
  const lazyDot = useLazyDot();

  const currentStrokes = glyphs[canvasState.activeStyle][canvasState.currentChar] ?? [];
  const drawnCount = Object.values(glyphs[canvasState.activeStyle]).filter((s) => s.length > 0).length;
  const regularDrawnCount = Object.values(glyphs.regular).filter((s) => s.length > 0).length;
  const dotRadius = brushSettings.stabilizer * canvasDisplayScale.current;

  // ── Event Handlers ───────────────────────────────────────────────────────

  const handleFontUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const buf = await file.arrayBuffer();
      const name = "UserFont_" + Date.now();
      const face = new FontFace(name, buf);
      await face.load();
      document.fonts.add(face);
      canvasState.setTemplateFont(name);
      canvasState.setTemplateFontLabel(file.name.replace(/\.[^.]+$/, ""));
    } catch {
      alert("Could not load font file. Make sure it is a valid .otf or .ttf.");
    }
  }, [canvasState]);

  const navigateChar = useCallback(
    (dir: 1 | -1) => {
      const idx = ALL_CHARS.indexOf(canvasState.currentChar);
      canvasState.setCurrentChar(
        ALL_CHARS[(idx + dir + ALL_CHARS.length) % ALL_CHARS.length]
      );
      currentPoints.current = [];
      isDrawing.current = false;
    },
    [canvasState]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = activeRef.current!.getBoundingClientRect();
      const sx = CW / rect.width;
      const sy = CH / rect.height;
      const x = (e.clientX - rect.left) * sx;
      const y = (e.clientY - rect.top) * sy;

      if (canvasState.scriptMode === "connected") {
        const { entryX, exitX } = getAnchorPositions(previewState.letterSpacing, canvasState.scriptMode);
        const ay = canvasState.connectAnchorY;
        const HIT = 14;
        if (Math.hypot(x - entryX, y - ay) < HIT || Math.hypot(x - exitX, y - ay) < HIT) {
          isDraggingAnchor.current = true;
          return;
        }
      }

      lazy.current.x = x;
      lazy.current.y = y;
      currentOpts.current = buildBrushOptions(
        brushSettings.brushType,
        brushSettings.brushSize,
        brushSettings.thinning,
        brushSettings.smoothing,
        brushSettings.streamline,
        brushSettings.taper
      );
      currentOpacRef.current = brushSettings.opacity;
      currentBrushTR.current = brushSettings.brushType;
      currentPoints.current = [[x, y, e.pressure > 0 ? e.pressure : 0.5]];
      isDrawing.current = true;
    },
    [brushSettings, canvasState, previewState.letterSpacing]
  );

  const renderActiveStroke = useCallback(() => {
    const canvas = activeRef.current;
    if (!canvas || !currentOpts.current) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CW, CH);
    const pts = currentPoints.current;
    if (pts.length < 2) return;

    if (currentBrushTR.current === "ballpoint") {
      drawBallpointDabs(
        ctx,
        pts,
        currentOpts.current.size,
        currentOpacRef.current,
        brushSettings.grain,
        getOrCreateGrainPixels(),
        canvasThemeRef.current,
      );
      return;
    }

    const outline = getStroke(pts, currentOpts.current);
    if (outline.length < 4) return;
    const path = new Path2D(svgPathFromStroke(outline));
    ctx.save();
    applyBrushFill(ctx, path, pts, currentOpts.current, currentBrushTR.current, currentOpacRef.current, canvasThemeRef.current);
    ctx.restore();
  }, [brushSettings.grain]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
      for (const evt of events) {
        const rect = activeRef.current!.getBoundingClientRect();
        const sx = CW / rect.width;
        const sy = CH / rect.height;
        canvasDisplayScale.current = rect.width / CW;
        const px = (evt.clientX - rect.left) * sx;
        const py = (evt.clientY - rect.top) * sy;
        const pressure = evt.pressure > 0 ? evt.pressure : 0.5;

        if (isDraggingAnchor.current) {
          const clampedY = Math.max(CAP_Y + 10, Math.min(DESC_Y - 10, py));
          canvasState.setConnectAnchorY(clampedY);
          continue;
        }

        if (canvasState.scriptMode === "connected" && !isDrawing.current) {
          const { entryX, exitX } = getAnchorPositions(previewState.letterSpacing, canvasState.scriptMode);
          const ay = canvasState.connectAnchorY;
          const HIT = 14;
          const near =
            Math.hypot(px - entryX, py - ay) < HIT ||
            Math.hypot(px - exitX, py - ay) < HIT;
          setAnchorCursor(near ? "ns-resize" : "crosshair");
        }

        const moved = lazy.current.update(px, py, brushSettings.stabilizer);
        lazyDot.setDotPos({ x: lazy.current.x / sx, y: lazy.current.y / sy });
        lazyDot.setShowDot(true);

        if (!isDrawing.current) continue;
        if (moved || brushSettings.stabilizer <= 0) {
          currentPoints.current = [
            ...currentPoints.current,
            [lazy.current.x, lazy.current.y, pressure],
          ];
          renderActiveStroke();
        }
      }
    },
    [brushSettings.stabilizer, lazyDot, renderActiveStroke, canvasState, previewState.letterSpacing]
  );

  const onPointerUp = useCallback(() => {
    if (isDraggingAnchor.current) {
      isDraggingAnchor.current = false;
      return;
    }
    if (!isDrawing.current || currentPoints.current.length === 0) return;
    isDrawing.current = false;
    lazyDot.setShowDot(false);

    const newStroke: Stroke = {
      points: [...currentPoints.current],
      options: currentOpts.current!,
      brushType: currentBrushTR.current,
      opacity: currentOpacRef.current,
    };

    glyphState.addStroke(canvasState.currentChar, newStroke);
    currentPoints.current = [];
    activeRef.current?.getContext("2d")?.clearRect(0, 0, CW, CH);
  }, [canvasState.currentChar, glyphState, lazyDot]);

  const undoStroke = useCallback(() => {
    glyphState.undoStroke(canvasState.currentChar);
  }, [canvasState.currentChar, glyphState]);

  const clearGlyph = useCallback(() => {
    glyphState.clearGlyph(canvasState.currentChar);
  }, [canvasState.currentChar, glyphState]);

  const handleAutoGenerateBold = useCallback(() => {
    setGlyphs((prev) => autoGenerateBold(prev));
  }, []);

  const handleAutoGenerateItalic = useCallback(() => {
    setGlyphs((prev) => autoGenerateItalic(prev));
  }, []);

  const handleAutoGenerateBoldItalic = useCallback(() => {
    setGlyphs((prev) => autoGenerateBoldItalic(prev));
  }, []);

  const handleDownloadFont = useCallback(async () => {
    await downloadFont(glyphs, canvasState.activeStyle, canvasState.fontName, previewState.letterSpacing, canvasState.scriptMode);
  }, [glyphs, canvasState.activeStyle, canvasState.fontName, previewState.letterSpacing, canvasState.scriptMode]);

  const handleDownloadAllStyles = useCallback(async () => {
    await downloadAllStyles(glyphs, canvasState.fontName, previewState.letterSpacing, canvasState.scriptMode);
  }, [glyphs, canvasState.fontName, previewState.letterSpacing, canvasState.scriptMode]);

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const c = committedRef.current;
    const isItalic = canvasState.activeStyle === "italic" || canvasState.activeStyle === "bold-italic";
    const grainCanvas = getOrCreateGrainCanvas();
    // Refresh theme once per redraw cycle (not on every pointer event)
    canvasThemeRef.current = getCanvasTheme();
    if (c) {
      fullRedraw(
        c,
        currentStrokes,
        canvasState.currentChar,
        canvasState.showGuides,
        canvasState.showTemplate,
        brushSettings.grain,
        grainCanvas,
        canvasThemeRef.current,
        canvasState.templateFont,
        isItalic,
        canvasState.scriptMode,
        previewState.letterSpacing,
        canvasState.connectAnchorY
      );
    }
  }, [
    currentStrokes,
    canvasState.currentChar,
    canvasState.showGuides,
    canvasState.showTemplate,
    brushSettings.grain,
    canvasState.templateFont,
    canvasState.activeStyle,
    canvasState.scriptMode,
    previewState.letterSpacing,
    canvasState.connectAnchorY,
  ]);

  useEffect(() => {
    const ctx = activeRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, CW, CH);
  }, [canvasState.currentChar]);


  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Header
        fontName={canvasState.fontName}
        onFontNameChange={canvasState.setFontName}
        drawnCount={drawnCount}
        showTemplate={canvasState.showTemplate}
        onShowTemplateChange={canvasState.setShowTemplate}
        templateFontLabel={canvasState.templateFontLabel}
        onImportFont={() => fontInputRef.current?.click()}
        showGuides={canvasState.showGuides}
        onShowGuidesChange={canvasState.setShowGuides}
        activeStyle={canvasState.activeStyle}
        onDownloadFont={handleDownloadFont}
        onDownloadAllStyles={handleDownloadAllStyles}
        onLeftPanelToggle={layoutState.toggleLeft}
        onRightPanelToggle={layoutState.toggleRight}
        fontInputRef={fontInputRef}
      />

      <div className="flex flex-1 min-h-0 relative">
        {/* Backdrop — closes any open overlay panel on mobile */}
        {(layoutState.leftOpen || layoutState.rightOpen) && (
          <div
            className="absolute inset-0 z-40 bg-black/20 lg:hidden"
            onClick={layoutState.closeAll}
          />
        )}

        <LeftPanel
          isOpen={layoutState.leftOpen}
          glyphs={glyphs}
          activeStyle={canvasState.activeStyle}
          currentChar={canvasState.currentChar}
          onCharSelect={(char) => {
            canvasState.setCurrentChar(char);
            currentPoints.current = [];
            isDrawing.current = false;
          }}
        />

        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-background min-w-0">
          {/* Drawing area */}
          <div className="flex-shrink-0 flex flex-col items-center px-4 sm:px-6 pt-4 pb-2 gap-3">

            {/* Style selector */}
            <div className="flex flex-wrap items-center gap-1.5 self-stretch justify-center">
              {FONT_STYLES.map(({ key, label }) => {
                const count = Object.values(glyphs[key]).filter((s) => s.length > 0).length;
                const isActive = key === canvasState.activeStyle;
                const canAutoGenerate = key !== "regular" && regularDrawnCount > 0 && count === 0;

                return (
                  <div key={key} className="flex items-center">
                    <button
                      onClick={() => canvasState.setActiveStyle(key)}
                      className={isActive ? "style-btn-active" : "style-btn"}
                      style={{
                        fontStyle:  key.includes("italic") ? "italic" : "normal",
                        fontWeight: isActive ? 700 : key.includes("bold") ? 700 : 400,
                      }}
                    >
                      {isActive && <StyleCircle />}
                      <span>{label}</span>
                      {count > 0 && (
                        <span className="text-[10px] opacity-50 ml-0.5">{count}</span>
                      )}
                    </button>
                    {canAutoGenerate && (
                      <button
                        onClick={() =>
                          key === "bold"
                            ? handleAutoGenerateBold()
                            : key === "italic"
                              ? handleAutoGenerateItalic()
                              : handleAutoGenerateBoldItalic()
                        }
                        className="style-btn text-accent"
                        title={`Auto-generate ${label} from Regular`}
                      >
                        auto
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Char nav */}
            <div className="flex items-center gap-4">
              <button onClick={() => navigateChar(-1)} className="btn btn-icon-md btn-ghost">
                <ChevronLeft size={15} />
              </button>
              <div className="text-center w-16">
                <span className="char-display">{canvasState.currentChar}</span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {currentStrokes.length} stroke{currentStrokes.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button onClick={() => navigateChar(1)} className="btn btn-icon-md btn-ghost">
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Drawing canvas */}
            <DrawingCanvas
              committedRef={committedRef}
              activeRef={activeRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              showDot={lazyDot.showDot}
              dotPos={lazyDot.dotPos}
              dotRadius={dotRadius}
              cursorStyle={anchorCursor}
            />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={undoStroke}
                disabled={currentStrokes.length === 0}
                className="btn btn-sm btn-ghost gap-1.5"
              >
                <Undo2 size={12} /> Undo
              </button>
              <button
                onClick={clearGlyph}
                disabled={currentStrokes.length === 0}
                className="btn btn-sm btn-ghost gap-1.5"
              >
                <Trash2 size={12} /> Clear
              </button>
            </div>
          </div>

          {/* Preview section */}
          <div className="flex-shrink-0 mx-4 mb-4 rounded border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-card border-b border-border">
              <Type size={13} className="text-accent flex-shrink-0" />
              <span className="label-caps">Text Preview</span>
            </div>

            <div className="bg-card p-4 space-y-3">
              <textarea
                value={previewState.previewText}
                onChange={(e) => previewState.setPreviewText(e.target.value)}
                rows={2}
                className="textarea-field"
                placeholder="Type anything to preview your font…"
              />

              <PreviewCanvas
                previewText={previewState.previewText}
                glyphs={glyphs[canvasState.activeStyle]}
                previewSize={previewState.previewSize}
                letterSpacing={previewState.letterSpacing}
                scriptMode={canvasState.scriptMode}
              />

              {drawnCount === 0 && (
                <p className="text-xs text-muted-foreground text-center italic">
                  Draw some characters above — they will appear here in your font.
                </p>
              )}
            </div>
          </div>
        </main>

        <RightPanel
          isOpen={layoutState.rightOpen}
          brushSettings={brushSettings.settings}
          brushActions={brushSettings.actions}
          scriptMode={canvasState.scriptMode}
          onScriptModeChange={canvasState.setScriptMode}
          previewSize={previewState.previewSize}
          onPreviewSizeChange={previewState.setPreviewSize}
          letterSpacing={previewState.letterSpacing}
          onLetterSpacingChange={previewState.setLetterSpacing}
        />
      </div>

      {/* Hidden file input for font upload */}
      <input
        ref={fontInputRef}
        type="file"
        accept=".otf,.ttf,.woff,.woff2"
        className="hidden"
        onChange={handleFontUpload}
      />
    </div>
  );
}
