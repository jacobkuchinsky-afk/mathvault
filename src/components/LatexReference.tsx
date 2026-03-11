"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { MathJax } from "better-react-mathjax";
import { LATEX_REFERENCE } from "@/lib/store";

interface LatexReferenceProps {
  onInsert?: (tex: string) => void;
}

export default function LatexReference({ onInsert }: LatexReferenceProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["Greek Letters"]));
  const [copiedTex, setCopiedTex] = useState<string | null>(null);

  function toggleSection(section: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function handleCopy(tex: string) {
    navigator.clipboard.writeText(tex);
    setCopiedTex(tex);
    setTimeout(() => setCopiedTex(null), 1200);
    onInsert?.(tex);
  }

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-muted uppercase tracking-wider px-1 mb-2">LaTeX Reference</h3>
      {LATEX_REFERENCE.map((section) => (
        <div key={section.section}>
          <button
            onClick={() => toggleSection(section.section)}
            className="flex items-center gap-1 w-full px-1 py-1.5 text-sm text-left hover:bg-paper-dark rounded transition-colors"
          >
            {openSections.has(section.section) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="font-medium">{section.section}</span>
          </button>
          {openSections.has(section.section) && (
            <div className="grid grid-cols-2 gap-1 pl-5 pr-1 pb-2">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleCopy(item.tex)}
                  className="flex items-center justify-between gap-1 px-2 py-1 text-xs rounded hover:bg-paper-dark transition-colors group text-left"
                  title={item.tex}
                >
                  <span className="truncate text-muted group-hover:text-ink">{item.label}</span>
                  {copiedTex === item.tex ? (
                    <Check size={10} className="text-success shrink-0" />
                  ) : (
                    <Copy size={10} className="text-muted/0 group-hover:text-muted shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
