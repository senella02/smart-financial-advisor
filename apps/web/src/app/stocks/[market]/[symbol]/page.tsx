import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { getMessages } from "../../../../messages/index";
import { getStock } from "@/server/stock-detail";

export default async function StockPage({ params }: {
  params: Promise<{ market: string; symbol: string }>;
}) {
  const { messages } = await getMessages();
  const { market, symbol } = await params;
  const stock = await getStock(market, symbol);
  if (!stock) notFound();

  return (
    <>
      <h1>{messages.stockHeading}</h1>
      <p>{stock.data.company.name}</p>
      <p><code>{stock.data.listing.market} / {stock.data.listing.symbol}</code></p>
      <section aria-labelledby="quote-heading">
        <Card>
          <CardHeader>
            <CardTitle id="quote-heading">{messages.quote}</CardTitle>
          </CardHeader>
          <CardContent><p>{messages.quotePlaceholder}</p></CardContent>
        </Card>
      </section>
      <section aria-labelledby="summary-heading">
        <Card>
          <CardHeader>
            <CardTitle id="summary-heading">{messages.summary}</CardTitle>
          </CardHeader>
          <CardContent><p>{messages.summaryPlaceholder}</p></CardContent>
        </Card>
      </section>
      <section aria-labelledby="stock-chat-heading">
        <Card>
          <CardHeader>
            <CardTitle id="stock-chat-heading">{messages.stockChat}</CardTitle>
          </CardHeader>
          <CardContent><p>{messages.stockChatPlaceholder}</p></CardContent>
        </Card>
      </section>
    </>
  );
}
