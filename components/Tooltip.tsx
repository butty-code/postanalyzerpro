"use client";
import { useState } from "react";

export default function Tooltip({ tip, children }: { tip: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex"
      onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      {children}
      {open && (
        <span className="absolute z-10 -top-2 left-1/2 -translate-x-1/2 -translate-y-full rounded-md bg-black/90 border border-white/10 px-2 py-1 text-xs text-zinc-200 whitespace-pre">
          {tip}
        </span>
      )}
    </span>
  );
}

