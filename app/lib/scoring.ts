// ============================================================================
// FILE: app/lib/scoring.ts
// (If you don’t already have it from the prior step, include this file.)
// ============================================================================
export type Scores = {
  readability: number;
  clarity: number;
  hook: number;
  cta: number;
  tone: number;
  overall: number;
  why: string[];
};

const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)));
function avgLen(sentences: string[]) { const words = sentences.map(s => s.trim().split(/\s+/).filter(Boolean).length); if (!words.length) return 0; return words.reduce((a,b)=>a+b,0)/words.length; }
function count(pattern: RegExp, text: string) { return (text.match(pattern) || []).length; }

export function scoreText(input: string): Scores {
  const text = input.trim();
  if (!text) return { readability: 0, clarity: 0, hook: 0, cta: 0, tone: 0, overall: 0, why: ["Empty text"] };
  const sentences = text.split(/[.!?]\s+/).filter(Boolean);
  const first = sentences[0] || "";
  const words = text.split(/\s+/).filter(Boolean);
  const numWords = words.length;

  const aLen = avgLen(sentences);
  const longWords = words.filter(w=>w.length>=12).length;
  let readability = 100 - (Math.abs((aLen||0)-15) * 6) - longWords*1.5; readability = clamp(readability);

  const hedges = count(/\b(might|maybe|perhaps|somewhat|kinda|sort of|a little)\b/gi, text);
  const ly = count(/\b\w+ly\b/gi, text);
  const paren = count(/[()]/g, text);
  let clarity = 100 - (hedges*8 + Math.max(0, ly-3)*2 + paren*4); clarity = clamp(clarity);

  const hasNumber = /\b\d+(\.\d+)?%?\b/.test(first);
  const hasDelta = /→|->|↑|↓|cut|reduced|increased|vs\.?/i.test(first);
  const hasYou = /\byou\b/i.test(first);
  let hook = 40 + (hasNumber?25:0) + (hasDelta?25:0) + (hasYou?10:0); hook = clamp(hook);

  const hasCTA = /\b(try|sign up|join|read more|learn more|comment|reply|download|contact)\b/i.test(text);
  let cta = hasCTA ? 85 : 35; cta = clamp(cta);

  const capsWords = words.filter(w => w.length>=4 && w === w.toUpperCase()).length;
  const emojis = count(/[\u{1F300}-\u{1FAFF}]/gu, text);
  const hashtags = count(/#[\w-]+/g, text);
  let tone = 100 - Math.min(40, capsWords*3 + Math.max(0,emojis-3)*5 + Math.max(0,hashtags-5)*3); tone = clamp(tone);

  const overall = clamp(Math.round(readability*0.2 + clarity*0.2 + hook*0.25 + cta*0.15 + tone*0.2));

  const why: string[] = [];
  if (hasNumber) why.push("Numbers in the opening boost credibility.");
  if (hasDelta)  why.push("Change language (cut/increased/→) signals impact.");
  if (!hasCTA)   why.push("Add a specific CTA to drive action.");
  if (aLen>20)   why.push("Shorter sentences improve skimmability.");
  if (longWords>Math.max(3, numWords/40)) why.push("Simplify or split very long phrases.");
  if (hedges>2) why.push("Reduce hedging to strengthen clarity.");
  if (hashtags>7) why.push("Too many hashtags can reduce readability.");

  return { readability, clarity, hook, cta, tone, overall, why };
}



