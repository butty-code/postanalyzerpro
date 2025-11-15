// ============================================================================
// FILE: app/api/analyze/route.ts  (add schema + pass through to adapter)
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callLLM, mock, type Provider } from "@/app/lib/providers";

export const runtime = "nodejs";

const Body = z.object({
  mode: z.enum(["summarize", "improve", "ask", "batch"]),
  provider: z.enum(["openai", "claude", "watsonx"]).optional().default("openai"),
  text: z.string().optional(),
  posts: z.array(z.string()).optional(),
  question: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional().default(0.2),
  userKey: z.string().optional(),
  watsonxProjectId: z.string().optional(),   // NEW
  watsonxRegion: z.string().optional(),      // NEW
});

const MAX_POST_LEN = 8000;
const MAX_BATCH = 50;

function sysPrompt() {
  return "You are a concise social writing analyst. Be direct, factual, tactical.";
}
function buildUserPrompt(mode: string, text: string, q?: string) {
  if (mode === "summarize") return `Summarize in 1–2 sentences, then 3 bullets. No hashtags/links.\n\n${text}`;
  if (mode === "improve") return `Propose 6 concrete edits (short, testable), 2 hooks, and 1 CTA.\n\n${text}`;
  const qq = q?.trim() || "Explain for executives in 3 bullets.";
  return `Post:\n${text}\n\nQuestion:\n${qq}`;
}

function json(body:any, status=200) {
  return new NextResponse(JSON.stringify(body), { status, headers: { "Content-Type":"application/json", "x-correlation-id": body?.cid || "" } });
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const cid = crypto.randomUUID();
  try {
    const b = Body.parse(await req.json());

    // SINGLE
    if (b.mode !== "batch") {
      const text = (b.text || "").trim();
      if (!text) return json({ error: "Empty text", cid }, 400);
      if (text.length > MAX_POST_LEN) return json({ error: "Text too long", cid }, 413);

      const provider: Provider = (b.provider || "openai") as Provider;
      const key = b.userKey ||
        (provider === "claude" ? process.env.ANTHROPIC_API_KEY :
         provider === "watsonx" ? process.env.WATSONX_API_KEY :
         process.env.OPENAI_API_KEY) || "";
      const model = b.model || (provider==="claude"?"claude-3-5-sonnet-20241022": provider==="watsonx"?"ibm/granite-20b-multilingual":"gpt-4o-mini");

      const user = buildUserPrompt(b.mode, text, b.question);
      try {
        const { output, provider: used } = await callLLM({
          provider: key ? provider : "mock",
          apiKey: key,
          model,
          temperature: b.temperature ?? 0.2,
          system: sysPrompt(),
          user,
          watsonxProjectId: b.watsonxProjectId,     // pass-through
          watsonxRegion: b.watsonxRegion,           // pass-through
        });
        return json({ output, provider: used, ms: Date.now()-t0, cid });
      } catch (err:any) {
        return json({ output: mock(text), provider: "mock-fallback", warning: err?.message || "Provider failed", ms: Date.now()-t0, cid });
      }
    }

    // BATCH
    const posts = Array.isArray(b.posts) ? b.posts : [];
    if (!posts.length) return json({ error: "No posts", cid }, 400);
    if (posts.length > MAX_BATCH) return json({ error: "Batch too large", cid }, 413);
    if (posts.some(p => (p||"").length > MAX_POST_LEN)) return json({ error: "One post too long", cid }, 413);

    const provider: Provider = (b.provider || "openai") as Provider;
    const key = b.userKey ||
      (provider === "claude" ? process.env.ANTHROPIC_API_KEY :
       provider === "watsonx" ? process.env.WATSONX_API_KEY :
       process.env.OPENAI_API_KEY) || "";
    const model = b.model || (provider==="claude"?"claude-3-5-sonnet-20241022": provider==="watsonx"?"ibm/granite-20b-multilingual":"gpt-4o-mini");

    if (!key) {
      return json({ results: posts.map(p=>({ input:p, output: mock(p) })), provider:"mock", ms: Date.now()-t0, cid });
    }

    try {
      const results = await Promise.all(posts.map(async (p)=>{
        const user = buildUserPrompt("summarize", p);
        const { output } = await callLLM({
          provider,
          apiKey: key,
          model,
          temperature: b.temperature ?? 0.2,
          system: sysPrompt(),
          user,
          watsonxProjectId: b.watsonxProjectId,   // pass-through
          watsonxRegion: b.watsonxRegion,         // pass-through
        });
        return { input: p, output };
      }));
      return json({ results, provider, ms: Date.now()-t0, cid });
    } catch (err:any) {
      return json({ results: posts.map(p=>({ input:p, output: mock(p) })), provider:"mock-fallback", warning: err?.message || "Provider batch failed", ms: Date.now()-t0, cid });
    }
  } catch (e:any) {
    return json({ error: e?.message || "Server error", cid }, 500);
  }
}