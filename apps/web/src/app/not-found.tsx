import Link from "next/link";
import { getMessages } from "../messages/index";

export default async function NotFound() {
  const { messages } = await getMessages();
  return <><h1>{messages.notFound}</h1><p>{messages.notFoundBody}</p><Link href="/">{messages.home}</Link></>;
}
