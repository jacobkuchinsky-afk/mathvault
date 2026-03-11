"use client";

import { Pencil, Trash2, Copy, Clock, Pin, Folder, Check } from "lucide-react";
import { MathBlock, RichText } from "./MathRenderer";
import { MathNote } from "@/lib/store";
import { useState } from "react";

interface NoteCardProps {
  note: MathNote;
  onEdit: (note: MathNote) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  compact?: boolean;
}

export default function NoteCard({ note, onEdit, onDelete, onTogglePin, compact }: NoteCardProps) {
  const [copied, setCopied] = useState(false);

  function copyLatex() {
    navigator.clipboard.writeText(note.latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
          <button
            onClick={copyLatex}
            className="p-1.5 text-muted hover:text-ink hover:bg-paper-dark rounded-md transition-colors"
            title="Copy LaTeX"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
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
