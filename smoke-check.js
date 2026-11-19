/**
 * Live Market Data Smoke Check
 * Verifies live integration for at least one Thai common stock (PTT)
 * and one US common stock (AAPL), 5 indices, and news evidence.
 */

async function runSmokeCheck() {
  console.log("=================================================");
  console.log("   LIVE MARKET DATA SMOKE CHECK (Phase 1)       ");
  console.log("   Date:", new Date().toISOString());
  console.log("=================================================\n");

  const results = {
    thaiStock: false,
    usStock: false,
    indices: false,
    news: false,
    ambiguousCheck: false,
  };

  // 1. Thai Stock Check (PTT)
  console.log("1. Checking Thai Common Stock (PTT.BK)...");
  try {
    const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/PTT.BK?interval=1d&range=5d", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (meta && meta.regularMarketPrice && meta.currency === "THB") {
      console.log(`   [PASS] PTT Price: ${meta.regularMarketPrice} ${meta.currency}, Exchange: ${meta.exchangeName}`);
      results.thaiStock = true;
    } else {
      console.log("   [FAIL] Could not verify PTT meta");
    }
  } catch (err) {
    console.log("   [FAIL] PTT fetch error:", err.message);
  }

  // 2. US Stock Check (AAPL)
  console.log("\n2. Checking US Common Stock (AAPL)...");
  try {
    const res = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=5d", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (meta && meta.regularMarketPrice && meta.currency === "USD") {
      console.log(`   [PASS] AAPL Price: ${meta.regularMarketPrice} ${meta.currency}, Exchange: ${meta.exchangeName}`);
      results.usStock = true;
    } else {
      console.log("   [FAIL] Could not verify AAPL meta");
    }
  } catch (err) {
    console.log("   [FAIL] AAPL fetch error:", err.message);
  }

  // 3. Five Major Indices Check
  console.log("\n3. Checking 5 Major Indices (SET, SET50, Dow Jones, S&P 500, Nasdaq)...");
  const indices = ["^SET.BK", "^SET50.BK", "^DJI", "^GSPC", "^IXIC"];
  let passedIndices = 0;
  for (const idx of indices) {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(idx)}?interval=1d&range=1d`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice) {
        console.log(`   [PASS] ${idx}: ${meta.regularMarketPrice} pts (${meta.timezone || "N/A"})`);
        passedIndices++;
      } else {
        console.log(`   [FAIL] ${idx}: Missing regularMarketPrice`);
      }
    } catch (err) {
      console.log(`   [FAIL] ${idx} fetch error:`, err.message);
    }
  }
  if (passedIndices === 5) results.indices = true;

  // 4. News Retrieval Check
  console.log("\n4. Checking Company News Evidence (AAPL)...");
  try {
    const res = await fetch("https://query2.finance.yahoo.com/v1/finance/search?q=Apple&quotesCount=0&newsCount=2", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const json = await res.json();
    const news = json?.news || [];
    if (news.length > 0 && news[0].title && news[0].link) {
      console.log(`   [PASS] News Title: "${news[0].title.substring(0, 50)}..."`);
      console.log(`          Publisher: ${news[0].publisher}, URL: ${news[0].link}`);
      results.news = true;
    } else {
      console.log("   [FAIL] No news returned");
    }
  } catch (err) {
    console.log("   [FAIL] News fetch error:", err.message);
  }

  // 5. Ambiguity & Common Stock Filtering Check
  console.log("\n5. Checking Ambiguity & Common Stock Filtering ('PTT')...");
  try {
    const res = await fetch("https://query2.finance.yahoo.com/v1/finance/search?q=PTT&quotesCount=5&newsCount=0", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const json = await res.json();
    const quotes = json?.quotes || [];
    const equities = quotes.filter(q => q.quoteType === "EQUITY");
    const nonEquities = quotes.filter(q => q.quoteType !== "EQUITY");
    console.log(`   [INFO] Found ${quotes.length} total symbols for 'PTT' (${equities.length} equities, ${nonEquities.length} funds/non-equity)`);
    if (nonEquities.length > 0 && equities.length > 0) {
      console.log("   [PASS] Successfully distinguishes common stock from funds (e.g. PTTRX mutual fund)");
      results.ambiguousCheck = true;
    }
  } catch (err) {
    console.log("   [FAIL] Ambiguity check error:", err.message);
  }

  console.log("\n=================================================");
  console.log("                SUMMARY RESULTS                  ");
  console.log("=================================================");
  console.log("Thai Stock (PTT):             ", results.thaiStock ? "PASSED" : "FAILED");
  console.log("US Stock (AAPL):              ", results.usStock ? "PASSED" : "FAILED");
  console.log("5 Major Indices:              ", results.indices ? "PASSED (5/5)" : "FAILED");
  console.log("News Evidence:                ", results.news ? "PASSED" : "FAILED");
  console.log("Ambiguity & Non-Equity Filter:", results.ambiguousCheck ? "PASSED" : "FAILED");
  console.log("=================================================\n");

  const allPassed = Object.values(results).every(Boolean);
  if (!allPassed) process.exit(1);
}

runSmokeCheck();
