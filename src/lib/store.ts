export interface MathNote {
  id: string;
  title: string;
  latex: string;
  notes: string;
  tags: string[];
  category: string;
  collection: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "mathvault_notes";
const COLLECTIONS_KEY = "mathvault_collections";
const PREFS_KEY = "mathvault_prefs";

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export function loadNotes(): MathNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const notes = raw ? JSON.parse(raw) : [];
    return notes.map((n: Partial<MathNote>) => ({
      collection: "",
      pinned: false,
      ...n,
    }));
  } catch {
    return [];
  }
}

export function saveNotes(notes: MathNote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function loadCollections(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCollections(collections: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
}

export interface Prefs {
  darkMode: boolean;
  sortBy: "updated" | "created" | "title";
  viewMode: "cards" | "compact";
}

export function loadPrefs(): Prefs {
  if (typeof window === "undefined") return { darkMode: false, sortBy: "updated", viewMode: "cards" };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { darkMode: false, sortBy: "updated", viewMode: "cards", ...JSON.parse(raw) } : { darkMode: false, sortBy: "updated", viewMode: "cards" };
  } catch {
    return { darkMode: false, sortBy: "updated", viewMode: "cards" };
  }
}

export function savePrefs(prefs: Prefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function exportNotes(notes: MathNote[]) {
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mathvault-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function searchNotes(notes: MathNote[], query: string): MathNote[] {
  if (!query.trim()) return notes;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return notes.filter((note) => {
    const searchable = [note.title, note.latex, note.notes, note.category, note.collection, ...note.tags].join(" ").toLowerCase();
    return terms.every((term) => searchable.includes(term));
  });
}

export const CATEGORIES = [
  "Algebra",
  "Calculus",
  "Geometry",
  "Trigonometry",
  "Statistics",
  "Linear Algebra",
  "Discrete Math",
  "Number Theory",
  "Differential Equations",
  "Other",
];

export const LATEX_REFERENCE: { section: string; items: { label: string; tex: string }[] }[] = [
  {
    section: "Greek Letters",
    items: [
      { label: "alpha", tex: "\\alpha" },
      { label: "beta", tex: "\\beta" },
      { label: "gamma", tex: "\\gamma" },
      { label: "delta", tex: "\\delta" },
      { label: "epsilon", tex: "\\epsilon" },
      { label: "theta", tex: "\\theta" },
      { label: "lambda", tex: "\\lambda" },
      { label: "mu", tex: "\\mu" },
      { label: "pi", tex: "\\pi" },
      { label: "sigma", tex: "\\sigma" },
      { label: "phi", tex: "\\phi" },
      { label: "omega", tex: "\\omega" },
      { label: "Delta", tex: "\\Delta" },
      { label: "Sigma", tex: "\\Sigma" },
      { label: "Omega", tex: "\\Omega" },
    ],
  },
  {
    section: "Operators",
    items: [
      { label: "fraction", tex: "\\frac{a}{b}" },
      { label: "square root", tex: "\\sqrt{x}" },
      { label: "nth root", tex: "\\sqrt[n]{x}" },
      { label: "power", tex: "x^{n}" },
      { label: "subscript", tex: "x_{i}" },
      { label: "sum", tex: "\\sum_{i=0}^{n}" },
      { label: "product", tex: "\\prod_{i=1}^{n}" },
      { label: "integral", tex: "\\int_{a}^{b}" },
      { label: "limit", tex: "\\lim_{x \\to \\infty}" },
      { label: "derivative", tex: "\\frac{dy}{dx}" },
      { label: "partial", tex: "\\frac{\\partial f}{\\partial x}" },
    ],
  },
  {
    section: "Relations",
    items: [
      { label: "not equal", tex: "\\neq" },
      { label: "approx", tex: "\\approx" },
      { label: "less equal", tex: "\\leq" },
      { label: "greater equal", tex: "\\geq" },
      { label: "much less", tex: "\\ll" },
      { label: "much greater", tex: "\\gg" },
      { label: "proportional", tex: "\\propto" },
      { label: "equivalent", tex: "\\equiv" },
      { label: "in", tex: "\\in" },
      { label: "subset", tex: "\\subset" },
      { label: "implies", tex: "\\Rightarrow" },
      { label: "iff", tex: "\\Leftrightarrow" },
    ],
  },
  {
    section: "Structures",
    items: [
      { label: "matrix 2x2", tex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
      { label: "cases", tex: "\\begin{cases} a & \\text{if } x > 0 \\\\ b & \\text{otherwise} \\end{cases}" },
      { label: "aligned", tex: "\\begin{aligned} a &= b + c \\\\ &= d \\end{aligned}" },
      { label: "binomial", tex: "\\binom{n}{k}" },
      { label: "vector", tex: "\\vec{v}" },
      { label: "hat", tex: "\\hat{x}" },
      { label: "overline", tex: "\\overline{AB}" },
      { label: "underbrace", tex: "\\underbrace{a+b+c}_{\\text{sum}}" },
    ],
  },
  {
    section: "Symbols",
    items: [
      { label: "infinity", tex: "\\infty" },
      { label: "plus minus", tex: "\\pm" },
      { label: "times", tex: "\\times" },
      { label: "dot", tex: "\\cdot" },
      { label: "divide", tex: "\\div" },
      { label: "therefore", tex: "\\therefore" },
      { label: "for all", tex: "\\forall" },
      { label: "exists", tex: "\\exists" },
      { label: "empty set", tex: "\\emptyset" },
      { label: "angle", tex: "\\angle" },
      { label: "degrees", tex: "^{\\circ}" },
    ],
  },
];
