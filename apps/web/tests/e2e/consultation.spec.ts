import { expect, test } from "@playwright/test";

test("public consultation page presents required contact and consent controls", async ({ page }) => {
  await page.goto("/consultation");

  await expect(page.getByRole("heading", { name: "Một cuộc trò chuyện, một lộ trình rõ ràng hơn." })).toBeVisible();
  await expect(page.getByLabel("Họ và tên")).toBeVisible();
  await expect(page.getByLabel("Số điện thoại")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Bạn quan tâm đến" })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveAttribute("required", "");
  await expect(page.getByRole("button", { name: "Gửi yêu cầu tư vấn" })).toBeVisible();
});
