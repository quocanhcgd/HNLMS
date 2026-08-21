import { expect, test } from "@playwright/test";

test("US2 visitor can browse published landing content and program details", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Hoc dung lo trinh/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "IELTS Foundation", exact: true })).toBeVisible();
  await expect(page.getByText("Thầy Minh Tuấn")).toHaveCount(0);

  await Promise.all([
    page.waitForURL(/\/programs$/, { timeout: 15_000 }),
    page.getByRole("link", { name: "Xem tat ca" }).click(),
  ]);
  await expect(page.getByRole("link", { name: "Xem chi tiet IELTS Foundation" })).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/programs\/ielts-foundation$/, { timeout: 15_000 }),
    page.getByRole("link", { name: "Xem chi tiet IELTS Foundation" }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "IELTS Foundation", level: 1 })).toBeVisible();
  await expect(page.getByText("24 tuan").first()).toBeVisible();
});

test("US2 consultation submits consent, source and a stable submission key", async ({ page }) => {
  let submittedPayload: Record<string, unknown> | undefined;
  await page.route("**/api/public/consultations", async (route) => {
    submittedPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ consultation_id: "consultation-1", status: "accepted" }),
    });
  });

  await page.goto("/consultation");
  await page.getByLabel("Họ và tên").fill("Nguyễn Minh Anh");
  await page.getByLabel("Số điện thoại").fill("090 123 4567");
  await page.getByLabel("Email").fill("minhanh@example.com");
  await page.getByRole("textbox", { name: "Bạn quan tâm đến" }).click();
  await page.getByRole("option", { name: "IELTS", exact: true }).click();
  await page.getByLabel("Nhu cầu của bạn").fill("Mục tiêu IELTS 7.0");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Gửi yêu cầu tư vấn" }).click();

  await expect(page.getByRole("heading", { name: "Cảm ơn bạn đã liên hệ." })).toBeVisible();
  expect(submittedPayload).toMatchObject({
    full_name: "Nguyễn Minh Anh",
    phone: "090 123 4567",
    email: "minhanh@example.com",
    interest: "ielts",
    message: "Mục tiêu IELTS 7.0",
    source: "public-consultation-form",
    consent: true,
  });
  expect(submittedPayload?.client_submission_key).toEqual(expect.any(String));
  expect(String(submittedPayload?.client_submission_key)).not.toHaveLength(0);
});
