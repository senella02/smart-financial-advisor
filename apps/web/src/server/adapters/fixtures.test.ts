import { expect, it, vi } from "vitest";
import { evidenceFixture, stockIdentityFixture, usStockIdentityFixture } from "@sfa/contracts/fixtures";
import { fixtureGeneration } from "./fixture-generation";
import { fixtureMarketData } from "./fixture-market-data";
import { getDemoStock } from "../research";

vi.mock("server-only", () => ({}));

it("resolves only exact fixtures and never calls an external provider", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("External calls are forbidden"));
  try {
    const listing = stockIdentityFixture.data.listing;
    expect((await fixtureMarketData.identify(listing)).status).toBe("available");
    expect((await fixtureMarketData.quote(listing)).status).toBe("available");
    expect((await fixtureMarketData.identify({ ...listing, exchangeId: "OTHER" })).status).toBe("unavailable");
    expect((await fixtureMarketData.quote(usStockIdentityFixture.data.listing)).status).toBe("unavailable");
    expect((await getDemoStock("TH", "FIXTURE_TH_A"))?.fixture).toBe(true);
    expect(await getDemoStock("US", "NOT_A_FIXTURE")).toBeNull();
    expect((await fixtureGeneration.generate({ kind: "daily-brief", language: "th", evidence: evidenceFixture.data })).status).toBe("unavailable");
    await expect(fixtureMarketData.identify({ ...listing, symbol: "" })).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  } finally {
    fetchSpy.mockRestore();
  }
});
