import { supabase } from '@/lib/supabase';
import type { GlyphMap, ScriptMode } from '@/types';

export type NoteType = "plain" | "ruled" | "squared";

export interface CommunityNote {
  id: string;
  message: string;
  author: string | null;
  glyphs: GlyphMap;
  preview_size: number;
  letter_spacing: number;
  line_height: number;
  script_mode: ScriptMode;
  note_bg: string;
  note_ink: string;
  note_type: NoteType;
  created_at: string;
}

export type NotePayload = Omit<CommunityNote, 'id' | 'created_at'>;

const NOT_CONFIGURED = 'Community notes are not available right now.';

// Kept under the 2 MB the notes insert policy allows (supabase/notes.sql), since
// Postgres's text form of the JSON is a little longer than JSON.stringify's.
const MAX_GLYPHS_CHARS = 1_800_000;

// A note only renders its message, one glyph per character (renderPreview), so
// storing the rest of the alphabet just bloats the row and every community page load.
function glyphsUsedBy(message: string, glyphs: GlyphMap): GlyphMap {
  const used: GlyphMap = {};
  for (const ch of new Set(message.split(''))) {
    if (glyphs[ch]) used[ch] = glyphs[ch];
  }
  return used;
}

export async function submitNote(note: NotePayload): Promise<{ ok: boolean; error?: string; note?: CommunityNote }> {
  if (!supabase) return { ok: false, error: NOT_CONFIGURED };
  const payload = { ...note, glyphs: glyphsUsedBy(note.message, note.glyphs) };
  if (JSON.stringify(payload.glyphs).length > MAX_GLYPHS_CHARS) {
    return { ok: false, error: 'Your handwriting is too detailed to share as a note. Try simplifying a few letters.' };
  }
  const { data, error } = await supabase
    .from('notes')
    .insert(payload)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, note: data as CommunityNote };
}

export async function fetchNotes(): Promise<CommunityNote[]> {
  if (!supabase) throw new Error(NOT_CONFIGURED);
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CommunityNote[];
}
