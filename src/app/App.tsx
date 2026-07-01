import { useState, useRef, useEffect, useCallback } from "react";
import getStroke from "perfect-freehand";
import { ChevronLeft, ChevronRight, Undo2, Trash2, AlignLeft, Settings, Pencil, Hand } from "lucide-react";
import { toast } from "sonner";

// Types
import type { BrushType, Stroke, StyleGlyphs, PFOptions } from "@/types";
import type { FontFormat } from "@/services/fontGenerator";

// Constants
import {
  CANVAS_WIDTH as CW,
  CANVAS_HEIGHT as CH,
  CAP_Y,
  DESC_Y,
} from "@/constants";
import { ALL_CHARS, FONT_STYLES, ACCENT_BASE_MAP } from "@/constants";

// Services
import {
  LazyBrush,
  fullRedraw,
  downloadFont,
  downloadAllStyles,
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
import { LandingPage } from "./components/LandingPage";
import { AboutPage } from "./components/AboutPage";
import { StyleCircle } from "./components/common/StyleCircle";
import { LeftPanel } from "./components/Panels/LeftPanel";
import { RightPanel } from "./components/Panels/RightPanel";
import { DrawingCanvas } from "./components/Canvas/DrawingCanvas";
import { LoveLetterPreview } from "./components/Canvas/LoveLetterPreview";
import { DownloadDialog } from "./components/common/DownloadDialog";
import { ShareNoteDialog } from "./components/common/ShareNoteDialog";
import { CommunityPage } from "./components/CommunityPage";
import { Toaster } from "./components/ui/sonner";

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

  // Theme hue
  const [themeHue, setThemeHue] = useState(48);
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-hue", String(themeHue));
  }, [themeHue]);

  // App view
  const [appView, setAppView] = useState<"studio" | "about" | "community">("studio");

  // Draw mode — on touch devices, off by default so scroll works
  const [drawMode, setDrawMode] = useState(false);

  // Download dialog state
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadDialogMode, setDownloadDialogMode] = useState<"single" | "all">("single");
  const [isDownloading, setIsDownloading] = useState(false);

  // Share note dialog state
  const [shareNoteOpen, setShareNoteOpen] = useState(false);

  const currentStrokes = glyphs[canvasState.activeStyle][canvasState.currentChar] ?? [];
  const accentBaseChar = ACCENT_BASE_MAP[canvasState.currentChar];
  const baseStrokes = accentBaseChar
    ? (glyphs[canvasState.activeStyle][accentBaseChar] ?? [])
    : [];
  const drawnCount = Object.values(glyphs[canvasState.activeStyle]).filter((s) => s.length > 0).length;
  const totalDrawnCount = Object.values(glyphs).reduce(
    (sum, styleGlyphs) => sum + Object.values(styleGlyphs).filter((s) => s.length > 0).length,
    0
  );
  const activeStyleLabel = FONT_STYLES.find((s) => s.key === canvasState.activeStyle)?.label ?? "";
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

  const handleDownloadFont = useCallback(() => {
    setDownloadDialogMode("single");
    setDownloadDialogOpen(true);
  }, []);

  const handleDownloadAllStyles = useCallback(() => {
    setDownloadDialogMode("all");
    setDownloadDialogOpen(true);
  }, []);

  const handleConfirmDownload = useCallback(
    async (name: string, format: FontFormat) => {
      setIsDownloading(true);
      try {
        const result =
          downloadDialogMode === "all"
            ? await downloadAllStyles(
                glyphs,
                name,
                previewState.letterSpacing,
                canvasState.scriptMode,
                format,
              )
            : await downloadFont(
                glyphs,
                canvasState.activeStyle,
                name,
                previewState.letterSpacing,
                canvasState.scriptMode,
                format,
              );

        if (!result.ok) {
          toast.error(result.error ?? "Download failed");
        } else {
          setDownloadDialogOpen(false);
          setShareNoteOpen(true);
          canvasState.setFontName(name);
          if (result.warnings.length > 0) {
            toast.warning("Font downloaded with warnings", {
              description: result.warnings.slice(0, 3).join("\n"),
              duration: 6000,
            });
          } else {
            toast.success("Font downloaded successfully!");
          }
        }
      } catch (err) {
        toast.error(
          `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
        );
      } finally {
        setIsDownloading(false);
      }
    },
    [
      downloadDialogMode,
      glyphs,
      previewState.letterSpacing,
      canvasState,
    ],
  );

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const c = committedRef.current;
    const isItalic = canvasState.activeStyle === "italic" || canvasState.activeStyle === "bold-italic";
    const grainCanvas = getOrCreateGrainCanvas();
    // Refresh theme once per redraw cycle (not on every pointer event)
    canvasThemeRef.current = getCanvasTheme();
    if (c) {
      // Suppress the system-font template when the ghost layer is active —
      // the drawn base char is a better reference and they'd overlap confusingly.
      const showTemplate = canvasState.showTemplate && !(accentBaseChar && baseStrokes.length > 0);
      fullRedraw(
        c,
        currentStrokes,
        canvasState.currentChar,
        canvasState.showGuides,
        showTemplate,
        brushSettings.grain,
        grainCanvas,
        canvasThemeRef.current,
        canvasState.templateFont,
        isItalic,
        canvasState.scriptMode,
        previewState.letterSpacing,
        canvasState.connectAnchorY,
        baseStrokes.length ? baseStrokes : undefined,
      );
    }
  }, [
    currentStrokes,
    baseStrokes,
    canvasState.currentChar,
    accentBaseChar,
    canvasState.showGuides,
    canvasState.showTemplate,
    brushSettings.grain,
    canvasState.templateFont,
    canvasState.activeStyle,
    canvasState.scriptMode,
    previewState.letterSpacing,
    canvasState.connectAnchorY,
    themeHue,
  ]);

  useEffect(() => {
    const ctx = activeRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, CW, CH);
  }, [canvasState.currentChar]);


  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <Header
        view={appView}
        onAbout={() => setAppView("about")}
        onBack={() => setAppView("studio")}
        onCommunity={() => setAppView("community")}
        onDownload={handleDownloadFont}
        onDownloadAll={handleDownloadAllStyles}
        drawnCount={drawnCount}
        totalDrawnCount={totalDrawnCount}
        activeStyleLabel={activeStyleLabel}
      />

      {/* Spacer so content clears the fixed header */}
      <div style={{ height: "var(--header-height, 53px)" }} />

      {appView === "about" && <AboutPage />}

      {appView === "community" && <CommunityPage />}

      {/* Landing content sits above the studio in one scroll */}
      {appView === "studio" && <LandingPage onEnterStudio={() => {}} hideCta />}

      {/* Studio */}
      <div className={["flex min-h-screen relative", appView !== "studio" ? "hidden" : ""].join(" ")}>
          {/* Floating panel triggers — sit just below the header */}
          <button
            onClick={layoutState.toggleLeft}
            className="btn btn-icon-md btn-ghost fixed left-3 z-40"
            style={{ top: "calc(var(--header-height, 53px) + 10px)" }}
            title="Characters"
            aria-label="Toggle character panel"
          >
            <AlignLeft size={15} />
          </button>
          <button
            onClick={layoutState.toggleRight}
            className="btn btn-icon-md btn-ghost fixed right-3 z-40"
            style={{ top: "calc(var(--header-height, 53px) + 10px)" }}
            title="Brush settings"
            aria-label="Toggle brush settings"
          >
            <Settings size={15} />
          </button>


          {/* Backdrop — touch devices: tapping outside closes panels.
              On desktop (pointer:fine) it's invisible + non-interactive via CSS. */}
          {(layoutState.leftOpen || layoutState.rightOpen) && (
            <div
              className="fixed inset-0 z-40 bg-black/10 [@media(pointer:fine)]:pointer-events-none [@media(pointer:fine)]:bg-transparent"
              style={{ top: "var(--header-height, 53px)" }}
              onClick={layoutState.closeAll}
            />
          )}

          <LeftPanel
            isOpen={layoutState.leftOpen}
            onClose={() => layoutState.setLeftOpen(false)}
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

                  return (
                    <button
                      key={key}
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

              {/* Accent mode indicator */}
              {accentBaseChar && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px]">
                  <span className={baseStrokes.length === 0 ? "text-destructive" : ""}>
                    {baseStrokes.length > 0 ? "Draw accent mark only" : `Draw base '${accentBaseChar}' first`}
                  </span>
                </div>
              )}

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
                drawMode={drawMode}
              />

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Draw mode toggle — only visible on touch devices */}
                <button
                  onClick={() => setDrawMode(v => !v)}
                  className={[
                    "btn btn-sm gap-1.5 [@media(pointer:fine)]:hidden",
                    drawMode ? "btn-neu-accent" : "btn-ghost",
                  ].join(" ")}
                  title={drawMode ? "Switch to scroll mode" : "Switch to draw mode"}
                >
                  {drawMode ? <Pencil size={12} /> : <Hand size={12} />}
                  {drawMode ? "Drawing" : "Scroll"}
                </button>

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
            <div className="flex-shrink-0 w-full max-w-2xl mx-auto px-4 mb-4 space-y-8">

              {/* Editable fields — sit above the card */}
              <div className="note-inputs" style={{ marginBottom: '120px' }}>
                <div className="note-input-row">
                  <div className="note-input-group">
                    <span className="note-input-label">To</span>
                    <input
                      type="text"
                      value={previewState.toField}
                      onChange={(e) => previewState.setToField(e.target.value)}
                      className="note-input-field"
                      placeholder="Myself"
                    />
                  </div>
                  <div className="note-input-group">
                    <span className="note-input-label">Date</span>
                    <input
                      type="text"
                      value={previewState.dateField}
                      onChange={(e) => previewState.setDateField(e.target.value)}
                      className="note-input-field"
                      placeholder="Today"
                    />
                  </div>
                </div>
                <div className="note-input-group">
                  <span className="note-input-label">Message</span>
                  <textarea
                    value={previewState.previewText}
                    onChange={(e) => previewState.setPreviewText(e.target.value)}
                    rows={2}
                    className="textarea-field"
                    placeholder="Write something to preview your font…"
                  />
                </div>
              </div>

              {/* The letter card */}
              <LoveLetterPreview
                toName={previewState.toField}
                dateText={previewState.dateField}
                bodyText={previewState.previewText}
                glyphs={glyphs[canvasState.activeStyle]}
                previewSize={previewState.previewSize}
                letterSpacing={previewState.letterSpacing}
                lineHeight={previewState.lineHeight}
                scriptMode={canvasState.scriptMode}
              />

              {drawnCount === 0 && (
                <p className="text-xs text-muted-foreground text-center italic">
                  Draw some characters above — they will appear in your font.
                </p>
              )}
            </div>
          </main>

          <RightPanel
            isOpen={layoutState.rightOpen}
            onClose={() => layoutState.setRightOpen(false)}
            brushSettings={brushSettings.settings}
            brushActions={brushSettings.actions}
            scriptMode={canvasState.scriptMode}
            onScriptModeChange={canvasState.setScriptMode}
            previewSize={previewState.previewSize}
            onPreviewSizeChange={previewState.setPreviewSize}
            letterSpacing={previewState.letterSpacing}
            onLetterSpacingChange={previewState.setLetterSpacing}
            lineHeight={previewState.lineHeight}
            onLineHeightChange={previewState.setLineHeight}
            themeHue={themeHue}
            onThemeHueChange={setThemeHue}
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

      <ShareNoteDialog
        open={shareNoteOpen}
        onOpenChange={setShareNoteOpen}
        glyphs={glyphs[canvasState.activeStyle]}
        previewSize={previewState.previewSize}
        letterSpacing={previewState.letterSpacing}
        lineHeight={previewState.lineHeight}
        scriptMode={canvasState.scriptMode}
        defaultMessage={previewState.previewText}
        onShared={() => setAppView("community")}
      />

      <DownloadDialog
        open={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
        initialFontName={canvasState.fontName}
        mode={downloadDialogMode}
        styleLabel={
          FONT_STYLES.find((s) => s.key === canvasState.activeStyle)?.label ?? ""
        }
        onDownload={handleConfirmDownload}
        isDownloading={isDownloading}
      />

      <Toaster richColors position="bottom-right" />
    </div>
  );
}
