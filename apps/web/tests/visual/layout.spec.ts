import { expect, test } from "@playwright/test";

for (const route of ["/", "/platform", "/admin", "/admin/leads", "/ui-preview"]) {
  test(`${route} has no horizontal page overflow`, async ({ page }, testInfo) => {
    await page.goto(route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`${route.replaceAll("/", "-") || "home"}.png`), fullPage: true });
  });
}
