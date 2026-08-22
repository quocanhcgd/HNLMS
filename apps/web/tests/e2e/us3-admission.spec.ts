import { expect, test } from "@playwright/test";

test.describe("US3 admission consultant workflow", () => {
  test("records a consultation and moves the lead into the consulting state", async ({ page }) => {
    await page.goto("/admin/admission");

    await expect(page.getByText("Không gian tư vấn tuyển sinh", { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: /Nguyễn Minh Anh/ }).click();
    await page.getByRole("button", { name: "Ghi nhận tư vấn" }).click();
    await page.getByLabel("Nội dung trao đổi").fill("Đã xác nhận mục tiêu IELTS 6.5 và lịch học buổi tối.");
    await page.getByLabel("Bước tiếp theo").fill("Gán bài thi đầu vào");
    await page.getByRole("button", { name: "Lưu hoạt động" }).click();

    await expect(page.getByText("Đã lưu ghi chú và lịch bước tiếp theo.")).toBeVisible();
    await expect(page.getByText("Đã xác nhận mục tiêu IELTS 6.5 và lịch học buổi tối.")).toBeVisible();
    await expect(page.getByText("Gán bài thi đầu vào").last()).toBeVisible();
    await expect(page.getByText("Đang tư vấn").first()).toBeVisible();
  });

  test("shows the assessment result and converts a class-proposed lead exactly once", async ({ page }) => {
    await page.goto("/admin/admission");

    await page.getByRole("button", { name: /Phạm Gia Hân/ }).click();
    await expect(page.getByText("CEFR A2 · 62/100 · đề xuất Teen B1")).toBeVisible();
    await expect(page.getByText("Đề xuất lớp").first()).toBeVisible();

    await page.getByRole("button", { name: "Chuyển đổi ghi danh" }).click();
    await page.getByRole("textbox", { name: "Lớp ghi danh" }).click();
    await page.getByRole("option", { name: /Teen B1/ }).click();
    await page.getByRole("checkbox", { name: /Tôi đã kiểm tra lớp/ }).check();
    await page.getByRole("button", { name: "Xác nhận ghi danh" }).click();

    await expect(page.getByText("Đã chuyển đổi lead thành ghi danh và khởi tạo nghĩa vụ tài chính.")).toBeVisible();
    await expect(page.getByText("Đã ghi danh Teen B1 · TB1-2608")).toBeVisible();
    await expect(page.getByRole("button", { name: "Chuyển đổi ghi danh" })).toBeDisabled();
  });
});
