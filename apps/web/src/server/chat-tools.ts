import "server-only";
import { ChartRangeSchema, MarketSchema } from "@sfa/contracts";
import { getStock, liveMarketData } from "./research";

const STOCK = {
  type: "object",
  properties: {
    market: { type: "string", enum: ["TH", "US"], description: "TH for SET-listed Thai stocks, US for US stocks" },
    symbol: { type: "string", description: "Ticker without exchange suffix, e.g. PTT or AAPL" },
  },
  required: ["market", "symbol"],
};

// Gemini function declarations; every tool reads SFA-6's shared data layer, never a provider directly.
export const TOOL_DECLARATIONS = [
  {
    name: "search_stocks",
    description: "Find Thai (SET) and US common stocks by company name or ticker. Use it to turn a name into market and symbol, and when a name could match several companies.",
    parameters: { type: "object", properties: { query: { type: "string", description: "Company name or ticker, e.g. 'PTT' or 'Apple'" } }, required: ["query"] },
  },
  { name: "get_quote", description: "Latest price for one stock, with currency and the source's as-of time. Thai quotes may be delayed.", parameters: STOCK },
  {
    name: "get_price_history",
    description: "Prices and volumes for one stock over a range. 'summary' has exact first, last, high and low prices and changePercent from the full series; 'points' are a sample of at most 40 points for describing the shape only.",
    parameters: {
      ...STOCK,
      properties: { ...STOCK.properties, range: { type: "string", enum: ["1D", "1M", "1Y", "5Y"], description: "Time range" } },
      required: ["market", "symbol", "range"],
    },
  },
  { name: "get_news", description: "Recent news headlines for one stock: headline, publisher, URL and publish time. Headlines only, no article text.", parameters: STOCK },
  { name: "get_financial_metrics", description: "P/E, P/BV, ROE, D/E, dividend yield and market cap for one stock, each with basis and period. May be unavailable.", parameters: STOCK },
  {
    name: "get_financial_statements",
    description: "Income statement, balance sheet and cash flow for one stock. May be unavailable.",
    parameters: {
      ...STOCK,
      properties: { ...STOCK.properties, frequency: { type: "string", enum: ["annual", "quarterly"] } },
      required: ["market", "symbol", "frequency"],
    },
  },
  { name: "get_market_indices", description: "Current SET, SET50, Dow Jones, S&P 500 and Nasdaq index values with as-of times." },
];

const STOCK_TOOLS = new Set(["get_quote", "get_price_history", "get_news", "get_financial_metrics", "get_financial_statements"]);
const INVALID = { status: "unavailable", reason: "INVALID_TOOL_ARGUMENTS" };
// shortcut: send at most 40 evenly spaced chart points (first and last kept) to keep prompts small; revisit if answers need finer detail.
const MAX_POINTS = 40;

export function samplePoints<T>(points: T[], max = MAX_POINTS): T[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
}

type PricePoint = { sourceAsOf: string; price: { value: number | null } };

// Exact range figures from the full series, so the model neither estimates from sampled points nor does the arithmetic.
export function summarizePrices(points: PricePoint[]) {
  const priced = points.flatMap((p) => p.price.value === null ? [] : [{ sourceAsOf: p.sourceAsOf, value: p.price.value }]);
  if (priced.length === 0) return null;
  const first = priced[0];
  const last = priced[priced.length - 1];
  const high = priced.reduce((a, b) => (b.value > a.value ? b : a));
  const low = priced.reduce((a, b) => (b.value < a.value ? b : a));
  const changePercent = first.value === 0 ? null : Math.round(((last.value - first.value) / first.value) * 10_000) / 100;
  return { first, last, high, low, changePercent };
}

// Tool arguments come from the model, so they are validated like any untrusted input.
export async function runTool(name: string, args: Record<string, unknown> = {}): Promise<object> {
  try {
    if (name === "search_stocks") {
      const query = typeof args.query === "string" ? args.query.trim() : "";
      return query && query.length <= 100 ? await liveMarketData.search(query) : INVALID;
    }
    if (name === "get_market_indices") return await liveMarketData.indices();
    if (!STOCK_TOOLS.has(name)) return { status: "error", code: "UNKNOWN_TOOL", message: name };

    const market = MarketSchema.safeParse(args.market);
    const symbol = typeof args.symbol === "string" ? args.symbol.trim().toUpperCase() : "";
    if (!market.success || !/^[A-Z0-9._^-]{1,20}$/.test(symbol)) return INVALID;
    const stock = await getStock(market.data, symbol);
    if (!stock) return { status: "unavailable", reason: "STOCK_NOT_FOUND" };
    const listing = stock.data.listing;

    let result: object;
    if (name === "get_quote") result = await liveMarketData.quote(listing);
    else if (name === "get_news") result = await liveMarketData.news(listing);
    else if (name === "get_financial_metrics") result = await liveMarketData.metrics(listing);
    else if (name === "get_financial_statements") {
      result = await liveMarketData.statements(listing, args.frequency === "quarterly" ? "quarterly" : "annual");
    } else {
      const range = ChartRangeSchema.safeParse(args.range);
      if (!range.success) return INVALID;
      const history = await liveMarketData.priceHistory(listing, range.data);
      result = history.status === "available"
        ? {
          ...history,
          summary: summarizePrices(history.data.points),
          data: { ...history.data, points: samplePoints(history.data.points) },
        }
        : history;
    }
    // Return the resolved identity too, so the answer names the exact company and market.
    return { stock: stock.data, result };
  } catch (error) {
    console.error("chat tool failed", { name, error: String(error) });
    return { status: "error", code: "TOOL_FAILED", message: "Data request failed" };
  }
}
