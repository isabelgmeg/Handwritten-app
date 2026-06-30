/**
 * Centralized Type Definitions
 * All core types for the font editor application
 */

// ── Brush & Drawing Types ─────────────────────────────────────────────────

export type BrushType =
  | "round"
  | "inkpen"
  | "calligraphy"
  | "ballpoint"
  | "brushpen"
  | "marker"
  | "chisel";

export type FontStyle = "regular" | "bold" | "italic" | "bold-italic";

export type ScriptMode = "normal" | "connected";

export interface PFOptions {
  size: number;
  thinning: number;
  smoothing: number;
  streamline: number;
  simulatePressure: boolean;
  start: { cap: boolean; taper: number };
  end: { cap: boolean; taper: number };
}

export interface Stroke {
  points: [number, number, number][];
  options: PFOptions;
  brushType: BrushType;
  opacity: number;
}

// ── Font & Glyph Types ────────────────────────────────────────────────────

export type GlyphMap = Record<string, Stroke[]>;

export type StyleGlyphs = Record<FontStyle, GlyphMap>;

export interface FontStyleConfig {
  key: FontStyle;
  label: string;
  short: string;
}

export interface CharGroup {
  label: string;
  chars: string[];
}

export interface TestPhrase {
  label: string;
  text: string;
}

// ── UI State Types ────────────────────────────────────────────────────────

export interface BrushSettings {
  brushType: BrushType;
  brushSize: number;
  thinning: number;
  smoothing: number;
  streamline: number;
  stabilizer: number;
  taper: number;
  opacity: number;
  grain: number;
}

export interface BrushSettingsActions {
  setBrushType: (v: BrushType) => void;
  setBrushSize: (v: number) => void;
  setOpacity: (v: number) => void;
  setStabilizer: (v: number) => void;
  setSmoothing: (v: number) => void;
  setStreamline: (v: number) => void;
  setThinning: (v: number) => void;
  setTaper: (v: number) => void;
  setGrain: (v: number) => void;
}

export interface CanvasState {
  currentChar: string;
  activeStyle: FontStyle;
  showGuides: boolean;
  showTemplate: boolean;
  templateFont?: string;
  templateFontLabel?: string;
  fontName: string;
}

export interface PreviewState {
  previewText: string;
  previewSize: number;
  letterSpacing: number;
}

export interface LayoutState {
  leftOpen: boolean;
  rightOpen: boolean;
}

export interface LazyDotState {
  showDot: boolean;
  dotPos: { x: number; y: number };
}

// ── Drawing State ─────────────────────────────────────────────────────────

export interface DrawingContext {
  isDrawing: boolean;
  currentPoints: [number, number, number][];
  currentOpts: PFOptions | null;
  currentOpacity: number;
  currentBrushType: BrushType;
  canvasDisplayScale: number;
}
