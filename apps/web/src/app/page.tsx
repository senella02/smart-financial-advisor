import { getMessages } from "../messages/index";

export default async function HomePage() {
  const { messages } = await getMessages();
  return (
    <>
      <h1>{messages.homeHeading}</h1>
      <section aria-labelledby="indices-heading">
        <h2 id="indices-heading">{messages.indices}</h2>
        <p>{messages.indicesPlaceholder}</p>
      </section>
      <section aria-labelledby="brief-heading">
        <h2 id="brief-heading">{messages.dailyBrief}</h2>
        <p>{messages.briefPlaceholder}</p>
      </section>
    </>
  );
}
