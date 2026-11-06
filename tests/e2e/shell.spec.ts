import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", heading: "ภาพรวมตลาดและข่าวประจำวัน" },
  { path: "/stocks/TH/FIXTURE_TH_A", heading: "รายละเอียดหุ้นตัวอย่าง" },
  { path: "/chat", heading: "สนทนาเรื่องหุ้นและการเปรียบเทียบ" },
];

for (const { path, heading } of routes) {
  test(`${path}: Thai demo shell needs no login or external requests`, async ({ page }) => {
    const externalRequests: string[] = [];
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== "http://127.0.0.1:3100") {
        externalRequests.push(url.origin);
        await route.abort();
      } else await route.continue();
    });
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "th");
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByTestId("demo-label")).toContainText("ข้อมูลสาธิต / Demo");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "เมนูหลัก" })).toBeVisible();
    await expect(page.getByRole("textbox")).toHaveCount(0);
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "ข้ามไปยังเนื้อหาหลัก" });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    expect(externalRequests).toEqual([]);
  });
}

test("navigation works by keyboard with visible focus", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("navigation").getByRole("link", { name: "หน้าหลัก" })).toBeFocused();
  await page.keyboard.press("Tab");
  const stockLink = page.getByRole("link", { name: "หุ้นตัวอย่าง", exact: true });
  await expect(stockLink).toBeFocused();
  await expect(stockLink).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/stocks\/TH\/FIXTURE_TH_A$/);
  await page.goto("/");
  for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "สนทนา", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/chat$/);
});

test("US fixture works and an arbitrary real-looking ticker is not substituted", async ({ page }) => {
  expect((await page.goto("/stocks/US/FIXTURE_US_B"))?.status()).toBe(200);
  expect((await page.goto("/stocks/US/NOT_A_FIXTURE"))?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "ไม่พบหน้าตัวอย่างนี้" })).toBeVisible();
});
