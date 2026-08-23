import { expect, test } from "@playwright/test";
test("teacher creates and assigns homework to class",async({page})=>{
  await page.goto("/teacher/classes/if-2609/assignments");
  await page.getByRole("button",{name:"Tạo bài"}).click();
  await expect(page.getByText("Tạo và giao bài cho lớp",{exact:true})).toBeVisible();
  await page.getByLabel("Tên bài").fill("Homework Unit 5");
  await page.getByLabel("Hạn nộp").fill("30/08/2026 · 21:00");
  await page.getByRole("button",{name:"Giao cho lớp"}).click();
  await expect(page.getByText("Đã giao bài cho 18 học viên",{exact:false})).toBeVisible();
  await expect(page.getByText("Homework Unit 5",{exact:true})).toBeVisible();
  await expect(page.getByText("Đã giao",{exact:true}).last()).toBeVisible();
  await page.getByText("Writing Task 1",{exact:true}).click();
  await expect(page.getByText("Hàng đợi xử lý bài tập",{exact:true})).toBeVisible();
});
