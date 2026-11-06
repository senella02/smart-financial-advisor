import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { th } from "../messages/th";
import "./globals.css";

export const metadata: Metadata = {
  title: `${th.appName} — Demo`,
  description: th.demo,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>
        <a className="skip-link" href="#main">{th.skip}</a>
        <header>
          <p className="brand">{th.appName}</p>
          <nav aria-label={th.navigation}>
            <Link href="/">{th.home}</Link>
            <Link href="/stocks/TH/FIXTURE_TH_A">{th.stock}</Link>
            <Link href="/chat">{th.chat}</Link>
          </nav>
        </header>
        <main id="main" tabIndex={-1}>
          <p className="demo-label" data-testid="demo-label">{th.demo}</p>
          {children}
        </main>
        <footer>{th.footer}</footer>
      </body>
    </html>
  );
}
