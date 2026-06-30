export interface CanvasTheme {
  ink:              string;
  inkFringe:        string;
  guideStrong:      string;
  guideBase:        string;
  guideSoft:        string;
  guideSubtle:      string;
  guideFaint:       string;
  guideLabel:       string;
  template:         string;
  scriptLine:       string;
  scriptBand:       string;
  scriptDot:        string;
  previewRule:      string;
  placeholderLine:  string;
  placeholderFill:  string;
}

export function getCanvasTheme(): CanvasTheme {
  const s = getComputedStyle(document.documentElement);
  const get = (v: string) => s.getPropertyValue(v).trim();
  return {
    ink:             get("--canvas-ink"),
    inkFringe:       get("--canvas-ink-fringe"),
    guideStrong:     get("--canvas-guide-strong"),
    guideBase:       get("--canvas-guide-base"),
    guideSoft:       get("--canvas-guide-soft"),
    guideSubtle:     get("--canvas-guide-subtle"),
    guideFaint:      get("--canvas-guide-faint"),
    guideLabel:      get("--canvas-guide-label"),
    template:        get("--canvas-template"),
    scriptLine:      get("--canvas-script-line"),
    scriptBand:      get("--canvas-script-band"),
    scriptDot:       get("--canvas-script-dot"),
    previewRule:     get("--canvas-preview-rule"),
    placeholderLine: get("--canvas-placeholder-line"),
    placeholderFill: get("--canvas-placeholder-fill"),
  };
}
