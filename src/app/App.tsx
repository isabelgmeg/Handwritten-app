import { useState, useRef, useEffect, useCallback } from "react";
import getStroke from "perfect-freehand";
import {
  Download, Trash2, Undo2, ChevronLeft, ChevronRight,
  Eye, EyeOff, Minus, Plus, Pencil, Type, ChevronDown, ChevronUp,
  PanelLeft, PanelRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type BrushType = "round" | "inkpen" | "calligraphy" | "ballpoint" | "brushpen" | "marker" | "chisel";
type FontStyle = "regular" | "bold" | "italic" | "bold-italic";
type GlyphMap  = Record<string, Stroke[]>;
type StyleGlyphs = Record<FontStyle, GlyphMap>;

const FONT_STYLES: { key: FontStyle; label: string; short: string }[] = [
  { key: "regular",     label: "Regular",     short: "R" },
  { key: "bold",        label: "Bold",         short: "B" },
  { key: "italic",      label: "Italic",       short: "I" },
  { key: "bold-italic", label: "Bold Italic",  short: "BI" },
];

const ITALIC_SHEAR = Math.tan(12 * Math.PI / 180);

function applyItalicToPoints(pts: [number, number, number][]): [number, number, number][] {
  return pts.map(([x, y, p]) => [x + (BASELINE_Y - y) * ITALIC_SHEAR, y, p] as [number, number, number]);
}

const EMPTY_STYLE_GLYPHS: StyleGlyphs = { regular: {}, bold: {}, italic: {}, "bold-italic": {} };

type PFOptions = {
  size: number;
  thinning: number;
  smoothing: number;
  streamline: number;
  simulatePressure: boolean;
  start: { cap: boolean; taper: number };
  end: { cap: boolean; taper: number };
};

type Stroke = {
  points: [number, number, number][];
  options: PFOptions;
  brushType: BrushType;
  opacity: number;
};

// ── Character Sets ─────────────────────────────────────────────────────────────

const CHAR_GROUPS = [
  { label: "Uppercase", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("") },
  { label: "Lowercase", chars: "abcdefghijklmnopqrstuvwxyz".split("") },
  { label: "Accented",  chars: "áéíóúüñÁÉÍÓÚÜÑ".split("") },
  { label: "Numbers",   chars: "0123456789".split("") },
  { label: "Symbols",   chars: ".,!?¡¿:;'\"-–—…()[]/@#€&*+=«»°×".split("") },
];

const ALL_CHARS = CHAR_GROUPS.flatMap(g => g.chars);

// ── Test Phrases ───────────────────────────────────────────────────────────────

const PHRASES = [
  { label: "Quick Fox",   text: "the quick brown fox jumps over the lazy dog" },
  { label: "Pack My Box", text: "Pack my box with five dozen liquor jugs" },
  { label: "Handwriting", text: "How vexingly quick daft zebras jump" },
  { label: "Numerals",    text: "0 1 2 3 4 5 6 7 8 9 & @ ! ? % #" },
  { label: "Alphabet",    text: "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z" },
];

// ── Canvas / Font Metrics ─────────────────────────────────────────────────────

const CW = 420;
const CH = 480;
const BASELINE_Y = CH * 0.74;   // 355.2
const CAP_Y      = CH * 0.19;   //  91.2
const XHEIGHT_Y  = CH * 0.44;   // 211.2
const DESC_Y     = CH * 0.88;   // 422.4

const UPM       = 1000;
const ASCENDER  = 800;
const DESCENDER = -200;

const CAP_TO_BASE = BASELINE_Y - CAP_Y; // ~264 — used as reference height for scaling

function canvasToFont(x: number, y: number): [number, number] {
  return [
    (x / CW) * UPM,
    ASCENDER - (y / CH) * (ASCENDER - DESCENDER),
  ];
}

// ── perfect-freehand → SVG path string ───────────────────────────────────────

function svgPathFromStroke(pts: number[][]): string {
  if (pts.length < 4) return "";
  const d: (string | number)[] = ["M", pts[0][0], pts[0][1], "Q"];
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  d.push("Z");
  return d.join(" ");
}

// ── Brush options ─────────────────────────────────────────────────────────────

// Chisel: remap pressure at each point based on stroke angle vs nib angle.
// Horizontal strokes = full width, vertical strokes = razor thin.
function getEffectivePoints(stroke: Stroke): [number, number, number][] {
  if (stroke.brushType !== "chisel") return stroke.points;
  const pts = stroke.points;
  return pts.map(([x, y, p], i) => {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const angle = Math.atan2(dy, dx);
    // Nib at 0° (horizontal): cos(angle) = 1 → thick, sin → thin
    const nibPressure = Math.pow(Math.abs(Math.cos(angle)), 1.8);
    return [x, y, p * (0.06 + nibPressure * 0.94)] as [number, number, number];
  });
}

function buildOptions(
  brushType: BrushType,
  size: number,
  thinning: number,
  smoothing: number,
  streamline: number,
  taper: number,
): PFOptions {
  const base: PFOptions = {
    size, thinning, smoothing, streamline, simulatePressure: true,
    start: { cap: true, taper: 0 },
    end:   { cap: true, taper: 0 },
  };
  if (brushType === "inkpen")    return { ...base, start: { cap: false, taper }, end: { cap: false, taper } };
  if (brushType === "calligraphy") return { ...base, thinning: Math.min(1, thinning * 1.3), start: { cap: false, taper: taper * 0.5 }, end: { cap: false, taper: taper } };
  if (brushType === "ballpoint") return { ...base, thinning: Math.min(0.2, thinning * 0.25), smoothing: Math.max(smoothing, 0.5), streamline: Math.max(streamline, 0.6) };
  // Brush pen: large taper, high thinning — think Japanese 毛筆
  if (brushType === "brushpen")  return { ...base, size: size * 1.3, thinning: Math.min(1, thinning * 1.6), smoothing: Math.max(0.5, smoothing), start: { cap: false, taper: Math.max(taper, 20) }, end: { cap: false, taper: Math.max(taper * 1.5, 50) } };
  // Marker: very consistent width, blunt ends, slight size boost
  if (brushType === "marker")    return { ...base, size: size * 1.1, thinning: Math.min(0.25, thinning * 0.35), smoothing: Math.max(0.4, smoothing), streamline: Math.max(0.45, streamline) };
  // Chisel: high thinning fed to perfect-freehand; effective points pre-processed by getEffectivePoints
  if (brushType === "chisel")    return { ...base, thinning: 0.99, smoothing: Math.max(0.5, smoothing), streamline: Math.max(0.4, streamline), start: { cap: false, taper: 0 }, end: { cap: false, taper: 0 } };
  return base;
}

// ── Lazy Brush ────────────────────────────────────────────────────────────────

class LazyBrush {
  x = 0; y = 0; px = 0; py = 0;
  update(px: number, py: number, radius: number): boolean {
    this.px = px; this.py = py;
    if (radius <= 0) { this.x = px; this.y = py; return true; }
    const dx = px - this.x, dy = py - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) {
      const a = Math.atan2(dy, dx);
      this.x = px - Math.cos(a) * radius;
      this.y = py - Math.sin(a) * radius;
      return true;
    }
    return false;
  }
}

