
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
  variant?: "default" | "navbar";
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

export function StockSearch({
  labels,
  variant = "default",
}: Props) {
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

  const isNavbar = variant === "navbar";

  function handleSelectStock() {
    setQuery("");
    setMatches([]);
    setIsAmbiguous(false);
    setError("");
    setLoading(false);
  }

  return (
    <section
      className={
        isNavbar
          ? "relative w-full max-w-md"
          : "space-y-4"
      }
      aria-label={labels.title}
    >
      {!isNavbar && (
        <h2 className="text-lg font-semibold">{labels.title}</h2>
      )}

      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2"
        role="search"
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? labels.loading : labels.button}
        </button>
      </form>

      {(error || matches.length > 0 || isAmbiguous) && (
        <div
          className={
            isNavbar
              ? "absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-lg border bg-background p-3 shadow-lg"
              : "mt-3 space-y-3"
          }
        >
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {isAmbiguous && (
            <p className="mb-2 text-sm text-muted-foreground">
              {labels.ambiguous}
            </p>
          )}

          {matches.length > 0 && (
            <>
              <p className="mb-2 text-xs text-muted-foreground">
                {labels.resultCount}: {matches.length}
              </p>

              <ul className="space-y-1">
                {matches.map((match) => {
                  const { listing } = match;

                  return (
                    <li
                      key={`${listing.market}-${listing.symbol}-${listing.exchangeId}`}
                    >
                      <Link
                        href={`/stocks/${encodeURIComponent(listing.market)}/${encodeURIComponent(listing.symbol)}`}
                        onClick={handleSelectStock}
                        className="flex items-center justify-between gap-3 rounded-md p-3 hover:bg-accent"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {match.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {listing.symbol} ·{" "}
                            {match.exchangeDisplay ?? listing.exchangeId}
                          </p>
                        </div>

                        <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                          {listing.market}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      {!loading &&
        !error &&
        query.trim() !== "" &&
        matches.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {labels.noResults}
          </p>
        )}
    </section>
  );
}
