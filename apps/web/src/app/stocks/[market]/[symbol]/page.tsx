import { notFound } from "next/navigation";
import { getMessages } from "../../../../messages/index";
import { getDemoStock } from "../../../../server/research";

export default async function StockPage({ params }: {
  params: Promise<{ market: string; symbol: string }>;
}) {
  const { messages } = await getMessages();
  const { market, symbol } = await params;
  const stock = await getDemoStock(market, symbol);
  if (!stock) notFound();

  return (
    <>
      <h1>{messages.stockHeading}</h1>
      <p>{stock.data.company.name}</p>
      <p><code>{stock.data.listing.market} / {stock.data.listing.symbol}</code></p>
      <section aria-labelledby="quote-heading">
        <h2 id="quote-heading">{messages.quote}</h2>
        <p>{messages.quotePlaceholder}</p>
      </section>
      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading">{messages.summary}</h2>
        <p>{messages.summaryPlaceholder}</p>
      </section>
      <section aria-labelledby="stock-chat-heading">
        <h2 id="stock-chat-heading">{messages.stockChat}</h2>
        <p>{messages.stockChatPlaceholder}</p>
      </section>
    </>
  );
}
