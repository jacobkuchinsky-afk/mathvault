"use client";

import { Pencil, Trash2, Copy, Clock } from "lucide-react";
import { MathBlock } from "./MathRenderer";
import { MathNote } from "@/lib/store";

interface NoteCardProps {
  note: MathNote;
  onEdit: (note: MathNote) => void;
  onDelete: (id: string) => void;
}

export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  function copyLatex() {
    navigator.clipboard.writeText(note.latex);
  }

  const timeAgo = getTimeAgo(note.updatedAt);

  return (
    <div className="note-card bg-card border border-border rounded-xl p-5 fade-in">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg font-[family-name:var(--font-serif)] truncate">
            {note.title}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent-dark rounded-full font-medium">
              {note.category}
            </span>
            <span className="text-xs text-muted flex items-center gap-1">
              <Clock size={10} />
              {timeAgo}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={copyLatex}
            className="p-1.5 text-muted hover:text-ink hover:bg-paper-dark rounded-md transition-colors"
            title="Copy LaTeX"
          >
            <Copy size={14} />
          </button>
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
        <div className="bg-paper rounded-lg my-3 border border-border/50">
          <MathBlock latex={note.latex} />
        </div>
      )}

      {note.notes && (
        <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap mt-2">
          {note.notes}
        </p>
      )}

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-tag-bg text-tag-text rounded-full"
            >
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
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
