
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockSearch } from "@/components/stock-search";
import { getMessages } from "../messages/index";

export default async function HomePage() {
  const { messages } = await getMessages();

  return (
    <>
      <h1>{messages.homeHeading}</h1>

      <section className="mb-6">
        <StockSearch
          labels={{
            title: messages.searchTitle,
            placeholder: messages.searchPlaceholder,
            button: messages.searchButton,
            loading: messages.searchLoading,
            noResults: messages.searchNoResults,
            error: messages.searchError,
            ambiguous: messages.searchAmbiguous,
            resultCount: messages.searchResultCount,
          }}
        />
      </section>

      <section aria-labelledby="indices-heading">
        <Card>
          <CardHeader>
            <CardTitle id="indices-heading">
              {messages.indices}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{messages.indicesPlaceholder}</p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="brief-heading">
        <Card>
          <CardHeader>
            <CardTitle id="brief-heading">
              {messages.dailyBrief}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{messages.briefPlaceholder}</p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
