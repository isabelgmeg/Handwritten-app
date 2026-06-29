/**
 * Glyph Name Mappings for OpenType Font Generation
 * Maps Unicode characters to OpenType glyph names
 */

export const GLYPH_NAMES: Record<string, string> = {
  // ASCII symbols
  ".": "period",
  ",": "comma",
  "!": "exclam",
  "?": "question",
  ":": "colon",
  ";": "semicolon",
  "'": "quotesingle",
  '"': "quotedbl",
  "-": "hyphen",
  "(": "parenleft",
  ")": "parenright",
  "[": "bracketleft",
  "]": "bracketright",
  "/": "slash",
  "@": "at",
  "#": "numbersign",
  "&": "ampersand",
  "*": "asterisk",
  "+": "plus",
  "=": "equal",

  // Spanish punctuation
  "¡": "exclamdown",
  "¿": "questiondown",
  "«": "guillemotleft",
  "»": "guillemotright",

  // Extended symbols
  "€": "Euro",
  "–": "endash",
  "—": "emdash",
  "…": "ellipsis",
  "°": "degree",
  "×": "multiply",

  // Accented lowercase
  á: "aacute",
  é: "eacute",
  í: "iacute",
  ó: "oacute",
  ú: "uacute",
  ü: "udieresis",
  ñ: "ntilde",

  // Accented uppercase
  Á: "Aacute",
  É: "Eacute",
  Í: "Iacute",
  Ó: "Oacute",
  Ú: "Uacute",
  Ü: "Udieresis",
  Ñ: "Ntilde",
};
