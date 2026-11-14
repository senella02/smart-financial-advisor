"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import type thMessages from "../messages/th.json";

type Messages = typeof thMessages;

interface DemoStockEntry {
  market: "TH" | "US";
  symbol: string;
  companyName: string;
  href: string;
}

const DEMO_STOCKS: DemoStockEntry[] = [
  {
    market: "TH",
    symbol: "FIXTURE_TH_A",
    companyName: "บริษัทตัวอย่าง A (ข้อมูลสาธิต)",
    href: "/stocks/TH/FIXTURE_TH_A",
  },
  {
    market: "US",
    symbol: "FIXTURE_US_B",
    companyName: "Sample Company B (demo data)",
    href: "/stocks/US/FIXTURE_US_B",
  },
];

export function NavHeader({ messages }: { messages: Messages }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return DEMO_STOCKS;
    return DEMO_STOCKS.filter(
      (item) =>
        item.symbol.toLowerCase().includes(trimmed) ||
        item.companyName.toLowerCase().includes(trimmed) ||
        item.market.toLowerCase().includes(trimmed),
    );
  }, [query]);

  const isHome = pathname === "/";
  const isChat = pathname.startsWith("/chat");

  return (
    <header className="nav-band">
      <div className="nav-band-inner">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-lg font-bold tracking-normal text-white">
            {messages.appName}
          </p>

          <nav aria-label={messages.navigation} className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              aria-current={isHome ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-[6px] px-3.5 py-2 text-base font-medium no-underline transition-colors ${
                isHome
                  ? "bg-white text-[#17243B] font-semibold underline decoration-2 underline-offset-4"
                  : "text-white hover:bg-[#293E91]"
              }`}
            >
              {messages.home}
            </Link>

            <button
              type="button"
              aria-expanded={searchOpen}
              aria-controls="stock-search-region"
              onClick={() => setSearchOpen((prev) => !prev)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-[6px] border px-3.5 py-2 text-base font-medium transition-colors cursor-pointer ${
                searchOpen
                  ? "border-white bg-white text-[#17243B] font-semibold"
                  : "border-white/70 bg-transparent text-white hover:bg-[#293E91]"
              }`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5 shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span>{messages.searchStocks}</span>
            </button>

            <Link
              href="/chat"
              aria-current={isChat ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-[6px] px-3.5 py-2 text-base font-medium no-underline transition-colors ${
                isChat
                  ? "bg-white text-[#17243B] font-semibold underline decoration-2 underline-offset-4"
                  : "text-white hover:bg-[#293E91]"
              }`}
            >
              {messages.chat}
            </Link>
          </nav>
        </div>

        {searchOpen && (
          <section
            id="stock-search-region"
            role="search"
            aria-label={messages.searchRegionLabel}
            className="mt-3 rounded-[6px] border border-[#D8DEEA] bg-white p-4 text-[#17243B]"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-[16rem] flex-1">
                <label
                  htmlFor="stock-search-input"
                  className="mb-1.5 block text-sm font-semibold text-[#17243B]"
                >
                  {messages.searchInputLabel}
                </label>
                <input
                  id="stock-search-input"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={messages.searchInputPlaceholder}
                  className="field-input w-full"
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="inline-flex min-h-11 items-center rounded-[6px] border border-[#75819B] bg-white px-4 py-2 text-base font-medium text-[#17243B] hover:bg-[#E9EDFB] hover:text-[#334DB3] cursor-pointer"
              >
                {messages.searchCloseButton}
              </button>
            </div>

            <div className="mt-3">
              {matches.length > 1 && (
                <p className="mb-2 text-sm text-[#56647B]">{messages.searchAmbiguousNotice}</p>
              )}
              {matches.length === 0 ? (
                <p className="text-sm text-[#56647B]">{messages.searchNoResults}</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {matches.map((item) => (
                    <li key={`${item.market}-${item.symbol}`}>
                      <Link
                        href={item.href}
                        onClick={() => setSearchOpen(false)}
                        className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-[6px] border border-[#D8DEEA] px-3 py-2 text-base text-[#17243B] no-underline hover:bg-[#E9EDFB]"
                      >
                        <span className="font-semibold text-[#334DB3]">
                          {item.market} · {item.symbol}
                        </span>
                        <span className="text-sm text-[#17243B]">{item.companyName}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </header>
  );
}
