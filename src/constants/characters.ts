/**
 * Character Sets and Test Phrases
 */

import type { CharGroup, TestPhrase, FontStyleConfig } from "@/types";

// Font styles configuration
export const FONT_STYLES: FontStyleConfig[] = [
  { key: "regular", label: "Regular", short: "R" },
  { key: "bold", label: "Bold", short: "B" },
  { key: "italic", label: "Italic", short: "I" },
  { key: "bold-italic", label: "Bold Italic", short: "BI" },
];

// Character groups for sidebar
export const CHAR_GROUPS: CharGroup[] = [
  { label: "Uppercase", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("") },
  { label: "Lowercase", chars: "abcdefghijklmnopqrstuvwxyz".split("") },
  { label: "Accented", chars: "áéíóúüñÁÉÍÓÚÜÑ".split("") },
  { label: "Numbers", chars: "0123456789".split("") },
  { label: "Symbols", chars: ".,!?¡¿:;'\"-–—…()[]/@#€&*+=«»°×".split("") },
  { label: "Ligatures", chars: ["fi", "fl", "ff", "ffi", "ffl", "ll", "rr", "ch"] },
];

// All characters flattened for navigation
export const ALL_CHARS = CHAR_GROUPS.flatMap((g) => g.chars);

// Maps each accented character to the base character it derives from.
// Used to pre-fill the canvas with the base glyph as a non-editable ghost layer,
// and to composite base + accent strokes at font export time.
export const ACCENT_BASE_MAP: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u", ñ: "n",
  Á: "A", É: "E", Í: "I", Ó: "O", Ú: "U", Ü: "U", Ñ: "N",
};

// Test phrases for preview
export const PHRASES: TestPhrase[] = [
  { label: "Quick Fox", text: "the quick brown fox jumps over the lazy dog" },
  { label: "Pack My Box", text: "Pack my box with five dozen liquor jugs" },
  { label: "Handwriting", text: "How vexingly quick daft zebras jump" },
  { label: "Numerals", text: "0 1 2 3 4 5 6 7 8 9 & @ ! ? % #" },
  {
    label: "Alphabet",
    text: "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z",
  },
];
