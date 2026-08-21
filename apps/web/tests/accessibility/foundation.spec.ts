import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const route of ["/", "/platform", "/admin", "/admin/leads", "/ui-preview"]) {
  test(`${route} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const serious = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
    if (serious.length)
      console.log(
        serious.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) })),
      );
    expect(serious).toEqual([]);
  });
}

test("keyboard opens LMS navigation and user menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Open LMS navigation" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await page.getByRole("button", { name: "Mở menu tài khoản" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Hồ sơ cá nhân")).toBeVisible();
});
