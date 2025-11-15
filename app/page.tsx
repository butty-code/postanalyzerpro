import Link from "next/link";
import dynamic from "next/dynamic";
const PayPalDonate = dynamic(() => import("@/components/PayPalDonate"), { ssr: false });

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <section className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-300">
          ✨ Free AI analyzer for posts, JDs & articles
        </span>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">Turn messy drafts into clear, shippable posts</h1>
        <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
          Clean text, concise summaries, improvement suggestions, and batch mode. Use any provider or none—works without keys.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/dashboard" className="rounded-xl bg-white text-black px-5 py-3 font-medium hover:bg-white/90">Open Dashboard</Link>
          <a href="#features" className="rounded-xl border border-white/15 px-5 py-3 hover:bg-white/[0.06]">See features</a>
        </div>
      </section>

      <section id="features" className="mt-16 grid md:grid-cols-3 gap-6">
        {[
          { title: "Batch Analyze", desc: "Process dozens of drafts in one click and export CSV." },
          { title: "Explain & Improve", desc: "Ask questions, get summaries, edits, hooks and a CTA." },
          { title: "Optional Keys", desc: "Paste OpenAI/Claude/Watsonx keys for stronger results; otherwise runs in mock mode." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-lg font-medium">{f.title}</h3>
            <p className="text-zinc-400 mt-2">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <PayPalDonate />
      </section>
    </main>
  );
}

