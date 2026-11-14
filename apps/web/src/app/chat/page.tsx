import { getMessages } from "../../messages/index";
import { ChatPanel } from "./chat-panel";

export default async function ChatPage() {
  const { language, messages } = await getMessages();
  return (
    <>
      <h1>{messages.mainChat}</h1>
      <p>{messages.mainChatIntro}</p>
      <ChatPanel t={messages} language={language} />
    </>
  );
}
