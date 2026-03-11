"use client";

import { MathJax, MathJaxContext } from "better-react-mathjax";
import { ReactNode } from "react";

const config = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
  },
};

export function MathProvider({ children }: { children: ReactNode }) {
  return (
    <MathJaxContext config={config} version={3}>
      {children}
    </MathJaxContext>
  );
}

export function MathBlock({ latex }: { latex: string }) {
  if (!latex.trim()) return null;

  const display = `$$${latex}$$`;

  return (
    <div className="py-3 px-4 overflow-x-auto">
      <MathJax dynamic>{display}</MathJax>
    </div>
  );
}

export function MathInline({ latex }: { latex: string }) {
  if (!latex.trim()) return null;
  return <MathJax dynamic inline>{`$${latex}$`}</MathJax>;
}
