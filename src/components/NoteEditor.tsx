"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { MathBlock, RichText } from "./MathRenderer";
import { MathNote, CATEGORIES, generateId } from "@/lib/store";

interface NoteEditorProps {
  note?: MathNote | null;
  collections: string[];
  onSave: (note: MathNote) => void;
  onCancel: () => void;
}

const SNIPPETS = [
  { label: "frac", tex: "\\frac{}{}", cursor: 6 },
  { label: "sqrt", tex: "\\sqrt{}", cursor: 6 },
  { label: "^", tex: "^{}", cursor: 2 },
  { label: "_", tex: "_{}", cursor: 2 },
  { label: "sum", tex: "\\sum_{i=0}^{n}", cursor: 14 },
  { label: "int", tex: "\\int_{a}^{b}", cursor: 12 },
  { label: "lim", tex: "\\lim_{x \\to }", cursor: 11 },
  { label: "matrix", tex: "\\begin{pmatrix}  &  \\\\  &  \\end{pmatrix}", cursor: 16 },
  { label: "align", tex: "\\begin{aligned}  &=  \\\\  &=  \\end{aligned}", cursor: 16 },
  { label: "cases", tex: "\\begin{cases}  & \\text{if }  \\\\  & \\text{if }  \\end{cases}", cursor: 14 },
  { label: "text", tex: "\\text{}", cursor: 6 },
  { label: "vec", tex: "\\vec{}", cursor: 5 },
];

export default function NoteEditor({ note, collections, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [latex, setLatex] = useState(note?.latex || "");
  const [notes, setNotes] = useState(note?.notes || "");
  const [category, setCategory] = useState(note?.category || CATEGORIES[0]);
  const [collection, setCollection] = useState(note?.collection || "");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [previewTab, setPreviewTab] = useState<"equation" | "notes">("equation");

  const titleRef = useRef<HTMLInputElement>(null);
  const latexRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

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
      collection,
      pinned: note?.pinned || false,
      createdAt: note?.createdAt || now,
      updatedAt: now,
    });
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  function insertSnippet(tex: string, cursorOffset: number) {
    if (!latexRef.current) return;
    const ta = latexRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newLatex = latex.substring(0, start) + tex + latex.substring(end);
    setLatex(newLatex);
    setTimeout(() => {
      ta.focus();
      const pos = start + cursorOffset;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }

  function handleLatexKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      insertSnippet("  ", 2);
    }
  }

  return (
    <div
      className="fade-in"
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave(); }
        if (e.key === "Escape") onCancel();
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold font-[family-name:var(--font-serif)]">
          {note ? "Edit Note" : "New Note"}
        </h2>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-muted border border-border rounded-lg hover:bg-paper-dark transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors">
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Title</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quadratic Formula"
              className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Collection</label>
              <input
                type="text"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                list="collections-list"
                placeholder="Optional..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all text-sm"
              />
              <datalist id="collections-list">
                {collections.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-muted uppercase tracking-wider">LaTeX</label>
              <div className="flex gap-1 flex-wrap justify-end">
                {SNIPPETS.map((s) => (
                  <button key={s.label} onClick={() => insertSnippet(s.tex, s.cursor)} className="px-1.5 py-0.5 text-[11px] bg-paper-dark text-muted rounded hover:bg-border transition-colors font-mono" title={s.tex}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              ref={latexRef}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              onKeyDown={handleLatexKeyDown}
              placeholder="e.g. x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              rows={5}
              className="equation-input w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">
              Notes <span className="normal-case font-normal">(use $...$ for inline math)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={"How to use this, when to apply it...\nUse $x^2$ for inline math"}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-y text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1 uppercase tracking-wider">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-tag-bg text-tag-text rounded-full">
                  {tag}
                  <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-danger"><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag..."
                className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              <button onClick={addTag} className="px-3 py-1.5 text-sm bg-paper-dark text-muted rounded-lg hover:bg-border transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Preview</label>
            <div className="flex gap-1 text-xs">
              <button onClick={() => setPreviewTab("equation")} className={`px-2 py-0.5 rounded ${previewTab === "equation" ? "bg-accent/10 text-accent-dark font-medium" : "text-muted hover:text-ink"}`}>
                Equation
              </button>
              <button onClick={() => setPreviewTab("notes")} className={`px-2 py-0.5 rounded ${previewTab === "notes" ? "bg-accent/10 text-accent-dark font-medium" : "text-muted hover:text-ink"}`}>
                Notes
              </button>
            </div>
          </div>
          <div className="border border-border rounded-lg bg-card p-4 min-h-[280px]">
            {previewTab === "equation" ? (
              latex.trim() ? <MathBlock latex={latex} /> : <p className="text-muted text-sm italic">Type LaTeX to see preview...</p>
            ) : (
              notes.trim() ? <div className="text-sm leading-relaxed"><RichText text={notes} /></div> : <p className="text-muted text-sm italic">Add notes with $inline math$...</p>
            )}
          </div>
          <p className="text-[11px] text-muted">Ctrl+Enter to save. Escape to cancel.</p>
        </div>
      </div>
    </div>
  );
}
