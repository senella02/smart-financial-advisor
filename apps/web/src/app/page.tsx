import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMessages } from "../messages/index";

export default async function HomePage() {
  const { messages } = await getMessages();
  return (
    <>
      <h1>{messages.homeHeading}</h1>
      <section aria-labelledby="indices-heading">
        <Card>
          <CardHeader>
            <CardTitle id="indices-heading">{messages.indices}</CardTitle>
          </CardHeader>
          <CardContent><p>{messages.indicesPlaceholder}</p></CardContent>
        </Card>
      </section>
      <section aria-labelledby="brief-heading">
        <Card>
          <CardHeader>
            <CardTitle id="brief-heading">{messages.dailyBrief}</CardTitle>
          </CardHeader>
          <CardContent><p>{messages.briefPlaceholder}</p></CardContent>
        </Card>
      </section>
    </>
  );
}
