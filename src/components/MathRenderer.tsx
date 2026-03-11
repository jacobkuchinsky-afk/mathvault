"use client";

import { MathJax, MathJaxContext } from "better-react-mathjax";
import { ReactNode } from "react";

const config = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]],
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
  return (
    <div className="py-3 px-4 overflow-x-auto">
      <MathJax dynamic>{`$$${latex}$$`}</MathJax>
    </div>
  );
}

export function RichText({ text }: { text: string }) {
  if (!text.trim()) return null;
  const hasMath = text.includes("$");
  if (!hasMath) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }
  return (
    <MathJax dynamic>
      <span className="whitespace-pre-wrap">{text}</span>
    </MathJax>
  );
}
