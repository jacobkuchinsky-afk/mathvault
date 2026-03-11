"use client";

import { Pencil, Trash2, Copy, Clock, Pin, Folder, Check, ExternalLink } from "lucide-react";
import { MathBlock, RichText } from "./MathRenderer";
import { MathNote } from "@/lib/store";
import { useState } from "react";

function extractInlineEquations(text: string): string[] {
  const matches = text.match(/\$([^$]+)\$/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1, -1));
}

function getAllEquations(note: MathNote): { label: string; latex: string }[] {
  const eqs: { label: string; latex: string }[] = [];
  if (note.latex) {
    eqs.push({ label: "Main", latex: note.latex });
  }
  const inline = extractInlineEquations(note.notes);
  inline.forEach((eq, i) => {
    eqs.push({ label: `Inline ${i + 1}`, latex: eq });
  });
  return eqs;
}

interface NoteCardProps {
  note: MathNote;
  onEdit: (note: MathNote) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  compact?: boolean;
}

export default function NoteCard({ note, onEdit, onDelete, onTogglePin, compact }: NoteCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEqMenu, setShowEqMenu] = useState(false);

  const allEquations = getAllEquations(note);
  const hasMultiple = allEquations.length > 1;

  function copyTex(latex: string, id: string) {
    navigator.clipboard.writeText(latex);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    setShowEqMenu(false);
  }

  function copyMathJax(latex: string, id: string) {
    navigator.clipboard.writeText(`$$${latex}$$`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    setShowEqMenu(false);
  }

  function openDesmos(latex: string) {
    navigator.clipboard.writeText(latex);
    window.open("https://www.desmos.com/calculator", "_blank");
    setCopiedId("desmos");
    setTimeout(() => setCopiedId(null), 2000);
    setShowEqMenu(false);
  }

  const timeAgo = getTimeAgo(note.updatedAt);

  if (compact) {
    return (
      <div
        className="note-card bg-card border border-border rounded-lg px-4 py-3 fade-in cursor-pointer flex items-center gap-4"
        onClick={() => onEdit(note)}
      >
        {note.pinned && <Pin size={12} className="text-accent shrink-0" />}
        <div className="flex-1 min-w-0">
          <span className="font-medium truncate block">{note.title}</span>
        </div>
        <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent-dark rounded-full shrink-0">
          {note.category}
        </span>
        {note.collection && (
          <span className="text-xs text-muted flex items-center gap-1 shrink-0">
            <Folder size={10} />
            {note.collection}
          </span>
        )}
        <span className="text-xs text-muted shrink-0">{timeAgo}</span>
      </div>
    );
  }

  return (
    <div className="note-card bg-card border border-border rounded-xl p-5 fade-in">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {note.pinned && <Pin size={13} className="text-accent shrink-0" />}
            <h3 className="font-semibold text-lg font-[family-name:var(--font-serif)] truncate">
              {note.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent-dark rounded-full font-medium">
              {note.category}
            </span>
            {note.collection && (
              <span className="text-xs text-muted flex items-center gap-1">
                <Folder size={10} />
                {note.collection}
              </span>
            )}
            <span className="text-xs text-muted flex items-center gap-1">
              <Clock size={10} />
              {timeAgo}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onTogglePin(note.id)}
            className={`p-1.5 rounded-md transition-colors ${note.pinned ? "text-accent" : "text-muted hover:text-ink hover:bg-paper-dark"}`}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <Pin size={14} />
          </button>

          {/* Copy / Desmos menu */}
          <div className="relative">
            <button
              onClick={() => hasMultiple ? setShowEqMenu(!showEqMenu) : copyTex(note.latex, "main")}
              className="p-1.5 text-muted hover:text-ink hover:bg-paper-dark rounded-md transition-colors"
              title={hasMultiple ? "Copy equations" : "Copy LaTeX"}
            >
              {copiedId ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            </button>

            {showEqMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowEqMenu(false)} />
                <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[220px] fade-in">
                  {allEquations.map((eq, i) => (
                    <div key={i} className="border-b border-border/50 last:border-0">
                      <div className="px-3 py-1.5 text-[11px] text-muted font-medium uppercase tracking-wider">
                        {eq.label}: <span className="font-mono normal-case text-ink/70">{eq.latex.length > 25 ? eq.latex.substring(0, 25) + "..." : eq.latex}</span>
                      </div>
                      <div className="flex px-2 pb-1.5 gap-1">
                        <button
                          onClick={() => copyTex(eq.latex, `tex-${i}`)}
                          className="flex-1 text-xs px-2 py-1 text-muted hover:text-ink hover:bg-paper-dark rounded transition-colors text-left"
                        >
                          Copy LaTeX
                        </button>
                        <button
                          onClick={() => copyMathJax(eq.latex, `mj-${i}`)}
                          className="flex-1 text-xs px-2 py-1 text-muted hover:text-ink hover:bg-paper-dark rounded transition-colors text-left"
                        >
                          Copy MathJax
                        </button>
                        <button
                          onClick={() => openDesmos(eq.latex)}
                          className="text-xs px-2 py-1 text-muted hover:text-ink hover:bg-paper-dark rounded transition-colors flex items-center gap-1"
                        >
                          <ExternalLink size={10} />
                          Desmos
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Desmos button (shown when single equation) */}
          {!hasMultiple && note.latex && (
            <button
              onClick={() => openDesmos(note.latex)}
              className="p-1.5 text-muted hover:text-ink hover:bg-paper-dark rounded-md transition-colors"
              title="Open in Desmos (copies equation)"
            >
              {copiedId === "desmos" ? <Check size={14} className="text-success" /> : <ExternalLink size={14} />}
            </button>
          )}

          <button
            onClick={() => onEdit(note)}
            className="p-1.5 text-muted hover:text-ink hover:bg-paper-dark rounded-md transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-muted hover:text-danger hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {note.latex && (
        <div className="bg-paper dark:bg-ink/5 rounded-lg my-3 border border-border/50">
          <MathBlock latex={note.latex} />
        </div>
      )}

      {note.notes && (
        <div className="text-sm text-muted leading-relaxed mt-2">
          <RichText text={note.notes} />
        </div>
      )}

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {note.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-tag-bg text-tag-text rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
