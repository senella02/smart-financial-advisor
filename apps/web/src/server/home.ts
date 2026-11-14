import "server-only";
import {
  ensureLivePublicationStore,
  getHomeBriefPayloadFromStore,
  getLiveOrFixtureMarketOverview,
  resolveChatHandoffFromStore,
} from "./home-service";
import { formatThaiDate, type SqlitePublicationStore } from "./publication-store";

let cachedStorePromise: Promise<SqlitePublicationStore> | null = null;

export async function getSharedPublicationStore(): Promise<SqlitePublicationStore> {
  if (!cachedStorePromise) {
    const dbPath = process.env.SFA_PUBLICATION_DB_PATH || undefined;
    cachedStorePromise = ensureLivePublicationStore(dbPath).catch((error) => {
      cachedStorePromise = null;
      throw error;
    });
  }
  return cachedStorePromise;
}

export async function getHomeMarketOverview() {
  return getLiveOrFixtureMarketOverview(new Date());
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
