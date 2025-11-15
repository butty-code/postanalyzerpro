"use client";
import { useEffect, useState } from "react";

export default function Health() {
  const [api, setApi] = useState<null|boolean>(null);
  const [tw, setTw] = useState<boolean>(false);
  const donate = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_PAYPAL_DONATE_URL || "") : "";

  useEffect(() => {
    fetch("/api/ping").then(r=>r.json()).then(()=>setApi(true)).catch(()=>setApi(false));
    // Tailwind check: look for applied style on a test class
    const el = document.createElement("div");
    el.className = "p-2 rounded-xl bg-white/10"; // should apply styles
    document.body.appendChild(el);
    const has = getComputedStyle(el).borderRadius !== "0px";
    setTw(has);
    document.body.removeChild(el);
  }, []);

  const Dot = ({ok}:{ok:boolean|null}) => <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok===null?"bg-amber-400":ok?"bg-green-500":"bg-rose-500"}`} />;
  const Row = ({name, ok}:{name:string; ok:boolean|null}) => (
    <div className="flex items-center gap-2">
      <Dot ok={ok} /><div>{name}</div>
    </div>
  );

  return (
    <main className="mx-auto max-w-xl px-6 py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Health</h1>
      <Row name="API /api/ping" ok={api} />
      <Row name="Tailwind active" ok={tw} />
      <Row name="Donate URL present" ok={!!donate} />
      <div className="text-xs text-zinc-500">Donate URL: {donate || "(not set)"} </div>
    </main>
  );
}

