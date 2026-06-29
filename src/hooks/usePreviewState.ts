/**
 * Hook for managing preview state
 */

import { useState } from "react";
import { DEFAULT_PREVIEW_SIZE, DEFAULT_LETTER_SPACING } from "@/constants";

export function usePreviewState() {
  const [previewText, setPreviewText] = useState(
    "the quick brown fox jumps over the lazy dog",
  );
  const [previewSize, setPreviewSize] = useState(DEFAULT_PREVIEW_SIZE);
  const [letterSpacing, setLetterSpacing] = useState(DEFAULT_LETTER_SPACING);
  const [showPreview, setShowPreview] = useState(true);

  return {
    previewText,
    setPreviewText,
    previewSize,
    setPreviewSize,
    letterSpacing,
    setLetterSpacing,
    showPreview,
    setShowPreview,
  };
}
