/**
 * Hook for managing preview state
 */

import { useState } from "react";
import { DEFAULT_PREVIEW_SIZE, DEFAULT_LETTER_SPACING, DEFAULT_LINE_HEIGHT } from "@/constants";

export function usePreviewState() {
  const [toField, setToField] = useState("Myself");
  const [dateField, setDateField] = useState(
    new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" }),
  );
  const [previewText, setPreviewText] = useState(
    "you didn't come this far,\nto only come this far.",
  );
  const [previewSize, setPreviewSize] = useState(DEFAULT_PREVIEW_SIZE);
  const [letterSpacing, setLetterSpacing] = useState(DEFAULT_LETTER_SPACING);
  const [lineHeight, setLineHeight] = useState(DEFAULT_LINE_HEIGHT);

  return {
    toField,
    setToField,
    dateField,
    setDateField,
    previewText,
    setPreviewText,
    previewSize,
    setPreviewSize,
    letterSpacing,
    setLetterSpacing,
    lineHeight,
    setLineHeight,
  };
}
