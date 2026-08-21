import { expect, test } from "@playwright/test";

test("consultant records a note and schedules the next action", async ({ page }) => {
  await page.goto("/admin/admission");

  await expect(page.getByText("Không gian tư vấn tuyển sinh", { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "Ghi nhận tư vấn" }).click();
  await page.getByLabel("Nội dung trao đổi").fill("Khách xác nhận mục tiêu IELTS 6.5 và lịch học buổi tối.");
  await page.getByLabel("Bước tiếp theo").fill("Gửi đề xuất lịch thi");
  await page.getByRole("button", { name: "Lưu hoạt động" }).click();

  await expect(page.getByText("Đã lưu ghi chú và lịch bước tiếp theo.")).toBeVisible();
  await expect(page.getByText("Khách xác nhận mục tiêu IELTS 6.5 và lịch học buổi tối.")).toBeVisible();
  await expect(page.getByText("Gửi đề xuất lịch thi").last()).toBeVisible();
});

test("class-proposed lead converts through an explicit enrollment preview", async ({ page }) => {
  await page.goto("/admin/admission");
  await page.getByRole("button", { name: /Phạm Gia Hân/ }).click();
  await page.getByRole("button", { name: "Chuyển đổi ghi danh" }).click();
  await page.getByRole("textbox", { name: "Lớp ghi danh" }).click();
  await page.getByRole("option", { name: /Teen B1/ }).click();
  await page.getByRole("checkbox", { name: /Tôi đã kiểm tra lớp/ }).check();
  await page.getByRole("button", { name: "Xác nhận ghi danh" }).click();

  await expect(page.getByText("Đã chuyển đổi lead thành ghi danh và khởi tạo nghĩa vụ tài chính.")).toBeVisible();
  await expect(page.getByText("Đã ghi danh Teen B1 · TB1-2608")).toBeVisible();
});
