// ============================================================================
// FILE: app/dashboard/page.tsx
// CHANGE: Add “Export PDF” for single + per-batch item.
// (Replace your current dashboard file with this version.)
// ============================================================================
"use client";
import { useState } from "react";
import KeyManager from "@/components/KeyManager";
import Tooltip from "@/components/Tooltip";
import CopyButton from "@/components/CopyButton";
import ScoreCard from "@/components/ScoreCard";
import { scoreText, type Scores } from "@/app/lib/scoring";

type Result = { input: string; output: string; scores?: Scores };
type Provider = "openai" | "claude" | "watsonx";

const PACKS: Record<string,string> = {
  General: `We cut onboarding time from 4m to 1m 20s. Activation up 12% WoW.
---
One-click retry for failed payments; recovery 41% → 68%.
---
RAG search for docs; “API auth” tickets down 23%.`,
  Engineering: `Blue/green deploys for checkout; failed payments −11% WoW.
---
Edge caching anon pages; P95 1.9s → 540ms.
---
Contract tests killed 61% integration bugs.`,
  Marketing: `Outcome-first hero rewrite; CTR +24%.
---
JTBD selector; signup +12%.
---
Teach-don’t-pitch emails; open +8 pts.`,
  DataML: `Churn model leakage fixed; AUC 0.81 → 0.89.
---
EWMA anomalies; MTTR −29%.
---
Topic modeling informed roadmap; NPS +6.`,
  Industry: `Health: no-show rate −14% via scheduling.
---
Fintech: fraud FP −31% with per-merchant thresholds.
---
Edu: recommender completion +9%.`,
};