// ── Grain texture (generated once, deterministic) ────────────────────────────

const GRAIN_CANVAS: HTMLCanvasElement = (() => {
  const SIZE = 256;
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(SIZE, SIZE);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const idx = i / 4;
    const x = idx % SIZE, y = Math.floor(idx / SIZE);
    // Deterministic value noise — no Math.random(), same result every render
    const n = Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
    const v = Math.floor(n * 255);
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = v; // alpha mirrors value — dense speckle pattern
  }
  ctx.putImageData(img, 0, 0);
  return c;
})();

// ── Canvas draw helpers ───────────────────────────────────────────────────────

function applyGrain(ctx: CanvasRenderingContext2D, path: Path2D, grain: number, opacity: number) {
  if (grain <= 0) return;
  const pattern = ctx.createPattern(GRAIN_CANVAS, "repeat");
  if (!pattern) return;
  ctx.save();
  ctx.clip(path);
  // "screen" blend lightens — simulates ink breaking up on paper tooth
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = opacity * (grain / 100) * 0.55;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, grain = 0) {
  const pts = getEffectivePoints(stroke);
  const outline = getStroke(pts, stroke.options);
  if (outline.length < 4) return;
  const path = new Path2D(svgPathFromStroke(outline));

  ctx.save();
  ctx.globalAlpha = stroke.opacity;

  if (stroke.brushType === "ballpoint") {
    ctx.fillStyle = "#1a1835";
    ctx.fill(path);
    ctx.globalAlpha = stroke.opacity * 0.18;
    ctx.fillStyle = "#4a4aaa";
    ctx.fill(path);

  } else if (stroke.brushType === "brushpen") {
    // Deep black base
    ctx.fillStyle = "#080808";
    ctx.fill(path);
    // Bristle fringe: clipped to main path so it never bleeds outside.
    // Screen blend lightens the interior — simulates ink-thin bristle separations.
    const fringeOutline = getStroke(
      pts.map(([x, y, p]) => [x, y, p * 0.35] as [number, number, number]),
      { ...stroke.options, size: stroke.options.size * 1.55 }
    );
    if (fringeOutline.length >= 4) {
      ctx.save();
      ctx.clip(path);                              // constrain to stroke boundary
      ctx.globalCompositeOperation = "screen";     // lighten inside only
      ctx.globalAlpha = stroke.opacity * 0.18;
      ctx.fillStyle = "#555555";
      ctx.fill(new Path2D(svgPathFromStroke(fringeOutline)));
      ctx.restore();
    }

  } else if (stroke.brushType === "marker") {
    // Multiply blend gives overlapping strokes a darker, ink-like buildup
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = stroke.opacity * 0.72;
    ctx.fillStyle = "#1c1409";
    ctx.fill(path);
    // Edge bleed: slightly larger outline at very low opacity
    const bleedOutline = getStroke(pts, { ...stroke.options, size: stroke.options.size * 1.07 });
    if (bleedOutline.length >= 4) {
      ctx.globalAlpha = stroke.opacity * 0.14;
      ctx.fill(new Path2D(svgPathFromStroke(bleedOutline)));
    }

  } else if (stroke.brushType === "chisel") {
    ctx.fillStyle = "#1c1409";
    ctx.fill(path);

  } else {
    ctx.fillStyle = "#1c1409";
    ctx.fill(path);
  }

  ctx.globalAlpha = stroke.opacity;
  applyGrain(ctx, path, grain, stroke.opacity);
  ctx.restore();
}

function drawGuides(ctx: CanvasRenderingContext2D) {
  const line = (y: number, color: string, dash: number[] = []) => {
    ctx.save(); ctx.beginPath(); ctx.setLineDash(dash);
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); ctx.restore();
  };
  line(CAP_Y,      "rgba(196,120,42,0.38)", [5, 5]);
  line(XHEIGHT_Y,  "rgba(196,120,42,0.25)", [3, 5]);
  line(BASELINE_Y, "rgba(196,120,42,0.58)", []);
  line(DESC_Y,     "rgba(196,120,42,0.20)", [3, 5]);
  ctx.save(); ctx.beginPath(); ctx.strokeStyle = "rgba(196,120,42,0.16)"; ctx.lineWidth = 1;
  ctx.moveTo(34, 0); ctx.lineTo(34, CH); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.font = "9px 'DM Mono',monospace"; ctx.fillStyle = "rgba(196,120,42,0.5)";
  ctx.fillText("cap",  38, CAP_Y - 4);
  ctx.fillText("x",    38, XHEIGHT_Y - 4);
  ctx.fillText("base", 38, BASELINE_Y - 4);
  ctx.fillText("desc", 38, DESC_Y - 4);
  ctx.restore();
}

