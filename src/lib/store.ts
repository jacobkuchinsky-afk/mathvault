export interface MathNote {
  id: string;
  title: string;
  latex: string;
  notes: string;
  tags: string[];
  category: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "mathvault_notes";

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export function loadNotes(): MathNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes: MathNote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
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
  const q = query.toLowerCase();
  const terms = q.split(/\s+/).filter(Boolean);

  return notes.filter((note) => {
    const searchable = [
      note.title,
      note.latex,
      note.notes,
      note.category,
      ...note.tags,
    ]
      .join(" ")
      .toLowerCase();

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
