import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getMessages } from "../messages/index";

export default async function NotFound() {
  const { messages } = await getMessages();
  return <><h1>{messages.notFound}</h1><p>{messages.notFoundBody}</p><Link className={buttonVariants({ variant: "outline" })} href="/">{messages.home}</Link></>;
}
