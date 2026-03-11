"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { MathBlock } from "./MathRenderer";
import { MathNote, CATEGORIES, generateId } from "@/lib/store";

interface NoteEditorProps {
  note?: MathNote | null;
  onSave: (note: MathNote) => void;
  onCancel: () => void;
}

export default function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [latex, setLatex] = useState(note?.latex || "");
  const [notes, setNotes] = useState(note?.notes || "");
  const [category, setCategory] = useState(note?.category || CATEGORIES[0]);
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  const titleRef = useRef<HTMLInputElement>(null);
  const latexRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function handleSave() {
    if (!title.trim() && !latex.trim()) return;

    const now = Date.now();
    onSave({
      id: note?.id || generateId(),
      title: title.trim() || "Untitled",
      latex: latex.trim(),
      notes: notes.trim(),
      tags,
      category,
      createdAt: note?.createdAt || now,
      updatedAt: now,
    });
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  }

  function insertLatexSnippet(snippet: string) {
    if (!latexRef.current) return;
    const ta = latexRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = latex.substring(0, start);
    const after = latex.substring(end);
    const newLatex = before + snippet + after;
    setLatex(newLatex);
    setTimeout(() => {
      ta.focus();
      const cursorPos = start + snippet.indexOf("|}") > -1
        ? start + snippet.indexOf("|}") - 1
        : start + snippet.length;
      ta.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  }

  const snippets = [
    { label: "frac", tex: "\\frac{}{}" },
    { label: "sqrt", tex: "\\sqrt{}" },
    { label: "pow", tex: "^{}" },
    { label: "sub", tex: "_{}" },
    { label: "sum", tex: "\\sum_{i=0}^{n}" },
    { label: "int", tex: "\\int_{a}^{b}" },
    { label: "lim", tex: "\\lim_{x \\to \\infty}" },
    { label: "matrix", tex: "\\begin{pmatrix}  &  \\\\  &  \\end{pmatrix}" },
    { label: "align", tex: "\\begin{aligned}  &=  \\\\  &=  \\end{aligned}" },
    { label: "cases", tex: "\\begin{cases}  & \\text{if }  \\\\  & \\text{if }  \\end{cases}" },
  ];

  return (
    <div className="fade-in" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold font-[family-name:var(--font-serif)]">
          {note ? "Edit Note" : "New Note"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-muted border border-border rounded-lg hover:bg-paper-dark transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors"
          >
            Save (Ctrl+Enter)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Title</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quadratic Formula"
              className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-muted">LaTeX Equation</label>
              <div className="flex gap-1 flex-wrap">
                {snippets.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => insertLatexSnippet(s.tex)}
                    className="px-1.5 py-0.5 text-xs bg-paper-dark text-muted rounded hover:bg-border transition-colors font-mono"
                    title={s.tex}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              ref={latexRef}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="e.g. x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              rows={5}
              className="equation-input w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How to use this, when to apply it, tips..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-tag-bg text-tag-text rounded-full"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-danger">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(); }
                }}
                placeholder="Add tag..."
                className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              <button
                onClick={addTag}
                className="px-3 py-1.5 text-sm bg-paper-dark text-muted rounded-lg hover:bg-border transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-muted">Preview</label>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-muted hover:text-ink transition-colors"
            >
              {showPreview ? "Hide" : "Show"}
            </button>
          </div>
          {showPreview && (
            <div className="border border-border rounded-lg bg-card p-4 min-h-[200px]">
              {latex.trim() ? (
                <MathBlock latex={latex} />
              ) : (
                <p className="text-muted text-sm italic">Type LaTeX to see preview...</p>
              )}
              {notes.trim() && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm whitespace-pre-wrap">{notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
