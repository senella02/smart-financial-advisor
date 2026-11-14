import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
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
        <header>
          <p className="brand">{messages.appName}</p>
          <nav aria-label={messages.navigation}>
            <Link className={buttonVariants({ variant: "ghost" })} href="/">{messages.home}</Link>
            <Link className={buttonVariants({ variant: "ghost" })} href="/stocks/TH/FIXTURE_TH_A">{messages.stock}</Link>
            <Link className={buttonVariants({ variant: "ghost" })} href="/chat">{messages.chat}</Link>
          </nav>
        </header>
        <main id="main" tabIndex={-1}>
          <p className="demo-label" data-testid="demo-label">{messages.demo}</p>
          {children}
        </main>
        <footer>{messages.footer}</footer>
      </body>
    </html>
  );
}
