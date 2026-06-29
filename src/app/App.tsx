import { useState, useRef, useEffect, useCallback } from "react";
import getStroke from "perfect-freehand";
import { ChevronLeft, ChevronRight, Undo2, Trash2, Type, ChevronUp, ChevronDown, Minus, Plus } from "lucide-react";

// Types
import type { BrushType, Stroke, StyleGlyphs, PFOptions } from "@/types";

// Constants
import {
  CANVAS_WIDTH as CW,
  CANVAS_HEIGHT as CH,
} from "@/constants";
import { ALL_CHARS, PHRASES, FONT_STYLES } from "@/constants";

// Services
import {
  LazyBrush,
  fullRedraw,
  renderPreview,
  downloadFont,
  downloadAllStyles,
  autoGenerateBold,
  autoGenerateItalic,
  autoGenerateBoldItalic,
  getOrCreateGrainCanvas,
} from "@/services";
import { buildBrushOptions } from "@/utils";

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
  const previewRef = useRef<HTMLCanvasElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const lazy = useRef(new LazyBrush());
  const isDrawing = useRef(false);
  const currentPoints = useRef<[number, number, number][]>([]);
  const currentOpts = useRef<PFOptions | null>(null);
  const currentOpacRef = useRef(1);
  const currentBrushTR = useRef<BrushType>("round");
  const canvasDisplayScale = useRef(1);

  // Glyph state
  const [glyphs, setGlyphs] = useState<StyleGlyphs>(EMPTY_STYLE_GLYPHS);
  const glyphState = useGlyphState(setGlyphs, "regular");

  // Brush settings
  const brushSettings = useBrushSettings();

  // Preview state
  const previewState = usePreviewState();

  // Canvas state
  const canvasState = useCanvasState();

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
    [brushSettings]
  );

  const renderActiveStroke = useCallback(() => {
    const canvas = activeRef.current;
    if (!canvas || !currentOpts.current) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CW, CH);
    const pts = currentPoints.current;
    if (pts.length < 2) return;
    const outline = getStroke(pts, currentOpts.current);
    if (outline.length < 4) return;

    const path = new Path2D(
      outline
        .map(([x0, y0], i) => {
          const [x1, y1] = outline[(i + 1) % outline.length];
          return `${i === 0 ? "M" : "Q"} ${x0} ${y0} ${(x0 + x1) / 2} ${(y0 + y1) / 2}`;
        })
        .join(" ") + " Z"
    );

    ctx.save();
    ctx.globalAlpha = currentOpacRef.current;
    ctx.fillStyle =
      currentBrushTR.current === "ballpoint" ? "#1a1835" : "#1c1409";
    ctx.fill(path);
    ctx.restore();
  }, []);

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
        const moved = lazy.current.update(px, py, brushSettings.stabilizer);

        lazyDot.setDotPos({
          x: lazy.current.x / sx,
          y: lazy.current.y / sy,
        });
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
    [brushSettings.stabilizer, lazyDot, renderActiveStroke]
  );

  const onPointerUp = useCallback(() => {
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
    await downloadFont(glyphs, canvasState.activeStyle, canvasState.fontName, previewState.letterSpacing);
  }, [glyphs, canvasState.activeStyle, canvasState.fontName, previewState.letterSpacing]);

  const handleDownloadAllStyles = useCallback(async () => {
    await downloadAllStyles(glyphs, canvasState.fontName, previewState.letterSpacing);
  }, [glyphs, canvasState.fontName, previewState.letterSpacing]);

  // ── Effects ──────────────────────────────────────────────────────────────

  // Redraw committed canvas
  useEffect(() => {
    const c = committedRef.current;
    const isItalic = canvasState.activeStyle === "italic" || canvasState.activeStyle === "bold-italic";
    const grainCanvas = getOrCreateGrainCanvas();
    if (c) {
      fullRedraw(
        c,
        currentStrokes,
        canvasState.currentChar,
        canvasState.showGuides,
        canvasState.showTemplate,
        brushSettings.grain,
        grainCanvas,
        canvasState.templateFont,
        isItalic
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
  ]);

  // Clear active canvas on char change
  useEffect(() => {
    const ctx = activeRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, CW, CH);
  }, [canvasState.currentChar]);

  // Redraw preview canvas
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !previewState.showPreview) return;
    renderPreview(
      canvas,
      previewState.previewText,
      glyphs[canvasState.activeStyle],
      previewState.previewSize,
      previewState.letterSpacing
    );
  }, [
    glyphs,
    canvasState.activeStyle,
    previewState.previewText,
    previewState.previewSize,
    previewState.letterSpacing,
    previewState.showPreview,
  ]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
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
        onLeftPanelToggle={() => layoutState.setLeftOpen((v) => !v)}
        onRightPanelToggle={() => layoutState.setRightOpen((v) => !v)}
        fontInputRef={fontInputRef}
      />

      <div className="flex flex-1 min-h-0">
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
                const count = Object.values(glyphs[key]).filter(
                  (s) => s.length > 0
                ).length;
                const isActive = key === canvasState.activeStyle;
                const canAutoGenerate =
                  key !== "regular" && regularDrawnCount > 0 && count === 0;

                return (
                  <div
                    key={key}
                    className="flex items-center rounded border border-border overflow-hidden"
                  >
                    <button
                      onClick={() => canvasState.setActiveStyle(key)}
                      className={[
                        "flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground hover:bg-secondary",
                      ].join(" ")}
                      style={{
                        fontStyle: key.includes("italic") ? "italic" : "normal",
                        fontWeight: key.includes("bold") ? 700 : 400,
                      }}
                    >
                      <span>{label}</span>
                      {count > 0 && (
                        <span
                          className={[
                            "text-[10px] rounded px-1",
                            isActive
                              ? "bg-white/20"
                              : "bg-accent/20 text-accent",
                          ].join(" ")}
                        >
                          {count}
                        </span>
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
                        className="text-[10px] px-1.5 py-1.5 border-l border-border text-accent hover:bg-secondary transition-all"
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
              <button
                onClick={() => navigateChar(-1)}
                className="w-8 h-8 flex items-center justify-center rounded border border-border hover:bg-secondary transition-all"
              >
                <ChevronLeft size={15} />
              </button>
              <div className="text-center w-16">
                <span
                  className="text-5xl font-medium leading-none"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {canvasState.currentChar}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {currentStrokes.length} stroke
                  {currentStrokes.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => navigateChar(1)}
                className="w-8 h-8 flex items-center justify-center rounded border border-border hover:bg-secondary transition-all"
              >
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
            />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={undoStroke}
                disabled={currentStrokes.length === 0}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Undo2 size={12} /> Undo
              </button>
              <button
                onClick={clearGlyph}
                disabled={currentStrokes.length === 0}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Trash2 size={12} /> Clear
              </button>
            </div>
          </div>

          {/* Preview section */}
          <div className="flex-shrink-0 mx-4 mb-4 rounded border border-border overflow-hidden">
            {/* Preview header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
              <button
                onClick={() => previewState.setShowPreview((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
              >
                <Type size={13} className="text-accent" />
                Text Preview
                {previewState.showPreview ? (
                  <ChevronUp size={13} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={13} className="text-muted-foreground" />
                )}
              </button>
              {previewState.showPreview && (
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {/* Font size */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:inline">
                      Size
                    </span>
                    <button
                      onClick={() =>
                        previewState.setPreviewSize((v) => Math.max(16, v - 4))
                      }
                      className="w-5 h-5 flex items-center justify-center rounded border border-border hover:bg-secondary text-muted-foreground"
                    >
                      <Minus size={9} />
                    </button>
                    <span
                      className="text-xs w-8 text-center"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {previewState.previewSize}px
                    </span>
                    <button
                      onClick={() =>
                        previewState.setPreviewSize((v) => Math.min(96, v + 4))
                      }
                      className="w-5 h-5 flex items-center justify-center rounded border border-border hover:bg-secondary text-muted-foreground"
                    >
                      <Plus size={9} />
                    </button>
                  </div>

                  {/* Letter spacing */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:inline">
                      Spacing
                    </span>
                    <button
                      onClick={() =>
                        previewState.setLetterSpacing((v) =>
                          Math.max(-100, v - 10)
                        )
                      }
                      className="w-5 h-5 flex items-center justify-center rounded border border-border hover:bg-secondary text-muted-foreground"
                    >
                      <Minus size={9} />
                    </button>
                    <input
                      type="range"
                      min={-100}
                      max={300}
                      step={10}
                      value={previewState.letterSpacing}
                      onChange={(e) =>
                        previewState.setLetterSpacing(+e.target.value)
                      }
                      className="w-16 sm:w-20 h-1 accent-[#c4782a]"
                    />
                    <button
                      onClick={() =>
                        previewState.setLetterSpacing((v) =>
                          Math.min(300, v + 10)
                        )
                      }
                      className="w-5 h-5 flex items-center justify-center rounded border border-border hover:bg-secondary text-muted-foreground"
                    >
                      <Plus size={9} />
                    </button>
                    <span
                      className="text-xs w-10 text-center"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {previewState.letterSpacing > 0
                        ? `+${previewState.letterSpacing}`
                        : previewState.letterSpacing}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {previewState.showPreview && (
              <div className="bg-card p-4 space-y-3">
                {/* Phrase presets */}
                <div className="flex flex-wrap gap-1.5">
                  {PHRASES.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => previewState.setPreviewText(p.text)}
                      className={[
                        "text-xs px-2.5 py-1 rounded transition-all",
                        previewState.previewText === p.text
                          ? "bg-accent text-white"
                          : "bg-secondary text-secondary-foreground hover:bg-muted",
                      ].join(" ")}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom text input */}
                <textarea
                  value={previewState.previewText}
                  onChange={(e) => previewState.setPreviewText(e.target.value)}
                  rows={2}
                  className="w-full text-sm bg-background border border-border rounded px-3 py-2 outline-none focus:border-accent resize-none text-foreground placeholder:text-muted-foreground transition-colors"
                  placeholder="Type anything to preview your font…"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                />

                {/* Preview canvas */}
                <PreviewCanvas previewRef={previewRef} />

                {drawnCount === 0 && (
                  <p className="text-xs text-muted-foreground text-center italic">
                    Draw some characters above — they will appear here in your
                    font.
                  </p>
                )}
              </div>
            )}
          </div>
        </main>

        <RightPanel
          isOpen={layoutState.rightOpen}
          brushType={brushSettings.brushType}
          onBrushTypeChange={brushSettings.setBrushType}
          brushSize={brushSettings.brushSize}
          onBrushSizeChange={brushSettings.setBrushSize}
          onBrushSizeMinus={() =>
            brushSettings.setBrushSize((v) => Math.max(4, v - 2))
          }
          onBrushSizePlus={() =>
            brushSettings.setBrushSize((v) => Math.min(48, v + 2))
          }
          opacity={brushSettings.opacity}
          onOpacityChange={brushSettings.setOpacity}
          onOpacityMinus={() =>
            brushSettings.setOpacity((v) =>
              Math.max(0.2, +(v - 0.05).toFixed(2))
            )
          }
          onOpacityPlus={() =>
            brushSettings.setOpacity((v) =>
              Math.min(1, +(v + 0.05).toFixed(2))
            )
          }
          stabilizer={brushSettings.stabilizer}
          onStabilizerChange={brushSettings.setStabilizer}
          onStabilizerMinus={() =>
            brushSettings.setStabilizer((v) => Math.max(0, v - 1))
          }
          onStabilizerPlus={() =>
            brushSettings.setStabilizer((v) => Math.min(30, v + 1))
          }
          smoothing={brushSettings.smoothing}
          onSmoothingChange={brushSettings.setSmoothing}
          streamline={brushSettings.streamline}
          onStreamlineChange={brushSettings.setStreamline}
          thinning={brushSettings.thinning}
          onThinningChange={brushSettings.setThinning}
          taper={brushSettings.taper}
          onTaperChange={brushSettings.setTaper}
          grain={brushSettings.grain}
          onGrainChange={brushSettings.setGrain}
          glyphs={glyphs}
          activeStyle={canvasState.activeStyle}
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
