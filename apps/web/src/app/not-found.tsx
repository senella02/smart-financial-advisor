import Link from "next/link";
import { th } from "../messages/th";

export default function NotFound() {
  return <><h1>{th.notFound}</h1><p>{th.notFoundBody}</p><Link href="/">{th.home}</Link></>;
}
