import { th } from "../messages/th";

export default function HomePage() {
  return (
    <>
      <h1>{th.homeHeading}</h1>
      <section aria-labelledby="indices-heading">
        <h2 id="indices-heading">{th.indices}</h2>
        <p>{th.indicesPlaceholder}</p>
      </section>
      <section aria-labelledby="brief-heading">
        <h2 id="brief-heading">{th.dailyBrief}</h2>
        <p>{th.briefPlaceholder}</p>
      </section>
    </>
  );
}
