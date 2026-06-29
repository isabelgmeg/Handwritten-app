/**
 * Hook for managing canvas state
 */

import { useState } from "react";
import type { FontStyle } from "@/types";

export function useCanvasState() {
  const [currentChar, setCurrentChar] = useState("A");
  const [activeStyle, setActiveStyle] = useState<FontStyle>("regular");
  const [showGuides, setShowGuides] = useState(true);
  const [showTemplate, setShowTemplate] = useState(true);
  const [templateFont, setTemplateFont] = useState<string | undefined>(
    undefined,
  );
  const [templateFontLabel, setTemplateFontLabel] = useState<
    string | undefined
  >(undefined);
  const [fontName, setFontName] = useState("My Handwriting");

  return {
    currentChar,
    setCurrentChar,
    activeStyle,
    setActiveStyle,
    showGuides,
    setShowGuides,
    showTemplate,
    setShowTemplate,
    templateFont,
    setTemplateFont,
    templateFontLabel,
    setTemplateFontLabel,
    fontName,
    setFontName,
  };
}
