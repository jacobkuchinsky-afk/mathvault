import { MathNote } from "./store";

const GIST_ID_KEY = "mathvault_gist_id";
const GIST_TOKEN_KEY = "mathvault_gist_token";
const FILENAME = "mathvault-notes.json";

export function getGistConfig(): { token: string; gistId: string } | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(GIST_TOKEN_KEY);
  const gistId = localStorage.getItem(GIST_ID_KEY);
  if (!token) return null;
  return { token, gistId: gistId || "" };
}

export function saveGistConfig(token: string, gistId: string) {
  localStorage.setItem(GIST_TOKEN_KEY, token);
  localStorage.setItem(GIST_ID_KEY, gistId);
}

export function clearGistConfig() {
  localStorage.removeItem(GIST_TOKEN_KEY);
  localStorage.removeItem(GIST_ID_KEY);
}

async function gistFetch(url: string, token: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text.substring(0, 200)}`);
  }
  return res.json();
}

export async function createGist(token: string, notes: MathNote[]): Promise<string> {
  const data = await gistFetch("https://api.github.com/gists", token, {
    method: "POST",
    body: JSON.stringify({
      description: "MathVault - Math equation storage",
      public: false,
      files: {
        [FILENAME]: { content: JSON.stringify(notes, null, 2) },
      },
    }),
  });
  return data.id;
}

export async function pushToGist(token: string, gistId: string, notes: MathNote[]): Promise<void> {
  await gistFetch(`https://api.github.com/gists/${gistId}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      files: {
        [FILENAME]: { content: JSON.stringify(notes, null, 2) },
      },
    }),
  });
}

export async function pullFromGist(token: string, gistId: string): Promise<MathNote[]> {
  const data = await gistFetch(`https://api.github.com/gists/${gistId}`, token);
  const file = data.files?.[FILENAME];
  if (!file) return [];
  const content = file.content;
  try {
    const notes = JSON.parse(content);
    return Array.isArray(notes) ? notes : [];
  } catch {
    return [];
  }
}

export async function syncNotes(
  token: string,
  gistId: string,
  localNotes: MathNote[]
): Promise<{ notes: MathNote[]; gistId: string }> {
  if (!gistId) {
    const newId = await createGist(token, localNotes);
    return { notes: localNotes, gistId: newId };
  }

  const remoteNotes = await pullFromGist(token, gistId);

  const merged = mergeNotes(localNotes, remoteNotes);

  await pushToGist(token, gistId, merged);

  return { notes: merged, gistId };
}

function mergeNotes(local: MathNote[], remote: MathNote[]): MathNote[] {
  const byId = new Map<string, MathNote>();

  for (const n of remote) byId.set(n.id, n);

  for (const n of local) {
    const existing = byId.get(n.id);
    if (!existing || n.updatedAt >= existing.updatedAt) {
      byId.set(n.id, n);
    }
  }

  return Array.from(byId.values());
}
