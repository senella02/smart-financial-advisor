import { getMessages } from "../../messages/index";
import { ChatPanel } from "./chat-panel";

export default async function ChatPage() {
  const { language, messages } = await getMessages();
  return <ChatPanel t={messages} language={language} />;
}