function drawTemplate(ctx: CanvasRenderingContext2D, char: string, templateFont?: string, italic = false) {
  ctx.save();
  const fontSize = (BASELINE_Y - CAP_Y) * (templateFont ? 1.0 : 1.4);
  const family = templateFont ? `'${templateFont}'` : "'Pinyon Script', 'Great Vibes', cursive";
  ctx.font = `${fontSize}px ${family}`;
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "center";
  ctx.fillStyle = "rgba(196,120,42,0.14)";
  if (italic) {
    // Shear the canvas to slant the template letter ~12°
    ctx.transform(1, 0, -Math.tan(12 * Math.PI / 180), 1, BASELINE_Y * Math.tan(12 * Math.PI / 180), 0);
  }
  ctx.fillText(char, CW / 2, BASELINE_Y);
  ctx.restore();
}

function fullRedraw(canvas: HTMLCanvasElement, strokes: Stroke[], char: string, showGuides: boolean, showTemplate: boolean, grain = 0, templateFont?: string, isItalic = false) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = "#faf6f0"; ctx.fillRect(0, 0, CW, CH);
  if (showGuides) drawGuides(ctx);
  if (showTemplate && char) drawTemplate(ctx, char, templateFont, isItalic);
  for (const s of strokes) drawStroke(ctx, s, grain);
}

// ── Preview renderer ──────────────────────────────────────────────────────────

