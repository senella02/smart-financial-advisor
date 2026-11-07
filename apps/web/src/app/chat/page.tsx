import { getMessages } from "../../messages/index";

export default async function ChatPage() {
  const { messages } = await getMessages();
  return (
    <>
      <h1>{messages.mainChat}</h1>
      <p>{messages.mainChatPlaceholder}</p>
      <section aria-labelledby="history-heading">
        <h2 id="history-heading">{messages.history}</h2>
        <p>{messages.historyPlaceholder}</p>
      </section>
    </>
  );
}
