import { getMessages } from "../messages/index";
import { getHomeBriefPayload, getHomeMarketOverview } from "../server/home";
import { HomeClient } from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ messages }, initialMarketOverview, initialBriefPayload] = await Promise.all([
    getMessages(),
    getHomeMarketOverview(),
    getHomeBriefPayload(),
  ]);

  return (
    <HomeClient
      messages={messages}
      initialMarketOverview={initialMarketOverview}
      initialBriefPayload={initialBriefPayload}
    />
  );
}
