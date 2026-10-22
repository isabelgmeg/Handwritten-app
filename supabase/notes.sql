-- Run in the Supabase Studio SQL Editor. Limits what the public insert policy on
-- community notes accepts. Posting stays open to anon (that's the feature), but
-- within sizes the app's note form also enforces (ShareNoteDialog, notesService).
-- Measured 2026-10-22 across 12 notes: longest message 161 chars, author 15,
-- glyphs ~300 KB stored.

alter policy "anyone can insert notes" on public.notes
  with check (
    char_length(message) between 1 and 280
    and (author is null or char_length(author) <= 60)
    and octet_length(glyphs::text) <= 2000000
  );
