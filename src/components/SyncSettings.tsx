"use client";

import { useState } from "react";
import { Cloud, CloudOff, Loader2, Check, X } from "lucide-react";
import { getGistConfig, saveGistConfig, clearGistConfig } from "@/lib/gist-sync";

interface SyncSettingsProps {
  onSync: () => Promise<void>;
  syncing: boolean;
  lastSync: number | null;
  connected: boolean;
}

export default function SyncSettings({ onSync, syncing, lastSync, connected }: SyncSettingsProps) {
  const [showSetup, setShowSetup] = useState(false);
  const [token, setToken] = useState("");
  const [gistId, setGistId] = useState("");

  function handleConnect() {
    if (!token.trim()) return;
    saveGistConfig(token.trim(), gistId.trim());
    setShowSetup(false);
    setToken("");
    setGistId("");
    onSync();
  }

  function handleDisconnect() {
    clearGistConfig();
    setShowSetup(false);
    window.location.reload();
  }

  if (connected) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-success bg-success/10 rounded-lg hover:bg-success/20 transition-colors disabled:opacity-50"
          title={lastSync ? `Last synced ${new Date(lastSync).toLocaleTimeString()}` : "Sync now"}
        >
          {syncing ? <Loader2 size={13} className="animate-spin" /> : <Cloud size={13} />}
          Synced
        </button>
        <button
          onClick={handleDisconnect}
          className="p-1.5 text-muted hover:text-danger rounded transition-colors"
          title="Disconnect Gist"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="flex items-center gap-2 fade-in">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="GitHub token"
          className="w-32 px-2 py-1 text-xs border border-border rounded bg-card focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
        <input
          type="text"
          value={gistId}
          onChange={(e) => setGistId(e.target.value)}
          placeholder="Gist ID (optional)"
          className="w-28 px-2 py-1 text-xs border border-border rounded bg-card focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
        <button onClick={handleConnect} className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent-dark transition-colors">
          <Check size={12} />
        </button>
        <button onClick={() => setShowSetup(false)} className="p-1 text-muted hover:text-ink">
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowSetup(true)}
      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted hover:text-ink border border-border rounded-lg hover:bg-paper-dark transition-colors"
      title="Connect GitHub Gist for cloud sync"
    >
      <CloudOff size={13} />
      Sync
    </button>
  );
}
