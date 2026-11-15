
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { StockSearch } from "@/components/stock-search";
import { getMessages } from "../messages/index";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getMessages();

  return {
    title: messages.appName,
    description: messages.demo,
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { language, messages } = await getMessages();

  const navLink =
    "inline-flex min-h-11 items-center rounded-md px-4 py-2 " +
    "text-sm font-medium text-white transition-colors " +
    "hover:bg-white/15 focus-visible:outline-white";

  return (
    <html lang={language}>
      <body>
        <a className="skip-link" href="#main">
          {messages.skip}
        </a>

        <header className="relative z-20 bg-primary text-primary-foreground">
          <div className="mx-auto flex w-full max-w-312 flex-wrap items-center gap-4 px-4 py-3 sm:px-8">
            <Link
              href="/"
              className="brand shrink-0 text-white no-underline"
            >
              {messages.appName}
            </Link>

            <nav
              aria-label={messages.navigation}
              className="flex flex-1 flex-wrap items-center justify-end gap-2"
            >
              <Link className={navLink} href="/">
                {messages.home}
              </Link>

              <Link className={navLink} href="/chat">
                {messages.chat}
              </Link>

              <div className="relative z-30 w-full sm:w-80">
                <StockSearch
                  variant="navbar"
                  labels={{
                    title: messages.searchTitle,
                    placeholder: messages.searchPlaceholder,
                    button: messages.searchButton,
                    loading: messages.searchLoading,
                    noResults: messages.searchNoResults,
                    error: messages.searchError,
                    ambiguous: messages.searchAmbiguous,
                    resultCount: messages.searchResultCount,
                  }}
                />
              </div>
            </nav>
          </div>
        </header>

        <main id="main" tabIndex={-1}>
          {children}
        </main>

        <footer>{messages.footer}</footer>
      </body>
    </html>
  );
}
