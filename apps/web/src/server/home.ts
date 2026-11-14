import "server-only";
import {
  buildHomeMarketOverview,
  createSeededPublicationStore,
  getHomeBriefPayloadFromStore,
  resolveChatHandoffFromStore,
} from "./home-service";
import { formatThaiDate, type SqlitePublicationStore } from "./publication-store";

let cachedStorePromise: Promise<SqlitePublicationStore> | null = null;

export async function getSharedPublicationStore(): Promise<SqlitePublicationStore> {
  if (!cachedStorePromise) {
    const dbPath = process.env.SFA_PUBLICATION_DB_PATH || ":memory:";
    cachedStorePromise = createSeededPublicationStore(new Date(), dbPath);
  }
  return cachedStorePromise;
}

export function getHomeMarketOverview() {
  return buildHomeMarketOverview({ now: new Date() });
}

export async function getHomeBriefPayload(requestedDate?: string) {
  const store = await getSharedPublicationStore();
  const currentThaiDate = formatThaiDate(new Date());
  return getHomeBriefPayloadFromStore(store, currentThaiDate, requestedDate);
}

export async function resolveChatHandoff(params: {
  cardId?: string;
  publicationId?: string;
  date?: string;
  topic?: string;
}) {
  const store = await getSharedPublicationStore();
  const currentThaiDate = formatThaiDate(new Date());
  return resolveChatHandoffFromStore(store, currentThaiDate, params);
}
