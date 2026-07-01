import { useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { PreviewCanvas } from "@/app/components/Canvas/PreviewCanvas";
import { submitNote } from "@/services/notesService";
import type { GlyphMap, ScriptMode } from "@/types";

const NOTE_BG_OPTIONS = [
  { label: "Parchment", value: "#e8ddd0" },
  { label: "Cream",     value: "#f2ead8" },
  { label: "Sage",      value: "#d4e0d4" },
  { label: "Rose",      value: "#e8d4d4" },
  { label: "Slate",     value: "#d4d8e0" },
  { label: "Butter",    value: "#e8e4c8" },
];

const NOTE_INK_OPTIONS = [
  { label: "Ink",     value: "#2c1a0e" },
  { label: "Charcoal",value: "#1a1a1a" },
  { label: "Navy",    value: "#1a2035" },
  { label: "Forest",  value: "#1a2e20" },
  { label: "Plum",    value: "#2e1a2e" },
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
  const [message, setMessage]   = useState(defaultMessage);
  const [author, setAuthor]     = useState("");
  const [noteBg, setNoteBg]     = useState(NOTE_BG_OPTIONS[0].value);
  const [noteInk, setNoteInk]   = useState(NOTE_INK_OPTIONS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

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
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    onShared();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={submitting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a note for the community</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">

          {/* Live note preview */}
          <div
            className="rounded-lg p-4 relative overflow-hidden"
            style={{ backgroundColor: noteBg, minHeight: 80 }}
          >
            <PreviewCanvas
              previewText={message || " "}
              glyphs={glyphs}
              previewSize={previewSize}
              letterSpacing={letterSpacing}
              lineHeight={lineHeight}
              scriptMode={scriptMode}
              inkColor={noteInk}
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label className="label-caps">Your message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Write something…"
              disabled={submitting}
              style={{ boxShadow: "var(--shadow-neu-inset-sm)" }}
              className="w-full rounded-md bg-background border-none px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none disabled:opacity-50 font-[family-name:var(--font-display)]"
            />
          </div>

          {/* Author */}
          <div className="flex flex-col gap-1.5">
            <label className="label-caps">Your name <span className="opacity-50 normal-case tracking-normal">— optional</span></label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Anonymous"
              disabled={submitting}
              style={{ boxShadow: "var(--shadow-neu-inset-sm)" }}
              className="w-full rounded-md bg-background border-none px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
            />
          </div>

          {/* Note bg color */}
          <div className="flex flex-col gap-1.5">
            <span className="label-caps">Note colour</span>
            <div className="flex gap-2">
              {NOTE_BG_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  title={label}
                  onClick={() => setNoteBg(value)}
                  disabled={submitting}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: value,
                    borderColor: noteBg === value ? noteInk : "transparent",
                    boxShadow: noteBg === value ? "0 0 0 1px " + noteInk : "var(--shadow-neu-raised-xs)",
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
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: value,
                    borderColor: noteInk === value ? "var(--background)" : "transparent",
                    boxShadow: noteInk === value ? "0 0 0 2px " + value : "var(--shadow-neu-raised-xs)",
                  }}
                  aria-label={label}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
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
