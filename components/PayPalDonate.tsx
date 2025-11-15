"use client";
export default function PayPalDonate() {
  const url =
    process.env.NEXT_PUBLIC_PAYPAL_DONATE_URL ||
    "https://www.paypal.com/donate/?hosted_button_id=EPNJQECD6GRGE";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="text-lg font-medium">Support the project</h3>
      <p className="text-zinc-400 text-sm mt-1">The app is free. If it helps you, you can donate to keep it running.</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-[#ffc439] text-black px-5 py-3 font-medium hover:brightness-95 mt-4"
      >
        💖 Donate via PayPal
      </a>
      <style jsx>{`a:active{transform:translateY(1px);}`}</style>
    </div>
  );
}

