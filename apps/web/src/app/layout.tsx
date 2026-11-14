import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import type { ReactNode } from "react";
import { getMessages } from "../messages/index";
import "./globals.css";
import { NavHeader } from "./nav-header";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getMessages();
  const isFixtures = process.env.SFA_USE_FIXTURES === "1";
  return {
    title: isFixtures ? `${messages.appName} — Demo` : messages.appName,
    description: isFixtures ? messages.demo : messages.homeHeading,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { language, messages } = await getMessages();
  const isFixtures = process.env.SFA_USE_FIXTURES === "1";
  return (
    <html lang={language} className={sarabun.variable}>
      <body>
        <a className="skip-link" href="#main">{messages.skip}</a>
        <NavHeader messages={messages} />
        <main id="main" tabIndex={-1}>
          {isFixtures && (
            <p className="demo-label" data-testid="demo-label">{messages.demo}</p>
          )}
          {children}
        </main>
        <footer>{messages.footer}</footer>
      </body>
    </html>
  );
}
