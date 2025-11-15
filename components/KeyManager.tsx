"use client";
import { useEffect, useState } from "react";
export default function KeyManager({ onChange }: { onChange: (k: string) => void }) {
  const [key, setKey] = useState("");
  useEffect(() => { const k = localStorage.getItem("userKey") || ""; setKey(k); onChange(k); }, [onChange]);
  return (
    <div className="flex items-center gap-3">
      <input
        className="rounded-xl bg-black/40 border border-white/15 px-4 py-2.5 text-sm w-[28rem] max-w-full"
        value={key}
        onChange={(e) => { const v = e.target.value; setKey(v); localStorage.setItem("userKey", v); onChange(v); }}
        placeholder="(optional) paste your OpenAI/Claude/Watsonx key"
      />
      <span className={`text-xs rounded-md px-2 py-1 ${key ? "bg-green-700" : "bg-red-700"} text-white`}>Key: {key ? "Present" : "Missing"}</span>
    </div>
  );
}