function renderPreview(
  canvas: HTMLCanvasElement,
  text: string,
  glyphs: Record<string, Stroke[]>,
  fontSizePx: number,   // cap height in pixels
  letterSpacing: number, // advance width adjustment in font units (same value used at download)
) {
  const ctx = canvas.getContext("2d")!;
  const scale = fontSizePx / CAP_TO_BASE;
  // Convert font units → screen pixels: 1 FU = scale * CW / UPM screen px
  const fuToPx = scale * CW / UPM;
  // Base advance 520 FU + spacing adjustment; word space fixed at 320 FU
  const advanceW = (520 + letterSpacing) * fuToPx;
  const spaceW   = 320 * fuToPx;
  const lineH    = CH * scale * 1.15;
  const padX = 24, padTop = 24;

  // Measure total height (word wrap at canvas width)
  let x = padX, lines = 1;
  const chars = text.replace(/\n/g, " \n ").split("");
  for (const ch of chars) {
    if (ch === "\n") { x = padX; lines++; continue; }
    const w = ch === " " ? spaceW : advanceW;
    if (ch !== " " && x + w > canvas.width - padX) { x = padX; lines++; }
    x += w;
  }
  const totalH = padTop + lines * lineH + CH * scale * 0.3 + padTop;
  canvas.height = Math.max(80, totalH);

  // Background + ruled lines
  ctx.fillStyle = "#faf6f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle baseline rules
  for (let l = 0; l < lines + 1; l++) {
    const by = padTop + BASELINE_Y * scale + l * lineH;
    ctx.save();
    ctx.strokeStyle = "rgba(196,120,42,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padX - 8, by); ctx.lineTo(canvas.width - padX + 8, by);
    ctx.stroke();
    ctx.restore();
  }

  // Render glyphs
  x = padX;
  let lineIdx = 0;

  for (const ch of chars) {
    if (ch === "\n") { x = padX; lineIdx++; continue; }
    if (ch === " ") { x += spaceW; continue; }
    if (ch !== " " && x + advanceW > canvas.width - padX) { x = padX; lineIdx++; }

    const baselineY = padTop + BASELINE_Y * scale + lineIdx * lineH;
    const strokes = glyphs[ch];

    if (!strokes || strokes.length === 0) {
      // Placeholder — faint dashed box + character
      ctx.save();
      ctx.strokeStyle = "rgba(196,120,42,0.22)";
      ctx.lineWidth = 0.75;
      ctx.setLineDash([2, 3]);
      ctx.strokeRect(
        x + 2, baselineY - CAP_TO_BASE * scale,
        advanceW - 4, CAP_TO_BASE * scale,
      );
      ctx.font = `${fontSizePx * 0.7}px 'Georgia',serif`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(196,120,42,0.18)";
      ctx.fillText(ch, x + 4, baselineY);
      ctx.restore();
    } else {
      ctx.save();
      // Translate so (0, CAP_Y) in glyph space = (x, baselineY - fontSizePx) in preview
      ctx.translate(x, baselineY - BASELINE_Y * scale);
      ctx.scale(scale, scale);
      for (const stroke of strokes) {
        const outline = getStroke(getEffectivePoints(stroke), stroke.options);
        if (outline.length < 4) continue;
        ctx.save();
        ctx.globalAlpha = stroke.opacity;
        ctx.fillStyle = stroke.brushType === "ballpoint" ? "#1a1835" : "#1c1409";
        ctx.fill(new Path2D(svgPathFromStroke(outline)));
        if (stroke.brushType === "ballpoint") {
          ctx.globalAlpha = stroke.opacity * 0.15;
          ctx.fillStyle = "#4a4aaa";
          ctx.fill(new Path2D(svgPathFromStroke(outline)));
        }
        ctx.restore();
      }
      ctx.restore();
    }
    x += advanceW;
  }
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const committedRef   = useRef<HTMLCanvasElement>(null);
  const activeRef      = useRef<HTMLCanvasElement>(null);
  const previewRef     = useRef<HTMLCanvasElement>(null);
  const fontInputRef   = useRef<HTMLInputElement>(null);
  const lazy           = useRef(new LazyBrush());
  const isDrawing      = useRef(false);
  const currentPoints  = useRef<[number, number, number][]>([]);
  const currentOpts    = useRef<PFOptions | null>(null);
  const currentOpacRef = useRef(1);
  const currentBrushTR = useRef<BrushType>("round");
  // Tracks the CSS display scale of the canvas (rendered width / internal width)
  const canvasDisplayScale = useRef(1);

  // Drawing state
  const [glyphs, setGlyphs]       = useState<StyleGlyphs>(EMPTY_STYLE_GLYPHS);
  const [activeStyle, setActiveStyle] = useState<FontStyle>("regular");
  const [currentChar, setCurrentChar] = useState("A");
  const [brushType, setBrushType] = useState<BrushType>("round");
  const [brushSize, setBrushSize] = useState(20);
  const [thinning, setThinning]   = useState(0.6);
  const [smoothing, setSmoothing] = useState(0.5);
  const [streamline, setStreamline] = useState(0.5);
  const [stabilizer, setStabilizer] = useState(4);
  const [taper, setTaper]         = useState(0);
  const [opacity, setOpacity]     = useState(1);
  const [grain, setGrain]         = useState(0);
  const [showGuides, setShowGuides]       = useState(true);
  const [showTemplate, setShowTemplate]   = useState(true);
  const [templateFont, setTemplateFont]   = useState<string | undefined>(undefined);
  const [templateFontLabel, setTemplateFontLabel] = useState<string | undefined>(undefined);
  const [fontName, setFontName]   = useState("My Handwriting");

  // Sidebar open/closed — default open on large screens
  const [leftOpen, setLeftOpen]   = useState(() => window.innerWidth >= 1024);
  const [rightOpen, setRightOpen] = useState(() => window.innerWidth >= 1024);

  // Lazy indicator
  const [showDot, setShowDot]   = useState(false);
  const [dotPos, setDotPos]     = useState({ x: 0, y: 0 });

  // Preview
  const [previewText, setPreviewText] = useState("the quick brown fox jumps over the lazy dog");
  const [previewSize, setPreviewSize] = useState(40);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [showPreview, setShowPreview] = useState(true);

  const currentStrokes = glyphs[activeStyle][currentChar] ?? [];

  // Helper: update one style's glyph map
  const updateStyleGlyphs = useCallback((updater: (prev: GlyphMap) => GlyphMap) => {
    setGlyphs(prev => ({ ...prev, [activeStyle]: updater(prev[activeStyle]) }));
  }, [activeStyle]);

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
      setTemplateFont(name);
      setTemplateFontLabel(file.name.replace(/\.[^.]+$/, ""));
    } catch {
      alert("Could not load font file. Make sure it is a valid .otf or .ttf.");
    }
  }, []);

  // ── Committed canvas redraw ──────────────────────────────────────────────
  useEffect(() => {
    const c = committedRef.current;
    const isItalic = activeStyle === "italic" || activeStyle === "bold-italic";
    if (c) fullRedraw(c, currentStrokes, currentChar, showGuides, showTemplate, grain, templateFont, isItalic);
  }, [currentStrokes, currentChar, showGuides, showTemplate, grain, templateFont, activeStyle]);

  // Clear active canvas on char change
  useEffect(() => {
    const ctx = activeRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, CW, CH);
  }, [currentChar]);

  // ── Preview canvas redraw ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas || !showPreview) return;
    renderPreview(canvas, previewText, glyphs[activeStyle], previewSize, letterSpacing);
  }, [glyphs, activeStyle, previewText, previewSize, letterSpacing, showPreview]);

  // ── Pointer helpers ──────────────────────────────────────────────────────
  const renderActiveStroke = useCallback(() => {
    const canvas = activeRef.current;
    if (!canvas || !currentOpts.current) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CW, CH);
    const pts = currentPoints.current;
    if (pts.length < 2) return;
    const outline = getStroke(pts, currentOpts.current);
    if (outline.length < 4) return;
    const path = new Path2D(svgPathFromStroke(outline));
    ctx.save();
    ctx.globalAlpha = currentOpacRef.current;
    ctx.fillStyle = currentBrushTR.current === "ballpoint" ? "#1a1835" : "#1c1409";
    ctx.fill(path);
    ctx.globalAlpha = currentOpacRef.current;
    applyGrain(ctx, path, grain, currentOpacRef.current);
    ctx.restore();
  }, [grain]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = activeRef.current!.getBoundingClientRect();
    const sx = CW / rect.width, sy = CH / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
    lazy.current.x = x; lazy.current.y = y;
    currentOpts.current  = buildOptions(brushType, brushSize, thinning, smoothing, streamline, taper);
    currentOpacRef.current = opacity;
    currentBrushTR.current = brushType;
    currentPoints.current  = [[x, y, e.pressure > 0 ? e.pressure : 0.5]];
    isDrawing.current = true;
  }, [brushType, brushSize, thinning, smoothing, streamline, taper, opacity]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const evt of events) {
      const rect = activeRef.current!.getBoundingClientRect();
      const sx = CW / rect.width, sy = CH / rect.height;
      // Keep display scale in sync so the lazy-brush dot renders at correct CSS size
      canvasDisplayScale.current = rect.width / CW;
      const px = (evt.clientX - rect.left) * sx;
      const py = (evt.clientY - rect.top)  * sy;
      const pressure = evt.pressure > 0 ? evt.pressure : 0.5;
      const moved = lazy.current.update(px, py, stabilizer);
      setDotPos({ x: lazy.current.x / sx, y: lazy.current.y / sy });
      setShowDot(true);
      if (!isDrawing.current) continue;
      if (moved || stabilizer <= 0) {
        currentPoints.current = [...currentPoints.current, [lazy.current.x, lazy.current.y, pressure]];
        renderActiveStroke();
      }
    }
  }, [stabilizer, renderActiveStroke]);

  const onPointerUp = useCallback(() => {
    if (!isDrawing.current || currentPoints.current.length === 0) return;
    isDrawing.current = false;
    setShowDot(false);
    const newStroke: Stroke = {
      points: [...currentPoints.current],
      options: currentOpts.current!,
      brushType: currentBrushTR.current,
      opacity: currentOpacRef.current,
    };
    updateStyleGlyphs(sg => ({ ...sg, [currentChar]: [...(sg[currentChar] ?? []), newStroke] }));
    currentPoints.current = [];
    activeRef.current?.getContext("2d")?.clearRect(0, 0, CW, CH);
  }, [currentChar, updateStyleGlyphs]);

  const undoStroke = useCallback(() => {
    updateStyleGlyphs(sg => {
      const s = sg[currentChar] ?? [];
      return s.length === 0 ? sg : { ...sg, [currentChar]: s.slice(0, -1) };
    });
  }, [currentChar, updateStyleGlyphs]);

  const clearGlyph = useCallback(() => {
    updateStyleGlyphs(sg => ({ ...sg, [currentChar]: [] }));
  }, [currentChar, updateStyleGlyphs]);

  const autoGenerateBold = useCallback(() => {
    setGlyphs(prev => ({
      ...prev,
      bold: Object.fromEntries(
        Object.entries(prev.regular).map(([char, strokes]) => [
          char,
          strokes.map(s => ({ ...s, options: { ...s.options, size: s.options.size * 1.5 } })),
        ])
      ),
    }));
  }, []);

  const autoGenerateItalic = useCallback(() => {
    setGlyphs(prev => ({
      ...prev,
      italic: Object.fromEntries(
        Object.entries(prev.regular).map(([char, strokes]) => [
          char,
          strokes.map(s => ({ ...s, points: applyItalicToPoints(s.points) })),
        ])
      ),
    }));
  }, []);

  const autoGenerateBoldItalic = useCallback(() => {
    setGlyphs(prev => ({
      ...prev,
      "bold-italic": Object.fromEntries(
        Object.entries(prev.regular).map(([char, strokes]) => [
          char,
          strokes.map(s => ({
            ...s,
            options: { ...s.options, size: s.options.size * 1.5 },
            points: applyItalicToPoints(s.points),
          })),
        ])
      ),
    }));
  }, []);

  const navigateChar = useCallback((dir: 1 | -1) => {
    const idx = ALL_CHARS.indexOf(currentChar);
    setCurrentChar(ALL_CHARS[(idx + dir + ALL_CHARS.length) % ALL_CHARS.length]);
    currentPoints.current = [];
    isDrawing.current = false;
  }, [currentChar]);

  const downloadFont = useCallback(async (styleKey: FontStyle = activeStyle) => {
    const opentype = await import("opentype.js");
    const drawn = Object.entries(glyphs[styleKey]).filter(([, s]) => s.length > 0);
    if (!drawn.length) { alert(`No glyphs drawn for ${styleKey}. Draw some characters first.`); return; }
    const styleMeta = FONT_STYLES.find(s => s.key === styleKey)!;
    const isBold = styleKey.includes("bold");
    const GLYPH_NAMES: Record<string, string> = {
      // ASCII symbols
      ".":"period", ",":"comma", "!":"exclam", "?":"question", ":":"colon",
      ";":"semicolon", "'":"quotesingle", '"':"quotedbl", "-":"hyphen",
      "(":"parenleft", ")":"parenright", "[":"bracketleft", "]":"bracketright",
      "/":"slash", "@":"at", "#":"numbersign", "&":"ampersand",
      "*":"asterisk", "+":"plus", "=":"equal",
      // Spanish punctuation
      "¡":"exclamdown", "¿":"questiondown", "«":"guillemotleft", "»":"guillemotright",
      // Extended symbols
      "€":"Euro", "–":"endash", "—":"emdash", "…":"ellipsis",
      "°":"degree", "×":"multiply",
      // Accented lowercase
      "á":"aacute", "é":"eacute", "í":"iacute", "ó":"oacute", "ú":"uacute",
      "ü":"udieresis", "ñ":"ntilde",
      // Accented uppercase
      "Á":"Aacute", "É":"Eacute", "Í":"Iacute", "Ó":"Oacute", "Ú":"Uacute",
      "Ü":"Udieresis", "Ñ":"Ntilde",
    };
    const glyphAdvance = 520 + letterSpacing;
    const notdef = new opentype.Glyph({ name: ".notdef", unicode: 0, advanceWidth: glyphAdvance, path: new opentype.Path() });
    const space  = new opentype.Glyph({ name: "space",   unicode: 32, advanceWidth: 320, path: new opentype.Path() });
    const list = [notdef, space];
    for (const [char, strokes] of drawn) {
      const p = new opentype.Path();
      for (const stroke of strokes) {
        const outline = getStroke(getEffectivePoints(stroke), stroke.options);
        if (outline.length < 4) continue;
        const fp = outline.map(([x, y]: number[]) => canvasToFont(x, y));
        p.moveTo(fp[0][0], fp[0][1]);
        for (let i = 0; i < fp.length; i++) {
          const [x0, y0] = fp[i], [x1, y1] = fp[(i + 1) % fp.length];
          p.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        }
        p.close();
      }
      list.push(new opentype.Glyph({ name: GLYPH_NAMES[char] ?? char, unicode: char.charCodeAt(0), advanceWidth: glyphAdvance, path: p }));
    }
    const font = new opentype.Font({
      familyName: fontName || "My Handwriting",
      styleName: styleMeta.label,
      weightClass: (isBold ? 700 : 400) as unknown as string,
      unitsPerEm: UPM, ascender: ASCENDER, descender: DESCENDER,
      glyphs: list,
    });
    const baseName = (fontName || "MyHandwriting").replace(/\s+/g, "_");
    const fileName = `${baseName}-${styleMeta.label.replace(/\s+/g, "")}.otf`;
    const arrayBuffer = font.toArrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "font/otf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [glyphs, fontName, activeStyle, letterSpacing]);

  const downloadAllStyles = useCallback(async () => {
    for (const { key } of FONT_STYLES) {
      if (Object.values(glyphs[key]).some(s => s.length > 0)) {
        await downloadFont(key);
        await new Promise(r => setTimeout(r, 300)); // small gap between downloads
      }
    }
  }, [glyphs, downloadFont]);

  const drawnCount = Object.values(glyphs[activeStyle]).filter(s => s.length > 0).length;
  const regularDrawnCount = Object.values(glyphs.regular).filter(s => s.length > 0).length;

  // Lazy-brush dot radius in CSS pixels (accounts for canvas CSS scaling)
  const dotRadius = stabilizer * canvasDisplayScale.current;

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-card px-3 sm:px-5 py-2 flex items-center justify-between gap-2 flex-shrink-0 min-w-0">

        {/* Left group */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setLeftOpen(v => !v)}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded border border-border hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
            title="Toggle character panel"
          >
            <PanelLeft size={14} />
          </button>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Pencil size={14} className="text-accent" />
            <span className="text-base font-semibold tracking-tight hidden sm:inline" style={{ fontFamily: "'Playfair Display', serif" }}>Font Studio</span>
          </div>
          <span className="text-border text-lg select-none hidden sm:inline">|</span>
          <input
            value={fontName}
            onChange={e => setFontName(e.target.value)}
            className="bg-transparent text-sm text-muted-foreground outline-none border-b border-transparent hover:border-border focus:border-accent transition-colors px-0 py-0.5 min-w-0 w-28 sm:w-40 hidden sm:block"
            placeholder="Font name…"
          />
        </div>

        {/* Right group */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden lg:inline">{drawnCount}/{ALL_CHARS.length}</span>

          {/* Hidden font file input */}
          <input
            ref={fontInputRef}
            type="file"
            accept=".otf,.ttf,.woff,.woff2"
            className="hidden"
            onChange={handleFontUpload}
          />

          {/* Template font import — hidden on small screens */}
          <div className="hidden md:flex items-center rounded border border-border overflow-hidden">
            <button
              onClick={() => setShowTemplate(v => !v)}
              className={["flex items-center gap-1 text-xs px-2.5 py-1.5 transition-all", showTemplate ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"].join(" ")}
            >
              {showTemplate ? <Eye size={12} /> : <EyeOff size={12} />}
              {templateFontLabel ? <span className="max-w-[72px] truncate">{templateFontLabel}</span> : "Template"}
            </button>
            <button
              onClick={() => fontInputRef.current?.click()}
              className="text-[10px] text-muted-foreground hover:text-accent px-2 py-1.5 border-l border-border hover:bg-secondary transition-all"
              title="Import your own font as template"
            >
              {templateFontLabel ? "change" : "import"}
            </button>
          </div>

          {/* Guides toggle — hidden on small screens */}
          <button
            onClick={() => setShowGuides(v => !v)}
            className="hidden md:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded border border-border hover:border-foreground/25 transition-all"
          >
            {showGuides ? <Eye size={12} /> : <EyeOff size={12} />}
            <span className="hidden lg:inline">Guides</span>
          </button>

          {/* Download */}
          <div className="flex items-center rounded overflow-hidden">
            <button
              onClick={() => downloadFont()}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-accent text-white px-2.5 sm:px-3.5 py-1.5 hover:bg-accent/90 active:scale-95 transition-all"
            >
              <Download size={13} />
              <span className="hidden sm:inline">{FONT_STYLES.find(s => s.key === activeStyle)!.label}</span>
            </button>
            <button
              onClick={downloadAllStyles}
              className="text-xs bg-accent/80 text-white px-2 py-1.5 border-l border-white/20 hover:bg-accent transition-all"
              title="Download all styles"
            >
              All
            </button>
          </div>

          <button
            onClick={() => setRightOpen(v => !v)}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded border border-border hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
            title="Toggle brush panel"
          >
            <PanelRight size={14} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* ── Left sidebar ──────────────────────────────────────────────── */}
        <aside
          className="border-r border-border bg-card flex-shrink-0 overflow-hidden"
          style={{ width: leftOpen ? 208 : 0, transition: "width 200ms ease" }}
        >
          <div className="w-52 h-full overflow-y-auto py-4">
            {CHAR_GROUPS.map(group => (
              <div key={group.label} className="mb-5 px-3">
                <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2 px-1">{group.label}</div>
                <div className="flex flex-wrap gap-1">
                  {group.chars.map(char => {
                    const drawn = (glyphs[activeStyle][char]?.length ?? 0) > 0;
                    const active = char === currentChar;
                    return (
                      <button key={char} onClick={() => { setCurrentChar(char); currentPoints.current = []; isDrawing.current = false; }}
                        className={["relative w-8 h-8 text-sm rounded font-medium transition-all", active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"].join(" ")}
                        style={{ fontFamily: "'DM Mono', monospace" }}>
                        {char}
                        {drawn && !active && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Center ────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-background min-w-0">

          {/* Drawing area */}
          <div className="flex-shrink-0 flex flex-col items-center px-4 sm:px-6 pt-4 pb-2 gap-3">

            {/* Style selector */}
            <div className="flex flex-wrap items-center gap-1.5 self-stretch justify-center">
              {FONT_STYLES.map(({ key, label }) => {
                const count = Object.values(glyphs[key]).filter(s => s.length > 0).length;
                const isActive = key === activeStyle;
                const canAutoGenerate = key !== "regular" && regularDrawnCount > 0 && count === 0;
                return (
                  <div key={key} className="flex items-center rounded border border-border overflow-hidden">
                    <button
                      onClick={() => setActiveStyle(key)}
                      className={["flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all", isActive ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"].join(" ")}
                      style={{ fontStyle: key.includes("italic") ? "italic" : "normal", fontWeight: key.includes("bold") ? 700 : 400 }}
                    >
                      <span>{label}</span>
                      {count > 0 && <span className={["text-[10px] rounded px-1", isActive ? "bg-white/20" : "bg-accent/20 text-accent"].join(" ")}>{count}</span>}
                    </button>
                    {canAutoGenerate && (
                      <button
                        onClick={() => key === "bold" ? autoGenerateBold() : key === "italic" ? autoGenerateItalic() : autoGenerateBoldItalic()}
                        className="text-[10px] px-1.5 py-1.5 border-l border-border text-accent hover:bg-secondary transition-all"
                        title={`Auto-generate ${label} from Regular`}
                      >auto</button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Char nav */}
            <div className="flex items-center gap-4">
              <button onClick={() => navigateChar(-1)} className="w-8 h-8 flex items-center justify-center rounded border border-border hover:bg-secondary transition-all">
                <ChevronLeft size={15} />
              </button>
              <div className="text-center w-16">
                <span className="text-5xl font-medium leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>{currentChar}</span>
                <p className="text-[11px] text-muted-foreground mt-1">{currentStrokes.length} stroke{currentStrokes.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => navigateChar(1)} className="w-8 h-8 flex items-center justify-center rounded border border-border hover:bg-secondary transition-all">
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Two-canvas stack — scales to available width, max 420px */}
            <div
              className="relative rounded overflow-hidden w-full mx-auto shadow-md"
              style={{
                maxWidth: CW,
                aspectRatio: `${CW} / ${CH}`,
                border: "1px solid rgba(28,20,9,0.14)",
              }}
            >
              <canvas
                ref={committedRef}
                width={CW}
                height={CH}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
              />
              <canvas
                ref={activeRef}
                width={CW}
                height={CH}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none", cursor: "crosshair" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={() => { setShowDot(false); if (isDrawing.current) onPointerUp(); }}
              />
              {showDot && stabilizer > 0 && (
                <div
                  className="pointer-events-none absolute rounded-full border border-accent/60"
                  style={{
                    width: dotRadius * 2,
                    height: dotRadius * 2,
                    left: dotPos.x - dotRadius,
                    top: dotPos.y - dotRadius,
                    backgroundColor: "rgba(196,120,42,0.05)",
                  }}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button onClick={undoStroke} disabled={currentStrokes.length === 0}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <Undo2 size={12} /> Undo
              </button>
              <button onClick={clearGlyph} disabled={currentStrokes.length === 0}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <Trash2 size={12} /> Clear
              </button>
            </div>
          </div>

          {/* ── Preview section ────────────────────────────────────────── */}
          <div className="flex-shrink-0 mx-4 mb-4 rounded border border-border overflow-hidden">

            {/* Preview header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
              <button onClick={() => setShowPreview(v => !v)} className="flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors">
                <Type size={13} className="text-accent" />
                Text Preview
                {showPreview ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
              </button>
              {showPreview && (
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {/* Font size */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:inline">Size</span>
                    <button onClick={() => setPreviewSize(v => Math.max(16, v - 4))} className="w-5 h-5 flex items-center justify-center rounded border border-border hover:bg-secondary text-muted-foreground">
                      <Minus size={9} />
                    </button>
                    <span className="text-xs w-8 text-center" style={{ fontFamily: "'DM Mono', monospace" }}>{previewSize}px</span>
                    <button onClick={() => setPreviewSize(v => Math.min(96, v + 4))} className="w-5 h-5 flex items-center justify-center rounded border border-border hover:bg-secondary text-muted-foreground">
                      <Plus size={9} />
                    </button>
                  </div>
                  {/* Letter spacing */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:inline">Spacing</span>
                    <button onClick={() => setLetterSpacing(v => Math.max(-100, v - 10))} className="w-5 h-5 flex items-center justify-center rounded border border-border hover:bg-secondary text-muted-foreground">
                      <Minus size={9} />
                    </button>
                    <input
                      type="range" min={-100} max={300} step={10} value={letterSpacing}
                      onChange={e => setLetterSpacing(+e.target.value)}
                      className="w-16 sm:w-20 h-1 accent-[#c4782a]"
                    />
                    <button onClick={() => setLetterSpacing(v => Math.min(300, v + 10))} className="w-5 h-5 flex items-center justify-center rounded border border-border hover:bg-secondary text-muted-foreground">
                      <Plus size={9} />
                    </button>
                    <span className="text-xs w-10 text-center" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {letterSpacing > 0 ? `+${letterSpacing}` : letterSpacing}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {showPreview && (
              <div className="bg-card p-4 space-y-3">

                {/* Phrase presets */}
                <div className="flex flex-wrap gap-1.5">
                  {PHRASES.map(p => (
                    <button key={p.label} onClick={() => setPreviewText(p.text)}
                      className={["text-xs px-2.5 py-1 rounded transition-all", previewText === p.text ? "bg-accent text-white" : "bg-secondary text-secondary-foreground hover:bg-muted"].join(" ")}>
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom text input */}
                <textarea
                  value={previewText}
                  onChange={e => setPreviewText(e.target.value)}
                  rows={2}
                  className="w-full text-sm bg-background border border-border rounded px-3 py-2 outline-none focus:border-accent resize-none text-foreground placeholder:text-muted-foreground transition-colors"
                  placeholder="Type anything to preview your font…"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                />

                {/* Preview canvas */}
                <div className="rounded overflow-hidden" style={{ border: "1px solid rgba(28,20,9,0.1)" }}>
                  <canvas
                    ref={previewRef}
                    width={800}
                    style={{ display: "block", width: "100%" }}
                  />
                </div>

                {drawnCount === 0 && (
                  <p className="text-xs text-muted-foreground text-center italic">
                    Draw some characters above — they will appear here in your font.
                  </p>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ── Right panel — brush controls ──────────────────────────────── */}
        <aside
          className="border-l border-border bg-card flex-shrink-0 overflow-hidden"
          style={{ width: rightOpen ? 240 : 0, transition: "width 200ms ease" }}
        >
          <div className="w-60 h-full overflow-y-auto p-5">

            <Section label="Brush">
              <div className="grid grid-cols-2 gap-1">
                {([
                  ["round",       "Round"],
                  ["inkpen",      "Ink Pen"],
                  ["calligraphy", "Calligraphy"],
                  ["ballpoint",   "Ballpoint"],
                  ["brushpen",    "Brush Pen"],
                  ["marker",      "Marker"],
                  ["chisel",      "Chisel"],
                ] as [BrushType, string][]).map(([t, label]) => (
                  <button key={t} onClick={() => setBrushType(t)}
                    className={["flex items-center gap-1.5 px-2 py-2 rounded text-xs transition-all text-left", brushType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"].join(" ")}>
                    <BrushIcon type={t} active={brushType === t} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Size">
              <SliderRow value={brushSize} min={4} max={48} step={2}
                onMinus={() => setBrushSize(v => Math.max(4, v - 2))}
                onPlus={() => setBrushSize(v => Math.min(48, v + 2))}
                onChange={setBrushSize} display={`${brushSize}px`} />
              <div className="flex items-center justify-center h-7 mt-1.5">
                <div className="bg-foreground rounded-full" style={{ width: brushSize, height: brushSize, maxWidth: 48, maxHeight: 48 }} />
              </div>
            </Section>

            <Section label="Stabilizer">
              <p className="text-[10px] text-muted-foreground mb-2 leading-snug">Lazy brush radius — higher = smoother, slower strokes.</p>
              <SliderRow value={stabilizer} min={0} max={30} step={1}
                onMinus={() => setStabilizer(v => Math.max(0, v - 1))}
                onPlus={() => setStabilizer(v => Math.min(30, v + 1))}
                onChange={setStabilizer} display={stabilizer === 0 ? "Off" : `${stabilizer}px`} />
            </Section>

            <Section label="Stroke Quality">
              <LabeledSlider label="Smoothing"   value={smoothing}   min={0} max={1}    step={0.05} onChange={setSmoothing}   display={`${Math.round(smoothing * 100)}%`} />
              <LabeledSlider label="Streamline"  value={streamline}  min={0} max={0.99} step={0.05} onChange={setStreamline}  display={`${Math.round(streamline * 100)}%`} hint="Reduces input tremor" />
              <LabeledSlider label="Thinning"    value={thinning}    min={-1} max={1}   step={0.05} onChange={setThinning}    display={`${Math.round(thinning * 100)}%`}  hint="Pressure → width" />
              <LabeledSlider label="Taper"       value={taper}       min={0} max={100}  step={5}    onChange={setTaper}       display={taper === 0 ? "Off" : `${taper}`}   hint="End taper length" />
            </Section>

            <Section label="Opacity">
              <SliderRow value={opacity} min={0.2} max={1} step={0.05}
                onMinus={() => setOpacity(v => Math.max(0.2, +(v - 0.05).toFixed(2)))}
                onPlus={() => setOpacity(v => Math.min(1, +(v + 0.05).toFixed(2)))}
                onChange={setOpacity} display={`${Math.round(opacity * 100)}%`} />
            </Section>

            <Section label="Texture">
              <p className="text-[10px] text-muted-foreground mb-2 leading-snug">
                Paper grain — simulates ink breaking up on textured paper. Pairs well with Ballpoint.
              </p>
              <SliderRow value={grain} min={0} max={100} step={5}
                onMinus={() => setGrain(v => Math.max(0, v - 5))}
                onPlus={() => setGrain(v => Math.min(100, v + 5))}
                onChange={setGrain}
                display={grain === 0 ? "Off" : `${grain}%`} />
              {grain > 0 && (
                <div className="mt-2 h-6 rounded overflow-hidden" style={{ border: "1px solid rgba(28,20,9,0.1)" }}>
                  <div
                    className="h-full w-full"
                    style={{
                      background: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4'><rect width='4' height='4' fill='%231c1409'/><rect x='0' y='0' width='1' height='1' fill='%23ffffff' opacity='0.${Math.round(grain * 0.4)}'/><rect x='2' y='2' width='1' height='1' fill='%23ffffff' opacity='0.${Math.round(grain * 0.25)}'/></svg>")`,
                      opacity: 0.85,
                    }}
                  />
                </div>
              )}
            </Section>

            <Section label="Progress">
              <div className="space-y-2">
                {CHAR_GROUPS.map(g => {
                  const n = g.chars.filter(c => (glyphs[activeStyle][c]?.length ?? 0) > 0).length;
                  return (
                    <div key={g.label}>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>{g.label}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace" }}>{n}/{g.chars.length}</span>
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${(n / g.chars.length) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 pb-5 border-b border-border last:border-0 last:mb-0 last:pb-0">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">{label}</p>
      {children}
    </div>
  );
}

function SliderRow({ value, min, max, step, onMinus, onPlus, onChange, display }: {
  value: number; min: number; max: number; step: number;
  onMinus: () => void; onPlus: () => void; onChange: (v: number) => void; display: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onMinus} className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-secondary text-muted-foreground flex-shrink-0"><Minus size={10} /></button>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} className="flex-1 h-1 accent-[#c4782a]" />
      <button onClick={onPlus} className="w-6 h-6 flex items-center justify-center rounded border border-border hover:bg-secondary text-muted-foreground flex-shrink-0"><Plus size={10} /></button>
      <span className="text-[11px] w-8 text-right flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>{display}</span>
    </div>
  );
}

function LabeledSlider({ label, value, min, max, step, onChange, display, hint }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; display: string; hint?: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-foreground/80">{label}</span>
        <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} className="w-full h-1 accent-[#c4782a]" />
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{hint}</p>}
    </div>
  );
}

function BrushIcon({ type, active }: { type: BrushType; active: boolean }) {
  const c  = active ? "rgba(255,255,255,0.85)" : "rgba(28,20,9,0.5)";
  const cb = active ? "rgba(120,140,220,0.9)"  : "rgba(40,40,120,0.55)";
  if (type === "round") return (
    <svg width="18" height="14" viewBox="0 0 18 14">
      <ellipse cx="4" cy="7" rx="3.5" ry="3.5" fill={c} />
      <ellipse cx="10" cy="7" rx="2.5" ry="2.5" fill={c} />
      <ellipse cx="15" cy="7" rx="1.5" ry="1.5" fill={c} />
    </svg>
  );
  if (type === "inkpen") return (
    <svg width="18" height="14" viewBox="0 0 18 14">
      <path d="M1 7 Q9 2 17 7 Q9 12 1 7Z" fill={c} />
    </svg>
  );
  if (type === "calligraphy") return (
    <svg width="18" height="14" viewBox="0 0 18 14">
      <path d="M2 12 L8 2 L10 2 L16 10 L14 11 L9 4 L5 13Z" fill={c} />
    </svg>
  );
  if (type === "ballpoint") return (
    <svg width="18" height="14" viewBox="0 0 18 14">
      <path d="M2 11 Q6 5 10 7 Q14 9 16 3" stroke={cb} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="3" r="1.2" fill={cb} />
    </svg>
  );
  if (type === "brushpen") return (
    // Thick tapered stroke — wide at start, sharp tip
    <svg width="18" height="14" viewBox="0 0 18 14">
      <path d="M1 10 Q5 3 9 5 Q13 7 17 6 L17 7 Q13 8 9 6 Q5 5 2 12Z" fill={c} />
    </svg>
  );
  if (type === "marker") return (
    // Flat rectangular uniform stroke
    <svg width="18" height="14" viewBox="0 0 18 14">
      <rect x="1" y="4.5" width="16" height="5" rx="1" fill={c} opacity="0.75" />
      <rect x="1" y="4.5" width="16" height="5" rx="1" fill="none" stroke={c} strokeWidth="0.5" />
    </svg>
  );
  // Chisel — wide horizontal, razor-thin vertical
  return (
    <svg width="18" height="14" viewBox="0 0 18 14">
      <rect x="1" y="5" width="16" height="4" rx="0.5" fill={c} />
      <line x1="9" y1="1" x2="9" y2="13" stroke={c} strokeWidth="0.8" />
    </svg>
  );
}