export default function Dashboard() {
  const [provider, setProvider] = useState<Provider>("openai");
  const [userKey, setUserKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [temp, setTemp] = useState(0.2);
  const [wxProject, setWxProject] = useState("");
  const [wxRegion, setWxRegion] = useState("us-south");

  const [text, setText] = useState("");
  const [question, setQuestion] = useState("Explain for execs in 3 bullets");
  const [singleOut, setSingleOut] = useState("");
  const [singleErr, setSingleErr] = useState("");
  const [singleScores, setSingleScores] = useState<Scores|undefined>();
  const [status, setStatus] = useState("");

  const [batchRaw, setBatchRaw] = useState("");
  const [batchRes, setBatchRes] = useState<Result[]>([]);
  const [batchErr, setBatchErr] = useState("");

  function buildBody(base:any) {
    if (provider === "watsonx") {
      base.watsonxProjectId = wxProject;
      base.watsonxRegion = wxRegion;
    }
    return base;
  }

  async function exportPdf(payload: {
    title: string; input: string; output: string; scores?: Scores; meta?: Record<string,string>;
  }, filenameHint?: string) {
    const r = await fetch("/api/export/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const j = await r.json().catch(()=>({}));
      alert(`PDF export failed: ${j.error || r.statusText}`);
      return;
    }
    const blob = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (filenameHint || "post-report") + ".pdf";
    a.click();
  }

  async function call(mode: "summarize" | "improve" | "ask") {
    setSingleErr(""); setSingleOut("⏳ Running…"); setStatus(""); setSingleScores(undefined);
    const r = await fetch("/api/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildBody({ mode, provider, text, question, model, temperature: temp, userKey }))
    });
    const j = await r.json();
    if (!r.ok) { setSingleErr(j.error || "Error"); setSingleOut(""); return; }
    setSingleOut(j.output || ""); setStatus(`Provider: ${j.provider} • ${j.ms ?? "–"} ms • cid: ${j.cid || "–"}`);
    setSingleScores(scoreText((j.output||"").slice(0,6000)));
  }

  async function runBatch() {
    setBatchErr(""); setBatchRes([]); setStatus("");
    const posts = batchRaw.split(/\r?\n---\r?\n/g).map(s=>s.trim()).filter(Boolean);
    if (!posts.length) { setBatchErr("No posts detected. Use --- on its own line."); return; }
    const r = await fetch("/api/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildBody({ mode:"batch", provider, posts, model, temperature: temp, userKey }))
    });
    const j = await r.json();
    if (!r.ok) { setBatchErr(j.error || "Error"); return; }
    const results: Result[] = (j.results||[]).map((it:any)=>({ ...it, scores: scoreText((it.output||"").slice(0,6000)) }));
    setBatchRes(results); setStatus(`Provider: ${j.provider} • ${j.ms ?? "–"} ms • cid: ${j.cid || "–"}`);
  }

  function copyAll() {
    const text = batchRes.map((r,i)=>`#${i+1}\nINPUT:\n${r.input}\n\nOUTPUT:\n${r.output}\n`).join("\n— — —\n");
    navigator.clipboard.writeText(text);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard (Free)</h1>
        <div className="flex flex-wrap items-center gap-3">
          <select className="rounded-xl bg-black/40 border border-white/15 px-4 py-2.5 text-sm md:w-40"
            value={provider}
            onChange={(e)=>{ 
              const p = e.target.value as Provider; 
              setProvider(p);
              setModel(p==="claude"?"claude-3-5-sonnet-20241022": p==="watsonx"?"ibm/granite-20b-multilingual":"gpt-4o-mini");
            }}>
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
            <option value="watsonx">Watsonx</option>
          </select>

          <input className="rounded-xl bg-black/40 border border-white/15 px-4 py-2.5 text-sm w-60"
            value={model} onChange={(e)=>setModel(e.target.value)} />
          <input className="rounded-xl bg-black/40 border border-white/15 px-4 py-2.5 text-sm w-24"
            value={temp} onChange={(e)=>setTemp(parseFloat(e.target.value)||0.2)} />

          {provider === "watsonx" && (
            <>
              <Tooltip tip={"IBM watsonx Project GUID.\nConsole → Projects → Details."}>
                <input className="rounded-xl bg-black/40 border border-white/15 px-4 py-2.5 text-sm w-60"
                  placeholder="Watsonx Project ID" value={wxProject} onChange={(e)=>setWxProject(e.target.value)} />
              </Tooltip>
              <Tooltip tip={"IBM region, e.g., us-south / eu-de / au-syd"}>
                <input className="rounded-xl bg-black/40 border border-white/15 px-4 py-2.5 text-sm w-40"
                  placeholder="Region (e.g., us-south)" value={wxRegion} onChange={(e)=>setWxRegion(e.target.value)} />
              </Tooltip>
            </>
          )}

          <KeyManager onChange={setUserKey} />
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_4px_30px_rgba(0,0,0,0.25)]">
          <div className="p-6 md:p-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Analyze Any Text</h3>
              <div className="flex items-center gap-2">
                <CopyButton text={singleOut} />
                <button
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/[0.06] disabled:opacity-40"
                  disabled={!singleOut}
                  onClick={() =>
                    exportPdf(
                      {
                        title: "Single Analysis Report",
                        input: text,
                        output: singleOut,
                        scores: singleScores,
                        meta: { Provider: provider, Model: model, Temperature: String(temp) },
                      },
                      "single-analysis"
                    )
                  }
                >
                  Export PDF
                </button>
              </div>
            </div>
            <textarea className="w-full min-h-[180px] rounded-xl bg-black/40 border border-white/15 px-4 py-3"
              placeholder="Paste a draft…" value={text} onChange={(e)=>setText(e.target.value)} />
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="rounded-xl bg-white text-black px-4 py-2.5 text-sm font-medium hover:bg-white/90" onClick={()=>call("summarize")}>Summarize</button>
              <input className="rounded-xl bg-black/40 border border-white/15 px-4 py-2.5 text-sm flex-1"
                value={question} onChange={(e)=>setQuestion(e.target.value)} placeholder="Ask anything about the text…" />
              <button className="rounded-xl border border-white/15 px-4 py-2.5 text-sm hover:bg-white/[0.06]" onClick={()=>call("ask")}>Ask</button>
              <button className="rounded-xl border border-white/15 px-4 py-2.5 text-sm hover:bg-white/[0.06]" onClick={()=>call("improve")}>Improve</button>
            </div>
            {singleErr && <div className="text-rose-400 text-sm">{singleErr}</div>}
            {singleOut && (
              <>
                <pre className="whitespace-pre-wrap bg-black/40 border border-white/10 rounded-xl p-4">{singleOut}</pre>
                {singleScores && <ScoreCard scores={singleScores} />}
              </>
            )}
          </div>
        </section>

        {/* Batch */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_4px_30px_rgba(0,0,0,0.25)]">
          <div className="p-6 md:p-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Batch Analyzer</h3>
              <div className="flex items-center gap-2">
                <select className="rounded-lg bg-black/40 border border-white/15 px-3 py-1.5 text-xs"
                  onChange={(e)=>setBatchRaw(PACKS[e.target.value] || "")}>
                  <option value="">Load Pack…</option>
                  {Object.keys(PACKS).map(k=><option key={k} value={k}>{k}</option>)}
                </select>
                <button className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/[0.06]"
                  onClick={()=>setBatchRaw(b=>b || PACKS.General)}>Load Samples</button>
                <button className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/[0.06]" disabled={!batchRes.length} onClick={copyAll}>Copy All</button>
              </div>
            </div>
            <p className="text-sm text-zinc-400">Separate posts with a line containing <code>---</code></p>
            <textarea className="w-full min-h-[180px] rounded-xl bg-black/40 border border-white/15 px-4 py-3"
              placeholder={"Shipped X…\n---\nRolled out Y…\n---\nMigrated Z…"}
              value={batchRaw} onChange={(e)=>setBatchRaw(e.target.value)} />
            <div className="flex flex-wrap items-center gap-3">
              <button className="rounded-xl bg-white text-black px-4 py-2.5 text-sm font-medium hover:bg-white/90" onClick={runBatch}>Run Batch</button>
              <button className="rounded-xl border border-white/15 px-4 py-2.5 text-sm hover:bg-white/[0.06] disabled:opacity-40"
                disabled={!batchRes.length}
                onClick={()=>{
                  const csv = batchRes.map(r=>`"${r.input.replaceAll('"','""')}","${r.output.replaceAll('"','""')}"`).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "batch_results.csv"; a.click();
                }}
              >Download CSV</button>
            </div>
            {!!batchRes.length && (
              <div className="space-y-3">
                {batchRes.map((r,i)=>(
                  <details key={i} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <summary className="cursor-pointer flex items-center justify-between">
                      <span>Post #{i+1}</span>
                      <div className="flex items-center gap-2">
                        <CopyButton text={r.output} />
                        <button
                          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/[0.06]"
                          onClick={() =>
                            exportPdf(
                              {
                                title: `Batch Report #${i+1}`,
                                input: r.input,
                                output: r.output,
                                scores: r.scores,
                                meta: { Provider: provider, Model: model, Temperature: String(temp) },
                              },
                              `batch-${i+1}`
                            )
                          }
                        >
                          Export PDF
                        </button>
                      </div>
                    </summary>
                    <p className="text-zinc-400 mt-2 whitespace-pre-wrap">{r.input}</p>
                    <pre className="mt-3 whitespace-pre-wrap bg-black/40 border border-white/10 rounded-xl p-3">{r.output}</pre>
                    {r.scores && <div className="mt-3"><ScoreCard scores={r.scores} /></div>}
                  </details>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {status && <div className="mt-6 text-xs text-zinc-400">{status}</div>}
    </main>
  );
}



