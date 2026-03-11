"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Plus, Download, Upload, SlidersHorizontal, X, Moon, Sun, Folder, LayoutList, LayoutGrid, BookOpen } from "lucide-react";
import { MathProvider } from "@/components/MathRenderer";
import NoteEditor from "@/components/NoteEditor";
import NoteCard from "@/components/NoteCard";
import LatexReference from "@/components/LatexReference";
import SyncSettings from "@/components/SyncSettings";
import {
  MathNote, loadNotes, saveNotes, exportNotes, searchNotes, CATEGORIES,
  loadCollections, saveCollections, loadPrefs, savePrefs, Prefs,
} from "@/lib/store";
import { getGistConfig, saveGistConfig, syncNotes } from "@/lib/gist-sync";

type View = "list" | "editor";

export default function Home() {
  const [notes, setNotes] = useState<MathNote[]>([]);
  const [view, setView] = useState<View>("list");
  const [editingNote, setEditingNote] = useState<MathNote | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCollection, setFilterCollection] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [prefs, setPrefs] = useState<Prefs>({ darkMode: false, sortBy: "updated", viewMode: "cards" });
  const [showFilters, setShowFilters] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [collections, setCollections] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [gistConnected, setGistConnected] = useState(false);

  useEffect(() => {
    const localNotes = loadNotes();
    setNotes(localNotes);
    setCollections(loadCollections());
    setPrefs(loadPrefs());
    setGistConnected(!!getGistConfig()?.token);
    setLoaded(true);

    const defaultGistId = process.env.NEXT_PUBLIC_DEFAULT_GIST_ID;
    if (defaultGistId && !localStorage.getItem("mathvault_gist_id")) {
      localStorage.setItem("mathvault_gist_id", defaultGistId);
    }

    const config = getGistConfig();
    if (config?.token && config?.gistId) {
      doSync(localNotes);
    }
  }, []);

  async function doSync(currentNotes?: MathNote[]) {
    const config = getGistConfig();
    if (!config?.token) return;
    setSyncing(true);
    try {
      const result = await syncNotes(config.token, config.gistId, currentNotes || notes);
      if (result.gistId !== config.gistId) {
        saveGistConfig(config.token, result.gistId);
      }
      setNotes(result.notes);
      setGistConnected(true);
      setLastSync(Date.now());
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (!loaded) return;
    saveNotes(notes);
    const cols = [...new Set(notes.map((n) => n.collection).filter(Boolean))];
    setCollections(cols);
    saveCollections(cols);
  }, [notes, loaded]);

  useEffect(() => {
    if (loaded) savePrefs(prefs);
  }, [prefs, loaded]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", prefs.darkMode);
  }, [prefs.darkMode]);

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
    const s = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [notes]);

  const usedCategories = useMemo(() => {
    const cats = new Set(notes.map((n) => n.category));
    return CATEGORIES.filter((c) => cats.has(c));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = searchNotes(notes, searchQuery);
    if (filterCategory) result = result.filter((n) => n.category === filterCategory);
    if (filterCollection) result = result.filter((n) => n.collection === filterCollection);
    if (filterTag) result = result.filter((n) => n.tags.includes(filterTag));

    const pinned = result.filter((n) => n.pinned);
    const unpinned = result.filter((n) => !n.pinned);

    const sortFn = (a: MathNote, b: MathNote) => {
      if (prefs.sortBy === "updated") return b.updatedAt - a.updatedAt;
      if (prefs.sortBy === "created") return b.createdAt - a.createdAt;
      return a.title.localeCompare(b.title);
    };

    return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)];
  }, [notes, searchQuery, filterCategory, filterCollection, filterTag, prefs.sortBy]);

  const openEditor = useCallback((note: MathNote | null) => {
    setEditingNote(note);
    setView("editor");
  }, []);

  function handleSave(note: MathNote) {
    let updated: MathNote[] = [];
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === note.id);
      if (idx >= 0) { updated = [...prev]; updated[idx] = note; }
      else { updated = [note, ...prev]; }
      return updated;
    });
    setView("list");
    setEditingNote(null);
    if (gistConnected) setTimeout(() => doSync(updated), 500);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  function handleTogglePin(id: string) {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n));
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
              if (!merged.find((m) => m.id === n.id)) merged.push(n);
            }
            setNotes(merged);
          }
        } catch { alert("Invalid file format"); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function clearFilters() {
    setFilterCategory("");
    setFilterCollection("");
    setFilterTag("");
    setSearchQuery("");
  }

  const hasActiveFilters = filterCategory || filterCollection || filterTag || searchQuery;

  if (!loaded) return <div className="flex items-center justify-center min-h-screen"><div className="text-muted">Loading...</div></div>;

  return (
    <MathProvider>
      <div className="min-h-screen transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <header className="flex items-center justify-between mb-6">
            <div
              className="cursor-pointer"
              onClick={() => { setView("list"); setEditingNote(null); clearFilters(); }}
            >
              <h1 className="text-2xl font-bold tracking-tight font-[family-name:var(--font-serif)]">
                MathVault
              </h1>
              <p className="text-xs text-muted mt-0.5">
                {notes.length} equation{notes.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <SyncSettings
                onSync={() => doSync()}
                syncing={syncing}
                lastSync={lastSync}
                connected={gistConnected}
              />
              <button
                onClick={() => setShowReference(!showReference)}
                className={`p-2 rounded-lg transition-colors ${showReference ? "bg-accent/10 text-accent" : "text-muted hover:text-ink hover:bg-paper-dark"}`}
                title="LaTeX Reference"
              >
                <BookOpen size={18} />
              </button>
              <button
                onClick={() => setPrefs({ ...prefs, darkMode: !prefs.darkMode })}
                className="p-2 text-muted hover:text-ink hover:bg-paper-dark rounded-lg transition-colors"
                title={prefs.darkMode ? "Light mode" : "Dark mode"}
              >
                {prefs.darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={handleImport} className="p-2 text-muted hover:text-ink hover:bg-paper-dark rounded-lg transition-colors" title="Import">
                <Upload size={18} />
              </button>
              <button onClick={() => exportNotes(notes)} className="p-2 text-muted hover:text-ink hover:bg-paper-dark rounded-lg transition-colors" title="Export">
                <Download size={18} />
              </button>
              {view === "list" && (
                <button onClick={() => openEditor(null)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors ml-1">
                  <Plus size={16} /> New
                </button>
              )}
            </div>
          </header>

          <div className="flex gap-6">
            {/* Sidebar - collections and reference */}
            {view === "list" && (collections.length > 0 || showReference) && (
              <aside className="hidden lg:block w-52 shrink-0 space-y-6">
                {collections.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted uppercase tracking-wider px-1 mb-2">Collections</h3>
                    <div className="space-y-0.5">
                      <button
                        onClick={() => setFilterCollection("")}
                        className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-lg transition-colors ${!filterCollection ? "bg-accent/10 text-accent-dark font-medium" : "text-muted hover:text-ink hover:bg-paper-dark"}`}
                      >
                        <Folder size={14} /> All
                        <span className="ml-auto text-xs opacity-60">{notes.length}</span>
                      </button>
                      {collections.map((c) => {
                        const count = notes.filter((n) => n.collection === c).length;
                        return (
                          <button
                            key={c}
                            onClick={() => setFilterCollection(filterCollection === c ? "" : c)}
                            className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-lg transition-colors truncate ${filterCollection === c ? "bg-accent/10 text-accent-dark font-medium" : "text-muted hover:text-ink hover:bg-paper-dark"}`}
                          >
                            <Folder size={14} /> {c}
                            <span className="ml-auto text-xs opacity-60">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {showReference && <LatexReference />}
              </aside>
            )}

            {/* Main content */}
            <main className="flex-1 min-w-0">
              {view === "editor" ? (
                <NoteEditor
                  note={editingNote}
                  collections={collections}
                  onSave={handleSave}
                  onCancel={() => { setView("list"); setEditingNote(null); }}
                />
              ) : (
                <>
                  {/* Search bar */}
                  <div className="mb-5 space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          id="search-input"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search equations, notes, tags... (Ctrl+K)"
                          className="w-full pl-9 pr-8 py-2.5 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all text-sm"
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setPrefs({ ...prefs, viewMode: prefs.viewMode === "cards" ? "compact" : "cards" })}
                        className="p-2.5 border border-border text-muted hover:text-ink hover:bg-paper-dark rounded-lg transition-colors"
                        title={prefs.viewMode === "cards" ? "Compact view" : "Card view"}
                      >
                        {prefs.viewMode === "cards" ? <LayoutList size={16} /> : <LayoutGrid size={16} />}
                      </button>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 border rounded-lg transition-colors ${showFilters || hasActiveFilters ? "border-accent text-accent bg-accent/5" : "border-border text-muted hover:text-ink hover:bg-paper-dark"}`}
                        title="Filters"
                      >
                        <SlidersHorizontal size={16} />
                      </button>
                    </div>

                    {showFilters && (
                      <div className="flex flex-wrap items-center gap-3 p-3 bg-card border border-border rounded-lg fade-in">
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-1.5 text-sm border border-border rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-accent/30">
                          <option value="">All categories</option>
                          {usedCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="px-3 py-1.5 text-sm border border-border rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-accent/30">
                          <option value="">All tags</option>
                          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select value={prefs.sortBy} onChange={(e) => setPrefs({ ...prefs, sortBy: e.target.value as Prefs["sortBy"] })} className="px-3 py-1.5 text-sm border border-border rounded-lg bg-paper focus:outline-none focus:ring-2 focus:ring-accent/30">
                          <option value="updated">Recently updated</option>
                          <option value="created">Recently created</option>
                          <option value="title">Alphabetical</option>
                        </select>
                        {hasActiveFilters && (
                          <button onClick={clearFilters} className="text-xs text-accent hover:text-accent-dark transition-colors">
                            Clear all
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notes list */}
                  {filteredNotes.length === 0 ? (
                    <div className="text-center py-16">
                      {notes.length === 0 ? (
                        <>
                          <p className="text-2xl font-[family-name:var(--font-serif)] text-muted mb-2">No equations yet</p>
                          <p className="text-sm text-muted mb-6">Start building your math reference library</p>
                          <button onClick={() => openEditor(null)} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors">
                            <Plus size={16} /> Add your first equation
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-lg text-muted mb-1">No results</p>
                          <p className="text-sm text-muted">
                            Try different search terms or{" "}
                            <button onClick={clearFilters} className="text-accent hover:underline">clear filters</button>
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className={prefs.viewMode === "compact" ? "space-y-1.5" : "space-y-4"}>
                      {filteredNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onEdit={openEditor}
                          onDelete={handleDelete}
                          onTogglePin={handleTogglePin}
                          compact={prefs.viewMode === "compact"}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>

          <div className="fixed bottom-3 right-4 text-[11px] text-muted/40 hidden lg:block">
            Ctrl+N new / Ctrl+K search
          </div>
        </div>
      </div>
    </MathProvider>
  );
}
