"use client";

import { useState } from "react";

export function ParentSummaryExport({
  summaryMarkdown,
  studentName,
}: {
  summaryMarkdown: string;
  studentName: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(summaryMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadMarkdown() {
    const blob = new Blob([summaryMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${studentName.replace(/\s+/g, "-").toLowerCase()}-summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copyToClipboard} className="btn btn-primary text-sm">
          {copied ? "Copied!" : "Copy to clipboard"}
        </button>
        <button type="button" onClick={downloadMarkdown} className="btn btn-secondary text-sm">
          Download .md
        </button>
      </div>
      <pre className="max-h-96 overflow-auto rounded-lg border border-[var(--color-border)] bg-slate-50 p-4 text-xs whitespace-pre-wrap text-slate-700">
        {summaryMarkdown}
      </pre>
    </div>
  );
}
