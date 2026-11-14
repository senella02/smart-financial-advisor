"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchMatch {
  listing: {
    market: "TH" | "US";
    symbol: string;
    companyId: string;
    exchangeId: string;
  };
  name: string;
  instrumentType: string;
  exchangeDisplay?: string;
}

export function StockSearchInput() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.matches || []);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(match: SearchMatch) {
    setIsOpen(false);
    setQuery("");
    router.push(`/stocks/${match.listing.market}/${match.listing.symbol}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      if (results.length > 0) {
        handleSelect(results[0]);
      } else {
        // Direct guess if market is identifiable or default to US
        const isThai = query.toUpperCase().endsWith(".BK") || /^[A-Z]{1,5}$/.test(query);
        // Let's select the first if available
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-64">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        placeholder="ค้นหาหุ้น (เช่น PTT, NVDA, AAPL)..."
        className="h-9 w-full rounded bg-white/10 px-3 text-xs text-white placeholder:text-white/60 border border-white/20 focus:border-white focus:bg-white/20 focus:outline-none"
        aria-label="ค้นหาหุ้น"
      />
      {isLoading && (
        <div className="absolute right-3 top-2.5 size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-10 z-50 max-h-72 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          <div className="p-1.5 space-y-1">
            {results.map((match) => (
              <button
                key={`${match.listing.market}_${match.listing.symbol}`}
                type="button"
                onClick={() => handleSelect(match)}
                className="w-full flex items-center justify-between rounded-md p-2 text-left hover:bg-muted transition-colors text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">{match.listing.symbol}</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-muted text-muted-foreground">
                      {match.listing.market}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                    {match.name}
                  </div>
                </div>
                <span className="text-[10px] text-primary font-medium">
                  {match.exchangeDisplay || match.listing.exchangeId} →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && !isLoading && query.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-10 z-50 rounded-lg border border-border bg-card p-3 shadow-lg text-center text-xs text-muted-foreground">
          ไม่พบหุ้นสามัญที่ตรงกับ &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
