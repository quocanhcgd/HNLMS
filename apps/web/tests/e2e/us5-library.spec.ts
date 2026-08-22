import { expect, test } from "@playwright/test";

test.describe("US5 learning content and library UI", () => {
  test("teacher manages learning content drafts and approval queue", async ({ page }) => {
    await page.goto("/teacher/content");
    await expect(page.locator(".pageHeader").getByText("Soạn học liệu", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("IELTS Listening · Warm-up", { exact: true })).toBeVisible();
    await expect(page.getByText("Bản nháp đang soạn", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Gửi duyệt" })).toBeVisible();
  });

  test("student searches, filters, saves and opens library resources", async ({ page }) => {
    await page.goto("/student/library");
    await expect(page.locator(".pageHeader").getByText("Thư viện học tập", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: /IELTS Grammar Pack/ })).toBeVisible();
    await page.getByLabel("Lọc danh mục").click();
    await page.getByRole("option", { name: "Speaking" }).click();
    await expect(page.getByRole("button", { name: /Speaking warm-up video/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mở học liệu" })).toBeVisible();
  });
});
