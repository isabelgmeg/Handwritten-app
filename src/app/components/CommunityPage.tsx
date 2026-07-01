import { useEffect, useState } from "react";
import { PreviewCanvas } from "./Canvas/PreviewCanvas";
import { fetchNotes } from "@/services/notesService";
import type { CommunityNote, NoteType } from "@/services/notesService";

function resolveNoteBg(value: string): string {
  return value === "canvas-default" ? "var(--color-note-surface)" : value;
}

// "canvas-ink" → deep warm near-black; multiply blend integrates it with any light note bg.
// Null/undefined guard: Supabase can return null for nullable columns on old rows.
function resolveNoteInk(value: string | null | undefined): string {
  if (!value || value === "canvas-ink") return "oklch(0.562 0.198 35)";
  return value;
}

// Relative luminance check — protects readability if dark bg note options are ever added
function isColorDark(color: string): boolean {
  if (!color.startsWith("#") || color.length < 7) return false;
  const r = parseInt(color.slice(1, 3), 16) / 255;
  const g = parseInt(color.slice(3, 5), 16) / 255;
  const b = parseInt(color.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.35;
}

function seededValue(id: string, scale: number, offset: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % scale) - scale / 2) / offset;
}

function seededHash(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function noteTypeStyle(type: NoteType): React.CSSProperties {
  if (type === "ruled") {
    return {
      backgroundImage: "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, oklch(0 0 0 / 0.10) 28px)",
    };
  }
  if (type === "squared") {
    return {
      backgroundImage: `
        repeating-linear-gradient(to right,  oklch(0.50 0.08 250 / 0.18) 0, oklch(0.50 0.08 250 / 0.18) 1px, transparent 1px, transparent 10px),
        repeating-linear-gradient(to bottom, oklch(0.50 0.08 250 / 0.18) 0, oklch(0.50 0.08 250 / 0.18) 1px, transparent 1px, transparent 10px)
      `,
    };
  }
  return {};
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const COMMUNITY_PREVIEW_SIZE = 28;

function NoteCard({ note }: { note: CommunityNote }) {
  const rotation   = seededValue(note.id, 72, 10);                   // −3.6 … +3.6 deg card tilt

  // Tape: seeded left (−50°) or right (+50°) base, ±25° variation → organic scatter
  const tapeBase   = seededHash(note.id + "f") % 2 === 0 ? -50 : 50;
  const tapeAngle  = tapeBase + seededValue(note.id + "t", 50, 1);   // e.g. −75 … −25 or +25 … +75

  const resolvedBg   = resolveNoteBg(note.note_bg);
  const bgIsDark     = isColorDark(resolvedBg);
  // On dark backgrounds: force light ink so strokes stay visible
  const resolvedInk  = bgIsDark ? "#F5EDE0" : resolveNoteInk(note.note_ink);
  // Disable multiply when user chose a specific ink: multiply collapses dark colors to
  // near-black, making all ink choices look identical. Keep multiply only for the default
  // sentinel so it integrates naturally with the note bg.
  const hasCustomInk = note.note_ink && note.note_ink !== "canvas-ink";
  const disableMultiply = bgIsDark || hasCustomInk;

  return (
    <article
      className="community-note-card"
      aria-label={note.message}
      style={{
        backgroundColor: resolvedBg,
        transform: `rotate(${rotation}deg)`,
        ...noteTypeStyle(note.note_type ?? "plain"),
      }}
    >
      {/* Paper grain */}
      <div className="community-note-grain" aria-hidden />

      {/* Tape */}
      <img
        src="/images/adhesive_tape.png"
        alt=""
        aria-hidden
        className="community-note-tape"
        style={{ transform: `translateX(-50%) rotate(${tapeAngle}deg)` }}
      />

      <div className={`community-note-body${disableMultiply ? " community-note-body--dark-bg" : ""}`}>
        <PreviewCanvas
          previewText={note.message}
          glyphs={note.glyphs}
          previewSize={COMMUNITY_PREVIEW_SIZE}
          letterSpacing={note.letter_spacing}
          lineHeight={note.line_height}
          scriptMode={note.script_mode}
          inkColor={resolvedInk}
          paddingX={8}
        />
      </div>

      <div className="community-note-footer" style={{ color: resolvedInk }}>
        <span className="community-note-author">{note.author ?? "Anonymous"}</span>
        <span className="community-note-date">{formatDate(note.created_at)}</span>
      </div>
    </article>
  );
}

function NoteSkeletons() {
  const rotations = [-2.4, 1.8, -1.1, 2.7, -0.6, 1.3];
  const lineWidths = [
    ["82%", "68%", "91%", "45%"],
    ["75%", "88%", "60%", "38%"],
    ["90%", "55%", "78%", "52%"],
    ["65%", "80%", "42%", "70%"],
    ["88%", "62%", "75%", "50%"],
    ["72%", "85%", "58%", "40%"],
  ];
  return (
    <>
      {rotations.map((rot, i) => (
        <div
          key={i}
          className="community-note-skeleton"
          style={{ transform: `rotate(${rot}deg)` }}
          aria-hidden
        >
          {lineWidths[i].map((w, j) => (
            <div key={j} className="community-note-skeleton-line" style={{ width: w }} />
          ))}
        </div>
      ))}
    </>
  );
}

interface CommunityPageProps {
  onAddNote?: () => void;
  refreshKey?: number;
}

export function CommunityPage({ onAddNote, refreshKey }: CommunityPageProps) {
  const [notes,   setNotes]   = useState<CommunityNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchNotes()
      .then(setNotes)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <div className="community-page">
      <div className="community-header" style={{ isolation: "isolate", backgroundColor: "#F5F0E4" }}>

        {/* Grid overlay: large dark gray copy + red script title — same pattern as landing page */}
        <div style={{ display: "grid", placeItems: "center", marginBottom: "1.75rem" }}>
          <p
            className="mix-blend-multiply"
            style={{
              gridArea: "1 / 1",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.4rem, 3.2vw, 2.6rem)",
              color: "var(--color-text-base)",
              lineHeight: 1.25,
              maxWidth: "36rem",
              textAlign: "center",
            }}
          >
            Every note, a one&#8209;of&#8209;a&#8209;kind handwriting.
          </p>

          <h1
            className="community-title mix-blend-multiply"
            style={{ gridArea: "1 / 1" }}
          >
            Notes from Love Studio
          </h1>
        </div>

        {onAddNote && (
          <button
            onClick={onAddNote}
            className="btn btn-md btn-ghost"
            style={{
              backgroundColor: "#F5F0E4",
              boxShadow: "4px 4px 8px #d7d1c4, -4px -4px 8px #ffffff",
            }}
          >
            + Add a note
          </button>
        )}
      </div>

      {error && (
        <div className="community-empty">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!error && (
        <div className="community-board" aria-busy={loading}>
          {loading
            ? <NoteSkeletons />
            : notes.length === 0
              ? (
                <div className="community-empty">
                  <p className="text-sm text-muted-foreground italic" style={{ fontFamily: "var(--font-display)" }}>
                    No notes yet — be the first to leave one.
                  </p>
                </div>
              )
              : notes.map((note) => <NoteCard key={note.id} note={note} />)
          }
        </div>
      )}
    </div>
  );
}
