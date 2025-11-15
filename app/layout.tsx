import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI Post Analyzer",
  description: "Free AI post analyzer. Optional donations via PayPal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-[#0b0f1a] text-zinc-200 text-[16.5px] leading-7 antialiased">
        <header className="border-b border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent">
          <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold tracking-tight">AI Post Analyzer</Link>
            <div className="flex items-center gap-5 text-[15px]">
              <Link href="/#features" className="hover:text-white">Features</Link>
              <Link href="/help" className="hover:text-white">Help</Link>
              <a
                href={process.env.NEXT_PUBLIC_PAYPAL_DONATE_URL || "https://www.paypal.com/donate/?hosted_button_id=EPNJQECD6GRGE"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[#ffc439] text-black px-4 py-2 font-medium hover:brightness-95"
              >
                💖 Donate
              </a>
              <Link href="/dashboard" className="rounded-xl bg-white text-black px-4 py-2 font-medium hover:bg-white/90">Open app</Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="border-t border-white/10 mt-20">
          <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-zinc-400">© {new Date().getFullYear()} PostIQ · Free to use</div>
        </footer>
      </body>
    </html>
  );
}


