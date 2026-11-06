import { notFound } from "next/navigation";
import { th } from "../../../../messages/th";
import { getDemoStock } from "../../../../server/research";

export default async function StockPage({ params }: {
  params: Promise<{ market: string; symbol: string }>;
}) {
  const { market, symbol } = await params;
  const stock = await getDemoStock(market, symbol);
  if (!stock) notFound();

  return (
    <>
      <h1>{th.stockHeading}</h1>
      <p>{stock.data.company.name}</p>
      <p><code>{stock.data.listing.market} / {stock.data.listing.symbol}</code></p>
      <section aria-labelledby="quote-heading">
        <h2 id="quote-heading">{th.quote}</h2>
        <p>{th.quotePlaceholder}</p>
      </section>
      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading">{th.summary}</h2>
        <p>{th.summaryPlaceholder}</p>
      </section>
      <section aria-labelledby="stock-chat-heading">
        <h2 id="stock-chat-heading">{th.stockChat}</h2>
        <p>{th.stockChatPlaceholder}</p>
      </section>
    </>
  );
}
