
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StockQuote } from "@/components/stock-quote";
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
    <>
      <h1>{messages.stockHeading}</h1>

      <div className="mb-6 space-y-1">
        <h2 className="text-2xl font-bold">
          {stock.data.company.name}
        </h2>

        <p className="text-sm text-muted-foreground">
          {listing.symbol} · {listing.market} · {listing.exchangeId}
        </p>
      </div>

      <section aria-labelledby="quote-heading">
        <Card>
          <CardHeader>
            <CardTitle id="quote-heading">
              {messages.quote}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <StockQuote
              market={listing.market}
              symbol={listing.symbol}
            />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="summary-heading">
        <Card>
          <CardHeader>
            <CardTitle id="summary-heading">
              {messages.summary}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p>{messages.summaryPlaceholder}</p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="stock-chat-heading">
        <Card>
          <CardHeader>
            <CardTitle id="stock-chat-heading">
              {messages.stockChat}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p>{messages.stockChatPlaceholder}</p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
