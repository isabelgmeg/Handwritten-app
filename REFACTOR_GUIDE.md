# Refactored Architecture - Quick Reference Guide

## 🎯 Quick Navigation

### Import Paths (all barrel exports)
```typescript
// Types
import type { Stroke, BrushType, StyleGlyphs } from "@/types";

// Constants
import { CANVAS_WIDTH, FONT_STYLES, ALL_CHARS } from "@/constants";

// Services
import { LazyBrush, drawStroke, renderPreview, downloadFont } from "@/services";

// Utils
import { canvasToFont, buildBrushOptions, createGrainCanvas } from "@/utils";

// Hooks
import { useGlyphState, useBrushSettings, usePreviewState } from "@/hooks";
```

## 🔧 Using the New Structure

### Example 1: Add a stroke to a glyph
```typescript
import { useGlyphState } from "@/hooks";
import { Stroke } from "@/types";

function MyComponent() {
  const { addStroke } = useGlyphState(setGlyphs, activeStyle);
  
  const newStroke: Stroke = {
    points: [[x, y, pressure]],
    options: buildBrushOptions("round", 20, 0.6, 0.5, 0.5, 0),
    brushType: "round",
    opacity: 1,
  };
  
  addStroke("A", newStroke);
}
```

### Example 2: Render a stroke on canvas
```typescript
import { drawStroke, getOrCreateGrainCanvas } from "@/services";
import { Stroke } from "@/types";

function renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const grainCanvas = getOrCreateGrainCanvas();
  drawStroke(ctx, stroke, grainCanvas, grain);
}
```

### Example 3: Export a font
```typescript
import { downloadFont } from "@/services";

async function exportFont() {
  await downloadFont(glyphs, "regular", "My Font", 0);
}
```

### Example 4: Auto-generate bold variant
```typescript
import { autoGenerateBold } from "@/services";

function generateBold() {
  const newGlyphs = autoGenerateBold(glyphs);
  setGlyphs(newGlyphs);
}
```

## 📦 File Organization by Feature

### **Drawing & Rendering**
- `services/brushEngine.ts` - Lazy brush algorithm
- `services/drawingEngine.ts` - Canvas rendering
- `utils/canvas.ts` - Canvas helpers
- `hooks/useLazyDot.ts` - Brush indicator state

### **Font Management**
- `services/fontGenerator.ts` - Font export
- `services/fontStyleService.ts` - Variant generation
- `constants/glyphs.ts` - Glyph names
- `hooks/useGlyphState.ts` - Glyph CRUD

### **Brush Control**
- `utils/brush.ts` - Brush option builder
- `constants/brushes.ts` - Brush configs
- `hooks/useBrushSettings.ts` - Brush state

### **Preview & Layout**
- `services/previewEngine.ts` - Text preview
- `hooks/usePreviewState.ts` - Preview state
- `hooks/useCanvasState.ts` - Canvas state
- `hooks/useLayoutState.ts` - Sidebar state

## 🧪 Testing Guide

### Unit Test Example: Brush Options
```typescript
import { buildBrushOptions } from "@/utils";

test("ballpoint brush should have low thinning", () => {
  const opts = buildBrushOptions("ballpoint", 20, 0.6, 0.5, 0.5, 0);
  expect(opts.thinning).toBeLessThan(0.2);
});
```

### Unit Test Example: Canvas Conversion
```typescript
import { canvasToFont } from "@/utils";

test("center canvas converts correctly", () => {
  const [x, y] = canvasToFont(CANVAS_WIDTH / 2, BASELINE_Y);
  expect(x).toBeCloseTo(UPM / 2);
});
```

## 📏 Constants Reference

### Canvas Dimensions
- `CANVAS_WIDTH`: 420px
- `CANVAS_HEIGHT`: 480px
- `BASELINE_Y`: 355.2px

### Font Metrics (OpenType)
- `UPM`: 1000 (units per em)
- `ASCENDER`: 800
- `DESCENDER`: -200

### Default Values
- `DEFAULT_BRUSH_SIZE`: 20
- `DEFAULT_OPACITY`: 1
- `DEFAULT_STABILIZER`: 4
- `DEFAULT_PREVIEW_SIZE`: 40

## 🔀 Migration from Old Code

### Before (monolithic)
```typescript
// Everything in App.tsx
const [brushSize, setBrushSize] = useState(20);
const [opacity, setOpacity] = useState(1);
// ... 20+ more useState calls
```

### After (structured)
```typescript
// Separate concerns
const { brushSize, setBrushSize, opacity, setOpacity } = useBrushSettings();
const { addStroke, undoStroke } = useGlyphState(setGlyphs, activeStyle);
```

## 🎓 When to Add New Code

| Type | Location | Example |
|------|----------|---------|
| New constant | `constants/` | Canvas size, default values |
| New service | `services/` | Italic generation, font loading |
| New utility | `utils/` | Coordinate helpers, validators |
| New hook | `hooks/` | State management for new feature |
| New type | `types/index.ts` | Data structures, UI states |

## 💡 Best Practices

1. **Keep services pure** - No React hooks in services
2. **Use hooks for state** - Never use useState in services
3. **Export from barrel files** - Use `index.ts` for cleaner imports
4. **Centralize constants** - Never hardcode values
5. **Type everything** - Use `@/types` imports everywhere
