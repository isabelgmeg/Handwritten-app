import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { submitNote } from "@/services/notesService";
import type { GlyphMap, ScriptMode } from "@/types";

// "canvas-default" / "canvas-ink" are sentinel values resolved at render time
// against the current theme CSS variables.
const NOTE_BG_OPTIONS = [
  { label: "Canvas",   value: "canvas-default" },
  { label: "Cream",    value: "#F2EAD3" },
  { label: "Sage",     value: "#D4E0D4" },
  { label: "Rose",     value: "#EDD5D5" },
  { label: "Slate",    value: "#D4D8E8" },
  { label: "Butter",   value: "#EDE8C4" },
];

const NOTE_INK_OPTIONS = [
  { label: "Canvas",  value: "canvas-ink" },
  { label: "Ink",     value: "#2C2C2C" },
  { label: "Navy",    value: "#1A3D6B" },
  { label: "Forest",  value: "#1A5C35" },
  { label: "Plum",    value: "#6B1A6B" },
  { label: "Rust",    value: "#8B3020" },
];

export type NoteType = "plain" | "ruled" | "squared";

const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: "plain",   label: "Plain" },
  { value: "ruled",   label: "Ruled" },
  { value: "squared", label: "Squared" },
];

interface ShareNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  glyphs: GlyphMap;
  previewSize: number;
  letterSpacing: number;
  lineHeight: number;
  scriptMode: ScriptMode;
  defaultMessage: string;
  onShared: () => void;
}

export function ShareNoteDialog({
  open,
  onOpenChange,
  glyphs,
  previewSize,
  letterSpacing,
  lineHeight,
  scriptMode,
  defaultMessage,
  onShared,
}: ShareNoteDialogProps) {
  const [message,    setMessage]    = useState(defaultMessage);
  const [author,     setAuthor]     = useState("");
  const [noteBg,     setNoteBg]     = useState<string>(NOTE_BG_OPTIONS[0].value);
  const [noteInk,    setNoteInk]    = useState<string>(NOTE_INK_OPTIONS[0].value);
  const [noteType,   setNoteType]   = useState<NoteType>("plain");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Reset form each time dialog opens so previous selections don't bleed through
  useEffect(() => {
    if (open) {
      setMessage(defaultMessage);
      setAuthor("");
      setNoteBg(NOTE_BG_OPTIONS[0].value);
      setNoteInk(NOTE_INK_OPTIONS[0].value);
      setNoteType("plain");
      setError(null);
    }
  }, [open, defaultMessage]);

  async function handleSubmit() {
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await submitNote({
      message: message.trim(),
      author: author.trim() || null,
      glyphs,
      preview_size: previewSize,
      letter_spacing: letterSpacing,
      line_height: lineHeight,
      script_mode: scriptMode,
      note_bg: noteBg,
      note_ink: noteInk,
      note_type: noteType,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    toast("Your note is live! 🎉", { description: "Others can now see your handwriting." });
    onShared();
    onOpenChange(false);
  }

  const inputClass = "w-full rounded-md border-none px-3 py-2 outline-none disabled:opacity-50 bg-background text-accent placeholder:text-[var(--color-text-ghost)]";
  const inputStyle = { boxShadow: "var(--shadow-neu-inset-sm)", fontFamily: "var(--font-display)" };

  return (
    <Dialog open={open} onOpenChange={submitting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a note for the community</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label className="label-caps">Your message</label>
              <span className={`text-[10px] tabular-nums ${message.length > 250 ? "text-destructive" : "text-muted-foreground opacity-60"}`}>
                {message.length}/280
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 280))}
              rows={3}
              placeholder="Write something…"
              disabled={submitting}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Author */}
          <div className="flex flex-col gap-1.5">
            <label className="label-caps">
              Your name <span className="opacity-50 normal-case tracking-normal font-normal">— optional</span>
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Anonymous"
              disabled={submitting}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Note type */}
          <div className="flex flex-col gap-1.5">
            <span className="label-caps">Note style</span>
            <div className="flex gap-2">
              {NOTE_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setNoteType(value)}
                  disabled={submitting}
                  className={[
                    "flex-1 flex flex-col items-center gap-1.5 rounded-md p-2 border-none cursor-pointer transition-all",
                    noteType === value ? "text-accent" : "text-muted-foreground",
                  ].join(" ")}
                  style={{
                    boxShadow: noteType === value
                      ? "var(--shadow-neu-inset-xs)"
                      : "var(--shadow-neu-raised-xs)",
                    backgroundColor: "var(--background)",
                  }}
                >
                  <NoteTypeIcon type={value} />
                  <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note bg */}
          <div className="flex flex-col gap-1.5">
            <span className="label-caps">Note colour</span>
            <div className="flex gap-2 flex-wrap">
              {NOTE_BG_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  title={label}
                  onClick={() => setNoteBg(value)}
                  disabled={submitting}
                  className="w-7 h-7 rounded-full border-2 transition-all cursor-pointer"
                  style={{
                    backgroundColor: value === "canvas-default" ? "var(--color-note-surface)" : value,
                    borderColor: noteBg === value ? "var(--color-mark-base)" : "transparent",
                    boxShadow: noteBg === value
                      ? "0 0 0 1px var(--color-mark-base)"
                      : "var(--shadow-neu-raised-xs)",
                  }}
                  aria-label={label}
                />
              ))}
            </div>
          </div>

          {/* Ink color */}
          <div className="flex flex-col gap-1.5">
            <span className="label-caps">Ink colour</span>
            <div className="flex gap-2">
              {NOTE_INK_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  title={label}
                  onClick={() => setNoteInk(value)}
                  disabled={submitting}
                  className="w-7 h-7 rounded-full border-2 transition-all cursor-pointer"
                  style={{
                    backgroundColor: value === "canvas-ink" ? "var(--color-mark-vivid)" : value,
                    borderColor: noteInk === value ? "var(--background)" : "transparent",
                    boxShadow: noteInk === value
                      ? `0 0 0 2px ${value === "canvas-ink" ? "var(--color-mark-vivid)" : value}`
                      : "var(--shadow-neu-raised-xs)",
                  }}
                  aria-label={label}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="btn btn-md btn-ghost"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !message.trim()}
            className="btn btn-md btn-neu-accent gap-1.5"
          >
            <Send size={13} />
            {submitting ? "Sharing…" : "Share note"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NoteTypeIcon({ type }: { type: NoteType }) {
  const base: React.CSSProperties = {
    width: 36, height: 28, borderRadius: 3,
    backgroundColor: "var(--color-note-surface)",
    position: "relative", overflow: "hidden",
    flexShrink: 0,
  };

  if (type === "ruled") {
    return (
      <div style={{
        ...base,
        backgroundImage: "repeating-linear-gradient(to bottom, transparent 0px, transparent 7px, oklch(0 0 0 / 0.14) 8px)",
      }} />
    );
  }
  if (type === "squared") {
    return (
      <div style={{
        ...base,
        backgroundImage: `
          repeating-linear-gradient(to right,  oklch(0.50 0.08 250 / 0.22) 0, oklch(0.50 0.08 250 / 0.22) 1px, transparent 1px, transparent 8px),
          repeating-linear-gradient(to bottom, oklch(0.50 0.08 250 / 0.22) 0, oklch(0.50 0.08 250 / 0.22) 1px, transparent 1px, transparent 8px)
        `,
      }} />
    );
  }
  return <div style={base} />;
}
