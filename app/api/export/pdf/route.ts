export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Scores = { readability:number; clarity:number; hook:number; cta:number; tone:number; overall:number; why:string[] };

const PC = {
  headerBg: rgb(0.09, 0.10, 0.14),
  text: rgb(0.10, 0.10, 0.12),
  text2: rgb(0.25, 0.27, 0.32),
  barBg: rgb(0.86, 0.88, 0.92),
  good: rgb(0.09, 0.69, 0.27),
  warn: rgb(0.96, 0.62, 0.05),
  bad:  rgb(0.84, 0.12, 0.12),
};

function wrapText(text: string, maxWidth: number, fontSize: number, charWidth = 0.52) {
  const maxChars = Math.max(12, Math.floor(maxWidth / (fontSize * charWidth)));
  const words = (text || "").split(/\s+/); const lines: string[] = []; let cur = "";
  for (const w of words) { if (!w) continue; const next = (cur ? cur + " " : "") + w;
    if (next.length > maxChars) { if (cur) lines.push(cur); cur = w; } else { cur = next; } }
  if (cur) lines.push(cur); return lines;
}

function sanitize(text: string) {
  return (text || "")
    .replace(/\u2018|\u2019|\u201A|\u201B/g, "'")
    .replace(/\u201C|\u201D|\u201E/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2192|\u27A1|\u2794/g, "->")
    .replace(/\u2191/g, "^").replace(/\u2193/g, "v")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u200B-\u200D\u2060]/g, "")
    .replace(/[\uFE00-\uFE0F]/g, "")
    .replace(/\p{M}/gu, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "");
}

function drawSectionTitle(page: any, font: any, x: number, y: number, text: string) {
  page.drawText(text, { x, y, size: 16, font, color: PC.text });
  page.drawLine({ start: { x, y: y - 5 }, end: { x: x + 500, y: y - 5 }, thickness: 1, color: PC.text2 });
}

function drawBar(page: any, x: number, y: number, label: string, value: number, font: any) {
  page.drawText(label, { x, y, size: 12, font, color: PC.text });
  const barX = x + 110, barW = 340, barH = 10;
  page.drawRectangle({ x: barX, y: y - 2, width: barW, height: barH, color: PC.barBg });
  const ratio = Math.max(0, Math.min(100, value)) / 100;
  const color = value >= 80 ? PC.good : value >= 60 ? PC.warn : PC.bad;
  page.drawRectangle({ x: barX, y: y - 2, width: barW * ratio, height: barH, color });
  page.drawText(String(value), { x: barX + barW + 8, y, size: 11, font, color: PC.text2 });
}

export async function POST(req: NextRequest) {
  try {
    const { title = "AI Post Analyzer Report", input = "", output = "", scores, meta = {} as Record<string,string> } = await req.json();

    const pdf = await PDFDocument.create();
    const fontTitle = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontBody  = await pdf.embedFont(StandardFonts.Helvetica);

    const _title  = sanitize(title);
    const _input  = sanitize(input);
    const _output = sanitize(output);

    const page = pdf.addPage([612, 792]);
    page.drawRectangle({ x: 0, y: 748, width: 612, height: 44, color: PC.headerBg });
    page.drawText("AI Post Analyzer", { x: 24, y: 762, size: 18, font: fontTitle, color: rgb(1,1,1) });
    const now = new Date();
    page.drawText(now.toISOString().slice(0,19).replace("T"," "), { x: 460, y: 762, size: 11, font: fontBody, color: rgb(1,1,1) });

    page.drawText(_title, { x: 24, y: 720, size: 20, font: fontTitle, color: PC.text });
    let y = 696;

    if (Object.keys(meta).length) {
      const metaText = sanitize(Object.entries(meta).map(([k,v]) => `${k}: ${v}`).join("  |  "));
      for (const line of wrapText(metaText, 560, 11)) { page.drawText(line, { x: 24, y, size: 11, font: fontBody, color: PC.text2 }); y -= 15; }
      y -= 8;
    }

    if (scores) {
      drawSectionTitle(page, fontTitle, 24, y, "Scores"); y -= 24;
      const bars = [
        ["Overall", scores.overall],
        ["Readability", scores.readability],
        ["Clarity", scores.clarity],
        ["Hook", scores.hook],
        ["CTA", scores.cta],
        ["Tone", scores.tone],
      ] as const;
      for (const [k,v] of bars) { drawBar(page, 24, y, k, v, fontBody); y -= 20; }
      if (scores.why?.length) {
        page.drawText("Why it scores this way:", { x: 24, y, size: 12, font: fontTitle, color: PC.text }); y -= 16;
        for (const w of scores.why.slice(0,5)) {
          for (const line of wrapText(sanitize(`• ${w}`), 560, 11)) {
            page.drawText(line, { x: 24, y, size: 11, font: fontBody, color: PC.text2 }); y -= 14;
          }
        }
        y -= 8;
      }
    }

    drawSectionTitle(page, fontTitle, 24, y, "Original Text"); y -= 24;
    for (const line of wrapText(_input || "(none)", 560, 12)) { page.drawText(line, { x: 24, y, size: 12, font: fontBody, color: PC.text }); y -= 15; if (y < 90) break; }
    y -= 10;

    drawSectionTitle(page, fontTitle, 24, y, "AI Output"); y -= 24;
    for (const line of wrapText(_output || "(none)", 560, 12)) { page.drawText(line, { x: 24, y, size: 12, font: fontBody, color: PC.text }); y -= 15; if (y < 60) break; }

    const bytes = await pdf.save();
    const filename = `post-analyzer-${now.toISOString().slice(0,19).replace(/[:T]/g,"-")}.pdf`;
    return new NextResponse(bytes, { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"` } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "pdf_export_failed" }, { status: 500 });
  }
}
