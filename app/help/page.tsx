export default function Help() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <h1 className="text-3xl font-semibold">Help & How-To</h1>

      <section>
        <h2 className="text-xl font-medium">What it does</h2>
        <p className="text-zinc-300 mt-2">
          Analyze any post (social, blog, email) and get: a concise summary, suggested improvements,
          targeted answers to your questions, and an explainable score card (Readability, Clarity, Hook, CTA, Tone, Overall).
        </p>
      </section>

      <section>
        <h2 className="text-xl font-medium">Single analysis</h2>
        <ol className="list-decimal pl-5 mt-2 space-y-1 text-zinc-300">
          <li>Go to <code>/dashboard</code>.</li>
          <li>Paste your draft in <em>Analyze Any Text</em>.</li>
          <li>Click <strong>Summarize</strong>, <strong>Ask</strong>, or <strong>Improve</strong>.</li>
          <li>Use <strong>Export PDF</strong> to download a clean report.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-medium">Batch analysis</h2>
        <ol className="list-decimal pl-5 mt-2 space-y-1 text-zinc-300">
          <li>Use <strong>Load Pack</strong> to insert samples, or paste your own drafts.</li>
          <li>Separate posts with a line containing only <code>---</code>.</li>
          <li>Click <strong>Run Batch</strong>, then expand a result to see details.</li>
          <li>Use <strong>Export PDF</strong> on any item, or <strong>Download CSV</strong> for all.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-medium">Providers & keys</h2>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-300">
          <li>Works free in <strong>mock</strong> mode (no key) to preview behavior.</li>
          <li>For stronger results: paste your <strong>OpenAI</strong> or <strong>Claude</strong> key; the status chip flips to “Present”.</li>
          <li><strong>Watsonx</strong>: select <em>Watsonx</em>, paste API key, fill <em>Project ID</em> and <em>Region</em> (e.g., <code>us-south</code>), then run.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-medium">Support</h2>
        <p className="text-zinc-300 mt-2">
          The app is free. If it helps, consider a small donation via PayPal (see the Donate button on the landing).
        </p>
      </section>
    </main>
  );
}

