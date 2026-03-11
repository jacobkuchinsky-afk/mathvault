"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Plus, Download, Upload, SlidersHorizontal, X } from "lucide-react";
import { MathProvider } from "@/components/MathRenderer";
import NoteEditor from "@/components/NoteEditor";
import NoteCard from "@/components/NoteCard";
import { MathNote, loadNotes, saveNotes, exportNotes, searchNotes, CATEGORIES } from "@/lib/store";

type SortBy = "updated" | "created" | "title";
type View = "list" | "editor";

export default function Home() {
  const [notes, setNotes] = useState<MathNote[]>([]);
  const [view, setView] = useState<View>("list");
  const [editingNote, setEditingNote] = useState<MathNote | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("updated");
  const [showFilters, setShowFilters] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setNotes(loadNotes());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveNotes(notes);
  }, [notes, loaded]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "n" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        openEditor(null);
      }
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const usedCategories = useMemo(() => {
    const cats = new Set<string>();
    notes.forEach((n) => cats.add(n.category));
    return CATEGORIES.filter((c) => cats.has(c));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = searchNotes(notes, searchQuery);
    if (filterCategory) {
      result = result.filter((n) => n.category === filterCategory);
    }
    if (filterTag) {
      result = result.filter((n) => n.tags.includes(filterTag));
    }
    result.sort((a, b) => {
      if (sortBy === "updated") return b.updatedAt - a.updatedAt;
      if (sortBy === "created") return b.createdAt - a.createdAt;
      return a.title.localeCompare(b.title);
    });
    return result;
  }, [notes, searchQuery, filterCategory, filterTag, sortBy]);

  const openEditor = useCallback((note: MathNote | null) => {
    setEditingNote(note);
    setView("editor");
  }, []);

  function handleSave(note: MathNote) {
    setNotes((prev) => {
      const existing = prev.findIndex((n) => n.id === note.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = note;
        return updated;
      }
      return [note, ...prev];
    });
    setView("list");
    setEditingNote(null);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          if (Array.isArray(imported)) {
            const merged = [...notes];
            for (const n of imported) {
              if (!merged.find((m) => m.id === n.id)) {
                merged.push(n);
              }
            }
            setNotes(merged);
          }
        } catch {
          alert("Invalid file format");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function clearFilters() {
    setFilterCategory("");
    setFilterTag("");
    setSearchQuery("");
  }

  const hasActiveFilters = filterCategory || filterTag || searchQuery;

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <MathProvider>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight font-[family-name:var(--font-serif)] cursor-pointer"
              onClick={() => { setView("list"); setEditingNote(null); }}
            >
              MathVault
            </h1>
            <p className="text-sm text-muted mt-0.5">
              {notes.length} equation{notes.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImport}
              className="p-2 text-muted hover:text-ink hover:bg-paper-dark rounded-lg transition-colors"
              title="Import"
            >
              <Upload size={18} />
            </button>
            <button
              onClick={() => exportNotes(notes)}
              className="p-2 text-muted hover:text-ink hover:bg-paper-dark rounded-lg transition-colors"
              title="Export backup"
            >
              <Download size={18} />
            </button>
            {view === "list" && (
              <button
                onClick={() => openEditor(null)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors"
              >
                <Plus size={16} />
                New
              </button>
            )}
          </div>
        </header>

        {view === "editor" ? (
          <NoteEditor
            note={editingNote}
            onSave={handleSave}
            onCancel={() => { setView("list"); setEditingNote(null); }}
          />
        ) : (
          <>
            {/* Search and Filters */}
            <div className="mb-6 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search equations, notes, tags... (Ctrl+K)"
                    className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2.5 border rounded-lg transition-colors ${
                    showFilters || hasActiveFilters
                      ? "border-accent text-accent bg-accent/5"
                      : "border-border text-muted hover:text-ink hover:bg-paper-dark"
                  }`}
                  title="Filters"
                >
                  <SlidersHorizontal size={16} />
                </button>
              </div>

              {showFilters && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-card border border-border rounded-lg fade-in">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="">All categories</option>
                    {usedCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="">All tags</option>
                    {allTags.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="updated">Recently updated</option>
                    <option value="created">Recently created</option>
                    <option value="title">Alphabetical</option>
                  </select>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-accent hover:text-accent-dark transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Notes Grid */}
            {filteredNotes.length === 0 ? (
              <div className="text-center py-20">
                {notes.length === 0 ? (
                  <>
                    <p className="text-2xl font-[family-name:var(--font-serif)] text-muted mb-2">
                      No equations yet
                    </p>
                    <p className="text-sm text-muted mb-6">
                      Start building your math reference library
                    </p>
                    <button
                      onClick={() => openEditor(null)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors"
                    >
                      <Plus size={16} />
                      Add your first equation
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-lg text-muted mb-1">No results</p>
                    <p className="text-sm text-muted">
                      Try different search terms or{" "}
                      <button onClick={clearFilters} className="text-accent hover:underline">
                        clear filters
                      </button>
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={openEditor}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* Keyboard shortcut hint */}
            <div className="fixed bottom-4 right-4 text-xs text-muted/50 hidden lg:block">
              Ctrl+N new &middot; Ctrl+K search
            </div>
          </>
        )}
      </div>
    </MathProvider>
  );
}
