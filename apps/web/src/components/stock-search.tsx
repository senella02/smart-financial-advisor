
"use client";

import Link from "next/link";
import { useState } from "react";
import type { SubmitEvent } from "react";

type SearchMatch = {
  listing: {
    companyId: string;
    market: "TH" | "US";
    symbol: string;
    exchangeId: string;
  };
  name: string;
  instrumentType: string;
  exchangeDisplay?: string;
};

type SearchResponse =
  | {
      status: "available";
      data: {
        query: string;
        matches: SearchMatch[];
        isAmbiguous: boolean;
      };
    }
  | {
      status: "unavailable";
      reason: string;
    }
  | {
      status: "error";
      code: string;
      message: string;
    };

type Props = {
  labels: {
    title: string;
    placeholder: string;
    button: string;
    loading: string;
    noResults: string;
    error: string;
    ambiguous: string;
    resultCount: string;
  };
};

export function StockSearch({ labels }: Props) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [isAmbiguous, setIsAmbiguous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const keyword = query.trim();

    if (!keyword) {
      setMatches([]);
      setError(labels.error);
      return;
    }

    setLoading(true);
    setError("");
    setMatches([]);
    setIsAmbiguous(false);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(keyword)}`,
      );

      const result = (await response.json()) as SearchResponse;

      if (result.status === "available") {
        setMatches(result.data.matches);
        setIsAmbiguous(result.data.isAmbiguous);
      } else {
        setError(labels.error);
      }
    } catch {
      setError(labels.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="stock-search-title">
      <h2 id="stock-search-title" className="text-lg font-semibold">
        {labels.title}
      </h2>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          className="min-w-0 flex-1 rounded-md border bg-background px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? labels.loading : labels.button}
        </button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && matches.length > 0 && (
        <div className="space-y-3" aria-live="polite">
          {isAmbiguous && (
            <p className="text-sm text-muted-foreground">
              {labels.ambiguous}
            </p>
          )}

          <p className="text-sm text-muted-foreground">
            {labels.resultCount}: {matches.length}
          </p>

          <ul className="space-y-2">
            {matches.map((match) => {
              const { listing } = match;

              return (
                <li key={`${listing.market}-${listing.symbol}-${listing.exchangeId}`}>
                  <Link
                    href={`/stocks/${encodeURIComponent(listing.market)}/${encodeURIComponent(listing.symbol)}`}
                    className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{match.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {listing.symbol} · {match.exchangeDisplay ?? listing.exchangeId}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-md bg-secondary px-3 py-1 text-sm">
                      {listing.market}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!loading && !error && query.trim() !== "" && matches.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {labels.noResults}
        </p>
      )}
    </section>
  );
}
