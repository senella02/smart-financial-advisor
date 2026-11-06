import { th } from "../../messages/th";

export default function ChatPage() {
  return (
    <>
      <h1>{th.mainChat}</h1>
      <p>{th.mainChatPlaceholder}</p>
      <section aria-labelledby="history-heading">
        <h2 id="history-heading">{th.history}</h2>
        <p>{th.historyPlaceholder}</p>
      </section>
    </>
  );
}
