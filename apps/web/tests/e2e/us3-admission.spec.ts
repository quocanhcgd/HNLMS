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

  test("admission manager sees the organization pipeline and can assign a lead", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admission-manager@demo.hnlms.vn");
    await page.getByLabel("Mật khẩu").fill("DemoAccess@2026!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page.getByText("Điều hành tuyển sinh", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Work queue tuyển sinh toàn tổ chức", { exact: true })).toBeVisible();
    await page.getByRole("row").filter({ hasText: "Lê Bảo Ngọc" }).getByRole("button", { name: "Phân công", exact: true }).click();
    await expect(page.getByText("Phân công · Lê Bảo Ngọc", { exact: true })).toBeVisible();
    await page.getByRole("textbox", { name: "Tư vấn viên phụ trách" }).click();
    await page.getByRole("option", { name: "Lan Anh" }).click();
    await page.getByRole("button", { name: "Lưu phân công" }).click();
    await expect(page.getByText("Đã phân công Lê Bảo Ngọc cho Lan Anh.", { exact: true })).toBeVisible();
  });

  test("admission manager can inspect a lead and update its next workflow step", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admission-manager@demo.hnlms.vn");
    await page.getByLabel("Mật khẩu").fill("DemoAccess@2026!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page.getByText("Điều hành tuyển sinh", { exact: true })).toBeVisible({ timeout: 15_000 });

    const leadRow = page.getByRole("row").filter({ hasText: "Trần Hoàng Nam" });
    await leadRow.getByRole("button", { name: "Xem hồ sơ", exact: true }).click();
    await expect(page.getByText("Hồ sơ tuyển sinh · Trần Hoàng Nam", { exact: true })).toBeVisible();
    await page.locator("body").press("Escape");

    await leadRow.getByRole("button", { name: "Cập nhật bước", exact: true }).click();
    await expect(page.getByText("Cập nhật bước · Trần Hoàng Nam", { exact: true })).toBeVisible();
    await page.getByLabel("Bước tiếp theo").fill("Gọi xác nhận lịch thi đầu vào");
    await page.getByRole("button", { name: "Lưu cập nhật", exact: true }).click();
    await expect(page.getByText("Đã cập nhật bước xử lý cho Trần Hoàng Nam.", { exact: true })).toBeVisible();
    await expect(leadRow).toContainText("Gọi xác nhận lịch thi đầu vào");
  });

  test("admission manager can access internal notifications and personal staff services", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admission-manager@demo.hnlms.vn");
    await page.getByLabel("Mật khẩu").fill("DemoAccess@2026!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page.getByText("Điều hành tuyển sinh", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Trao đổi nội bộ", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Hộp thông báo", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Lịch làm việc & chấm công", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Xin nghỉ", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Thu nhập & lương", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Hộp thông báo", exact: true }).click();
    await expect(page.getByText("Hộp thông báo", { exact: true }).first()).toBeVisible();
    const notificationRow = page.getByRole("row").filter({ hasText: "Nhắc lịch học hôm nay" });
    await notificationRow.getByRole("button", { name: "Xem thông báo", exact: true }).click();
    await page.getByRole("button", { name: "Đánh dấu đã đọc", exact: true }).click();
    await expect(notificationRow).toContainText("Đã đọc");
    await page.getByRole("button", { name: "Đóng", exact: true }).click();
    await page.getByRole("link", { name: "Lịch làm việc & chấm công", exact: true }).click();
    await expect(page.getByText("Lịch làm việc & chấm công", { exact: true }).first()).toBeVisible();
  });
});
