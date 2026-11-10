import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMessages } from "../../messages/index";

export default async function ChatPage() {
  const { messages } = await getMessages();
  return (
    <>
      <h1>{messages.mainChat}</h1>
      <p>{messages.mainChatPlaceholder}</p>
      <section aria-labelledby="history-heading">
        <Card>
          <CardHeader>
            <CardTitle id="history-heading">{messages.history}</CardTitle>
          </CardHeader>
          <CardContent><p>{messages.historyPlaceholder}</p></CardContent>
        </Card>
      </section>
    </>
  );
}
