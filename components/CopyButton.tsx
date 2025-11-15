// ===================================================================================
// FILE: components/CopyButton.tsx
// Small reusable copy button with transient “Copied” state.
// ===================================================================================
"use client";
import { useState } from "react";

export default function CopyButton({ text, label="Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/[0.06]"
      onClick={async ()=>{
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false), 1200); } catch {}
      }}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}