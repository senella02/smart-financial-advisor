import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { getMessages } from "../messages/index";
import { StockSearch } from "@/components/stock-search";
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

          <nav
            aria-label={messages.navigation}
            className="flex flex-wrap items-center gap-3"
          >
            <Link
              className={buttonVariants({ variant: "ghost" })}
              href="/"
            >
              {messages.home}
            </Link>

            <Link
              className={buttonVariants({ variant: "ghost" })}
              href="/stocks/TH/FIXTURE_TH_A"
            >
              {messages.stock}
            </Link>

            <Link
              className={buttonVariants({ variant: "ghost" })}
              href="/chat"
            >
              {messages.chat}
            </Link>

            <div className="w-full md:ml-auto md:w-80">
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
