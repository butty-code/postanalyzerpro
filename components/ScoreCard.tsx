// ===================================================================================
// FILE: components/ScoreCard.tsx
// Compact visual bars + rationale bullets.
// ===================================================================================
"use client";
import type { Scores } from "@/app/lib/scoring";

export default function ScoreCard({ scores }: { scores: Scores }) {
  const items = [
    { k: "Readability", v: scores.readability },
    { k: "Clarity", v: scores.clarity },
    { k: "Hook", v: scores.hook },
    { k: "CTA", v: scores.cta },
    { k: "Tone", v: scores.tone },
  ];
  const badge = (n:number) => n>=80 ? "text-green-300" : n>=60 ? "text-amber-300" : "text-rose-300";
  const bar = (n:number) => (
    <div className="h-2 w-full rounded bg-white/10">
      <div className="h-2 rounded" style={{ width: `${n}%`, background: n>=80?"#22c55e":n>=60?"#f59e0b":"#ef4444" }} />
    </div>
  );
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-sm text-zinc-400">Score Card</div>
        <div className={`text-lg font-semibold ${badge(scores.overall)}`}>Overall {scores.overall}/100</div>
      </div>
      <div className="space-y-2">
        {items.map(it=>(
          <div key={it.k} className="grid grid-cols-3 gap-3 items-center">
            <div className="text-sm text-zinc-300">{it.k}</div>
            <div className="col-span-2 flex items-center gap-3">
              {bar(it.v)}
              <span className="text-xs text-zinc-400 w-10">{it.v}</span>
            </div>
          </div>
        ))}
      </div>
      {!!scores.why.length && (
        <ul className="mt-3 text-xs text-zinc-400 list-disc pl-5 space-y-1">
          {scores.why.slice(0,3).map((w,i)=><li key={i}>{w}</li>)}
        </ul>
      )}
    </div>
  );
}


