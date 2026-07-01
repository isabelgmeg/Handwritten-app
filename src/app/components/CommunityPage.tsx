import { useEffect, useState } from "react";
import { PreviewCanvas } from "./Canvas/PreviewCanvas";
import { fetchNotes } from "@/services/notesService";
import type { CommunityNote } from "@/services/notesService";

function seededRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % 72) - 36) / 10; // range −3.6 … +3.6 deg
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function NoteCard({ note }: { note: CommunityNote }) {
  const rotation = seededRotation(note.id);

  return (
    <div
      className="community-note-card"
      style={{
        backgroundColor: note.note_bg,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Paper grain overlay */}
      <div className="community-note-grain" aria-hidden />

      <div className="community-note-body">
        <PreviewCanvas
          previewText={note.message}
          glyphs={note.glyphs}
          previewSize={note.preview_size}
          letterSpacing={note.letter_spacing}
          lineHeight={note.line_height}
          scriptMode={note.script_mode}
          inkColor={note.note_ink}
        />
      </div>

      <div className="community-note-footer" style={{ color: note.note_ink }}>
        <span className="community-note-author">
          {note.author ?? "Anonymous"}
        </span>
        <span className="community-note-date">
          {formatDate(note.created_at)}
        </span>
      </div>
    </div>
  );
}

export function CommunityPage() {
  const [notes, setNotes]     = useState<CommunityNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetchNotes()
      .then(setNotes)
      .catch(() => setError("Couldn't load notes. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="community-page">
      <div className="community-header">
        <h1 className="community-title">Notes from the studio</h1>
        <p className="community-subtitle">
          Every note written in a one-of-a-kind handwritten font.
        </p>
      </div>

      {loading && (
        <div className="community-empty">
          <p className="text-sm text-muted-foreground">Loading notes…</p>
        </div>
      )}

      {error && (
        <div className="community-empty">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && notes.length === 0 && (
        <div className="community-empty">
          <p className="text-sm text-muted-foreground italic" style={{ fontFamily: "var(--font-display)" }}>
            No notes yet — be the first to leave one.
          </p>
        </div>
      )}

      {!loading && notes.length > 0 && (
        <div className="community-board">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
