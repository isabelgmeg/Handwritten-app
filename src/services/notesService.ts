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

export async function submitNote(payload: NotePayload): Promise<{ ok: boolean; error?: string; note?: CommunityNote }> {
  const { data, error } = await supabase
    .from('notes')
    .insert(payload)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, note: data as CommunityNote };
}

export async function fetchNotes(): Promise<CommunityNote[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CommunityNote[];
}
