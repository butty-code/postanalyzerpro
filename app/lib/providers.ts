// ============================================================================
// FILE: app/lib/providers.ts  (update to pass project/region into Watsonx)
// ============================================================================
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export type Provider = "openai" | "claude" | "watsonx" | "mock";

export function mock(text: string) {
  const s = text.length > 160 ? text.slice(0,160) + "…" : text;
  return `Summary: ${s}\n- Key point 1\n- Key point 2\n- Key point 3`;
}

export async function callLLM(opts: {
  provider: Provider;
  apiKey?: string;
  model: string;
  temperature: number;
  system: string;
  user: string;
  watsonxProjectId?: string;   // NEW
  watsonxRegion?: string;      // NEW
}): Promise<{ output: string; provider: Provider }> {
  const { provider, apiKey, model, temperature, system, user, watsonxProjectId, watsonxRegion } = opts;

  if (!apiKey) return { output: mock(user), provider: "mock" };

  if (provider === "openai") {
    const client = new OpenAI({ apiKey });
    const r = await client.chat.completions.create({
      model, temperature,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    });
    return { output: r.choices[0]?.message?.content?.trim() || "", provider };
  }

  if (provider === "claude") {
    const client = new Anthropic({ apiKey });
    const r = await client.messages.create({
      model, temperature, max_tokens: 800, system,
      messages: [{ role: "user", content: user }],
    });
    const out = r.content.filter((b:any)=>b.type==="text").map((b:any)=>b.text).join("").trim();
    return { output: out, provider };
  }

  if (provider === "watsonx") {
    const region = (watsonxRegion || process.env.WATSONX_REGION || "us-south").trim();
    const projectId = (watsonxProjectId || process.env.WATSONX_PROJECT_ID || "").trim();

    if (!projectId) throw new Error("Watsonx needs a Project ID.");

    // IAM token
    const iam = await fetch("https://iam.cloud.ibm.com/identity/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ibm:params:oauth:grant-type:apikey", apikey: apiKey }),
    });
    if (!iam.ok) throw new Error("Watsonx IAM auth failed");
    const { access_token } = (await iam.json()) as any;

    const url = `https://${region}.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29`;
    const body = {
      input: `[SYSTEM]\n${system}\n[/SYSTEM]\n[USER]\n${user}\n[/USER]`,
      parameters: { decoding_method: "greedy", max_new_tokens: 800, temperature },
      model_id: model,
      project_id: projectId,
    };
    const gen = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!gen.ok) throw new Error("Watsonx generation failed");
    const data = (await gen.json()) as any;
    return { output: data?.results?.[0]?.generated_text?.trim() || "", provider };
  }

  return { output: mock(user), provider: "mock" };
}

