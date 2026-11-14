import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { StockSearchInput } from "@/components/stock-search-input";
import { getMessages } from "../messages/index";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getMessages();
  return {
    title: `${messages.appName} — Demo`,
    description: messages.demo,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { language, messages } = await getMessages();
  return (
    <html lang={language}>
      <body>
        <a className="skip-link" href="#main">{messages.skip}</a>
        <header className="global-nav">
          <div className="nav-container">
            <div className="flex items-center gap-6">
              <Link href="/" className="brand-title">
                {messages.appName}
              </Link>
              <nav aria-label={messages.navigation}>
                <Link
                  className="rounded px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                  href="/"
                >
                  {messages.home}
                </Link>
                <Link
                  className="rounded px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                  href="/stocks/TH/FIXTURE_TH_A"
                >
                  {messages.stock}
                </Link>
                <Link
                  className="rounded px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                  href="/chat"
                >
                  {messages.chat}
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <StockSearchInput />
            </div>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="demo-label" data-testid="demo-label">
            <span className="inline-block size-2 rounded-full bg-amber-500"></span>
            <span>{messages.demo}</span>
          </div>
          {children}
        </main>
        <footer>{messages.footer}</footer>
      </body>
    </html>
  );
}
