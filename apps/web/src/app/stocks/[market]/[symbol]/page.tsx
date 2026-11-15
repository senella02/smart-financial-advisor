import { StockQuote } from "@/components/stock-quote";
import { StockPriceChart } from "@/components/stock-price-chart";
import { StockNews } from "@/components/stock-news";
import { notFound } from "next/navigation";
import { getMessages } from "../../../../messages/index";
import { getDemoStock } from "../../../../server/research";

export default async function StockPage({
  params,
}: {
  params: Promise<{ market: string; symbol: string }>;
}) {
  const { messages } = await getMessages();
  const { market, symbol } = await params;

  const stock = await getDemoStock(market, symbol);

  if (!stock) {
    notFound();
  }

  const listing = stock.data.listing;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg! font-semibold text-muted-foreground">{messages.stockHeading}</h1>
        <p className="stock-metadata">
          ข้อมูลหุ้นไทยและสหรัฐอเมริกา
        </p>
      </header>

      {/* Stock identity and live quote */}
      <section
        aria-labelledby="stock-identity-heading"
        className="stock-panel p-5 sm:p-6"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)]">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
                {listing.market} : {listing.symbol}
              </span>

              <span className="stock-metadata">
                {listing.exchangeId}
              </span>
            </div>

            <h2
              id="stock-identity-heading"
              className="text-2xl font-bold"
            >
              {stock.data.company.name}
            </h2>

            <p className="stock-metadata">
              รหัสบริษัท: {stock.data.company.companyId}
            </p>
          </div>

          <div className="min-w-0 lg:text-right">
            <StockQuote
              market={listing.market}
              symbol={listing.symbol}
            />
          </div>
        </div>
      </section>

      {/* Research and stock-specific chat */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <section
            aria-labelledby="chart-heading"
            className="stock-panel p-5 sm:p-6"
          >
            <h2 id="chart-heading">กราฟราคาหุ้น</h2>
            <StockPriceChart market={listing.market} symbol={listing.symbol} />
          </section>

          <section
            aria-labelledby="summary-heading"
            className="stock-panel p-5 sm:p-6"
          >
            <div className="border-b border-border pb-4">
              <h2 id="summary-heading">
                {messages.summary}
              </h2>
              <p className="stock-metadata">
                Daily Research Summary
              </p>
            </div>

            <div className="pt-5">
              <p>{messages.summaryPlaceholder}</p>
            </div>
          </section>

          <section
            aria-labelledby="financial-heading"
            className="stock-panel p-5 sm:p-6"
          >
            <h2 id="financial-heading">
              ข้อมูลทางการเงิน
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              ยังไม่มีข้อมูล — รอเชื่อมต่อ Financial Statements
            </p>
          </section>

          <section
            aria-labelledby="news-heading"
            className="stock-panel p-5 sm:p-6"
          >
            <h2 id="news-heading">ข่าวที่เกี่ยวข้อง</h2>
            <StockNews market={listing.market} symbol={listing.symbol} />
          </section>
        </div>

        <aside className="min-w-0">
          <section
            aria-labelledby="stock-chat-heading"
            className="stock-panel overflow-hidden"
          >
            <div className="border-b border-border p-5">
              <h2 id="stock-chat-heading">
                {messages.stockChat}
              </h2>
              <p className="stock-metadata mt-2">
                สนทนาเกี่ยวกับ {stock.data.company.name}
              </p>
            </div>

            <div className="p-5">
              <p>{messages.stockChatPlaceholder}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
