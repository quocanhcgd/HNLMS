import { expect, test } from "@playwright/test";

const apiBaseUrl = "http://localhost:4000/v1";
const teacherHeaders = {
  "Content-Type": "application/json",
  origin: "http://localhost:3100",
  "x-user-id": "teacher-demo",
  "x-organization-id": "org-1",
};
const studentHeaders = {
  "Content-Type": "application/json",
  origin: "http://localhost:3100",
  "x-user-id": "student@demo.hnlms.vn",
  "x-student-id": "student-minh-anh",
  "x-organization-id": "org-1",
};

let createdAssignmentId: string | undefined;
let createdSubmissionId: string | undefined;

test.afterEach(async ({ request }) => {
  if (createdAssignmentId && createdSubmissionId) {
    await request.post(
      `${apiBaseUrl}/teacher/learning/assignments/${createdAssignmentId}/submissions/${createdSubmissionId}/void`,
      { headers: teacherHeaders },
    );
  }
  if (createdAssignmentId) {
    await request.post(`${apiBaseUrl}/teacher/learning/assignments/${createdAssignmentId}/archive`, {
      headers: teacherHeaders,
    });
  }
  createdAssignmentId = undefined;
  createdSubmissionId = undefined;
});

test("published assignment score is linked to the correct student and parent session", async ({ page, request }) => {
  const title = `Regression score ${Date.now()}`;
  const createResponse = await request.post(`${apiBaseUrl}/teacher/learning/assignments`, {
    headers: teacherHeaders,
    data: {
      classId: "if-2609",
      programId: "ielts-foundation-a2",
      sessionId: "session-5",
      title,
      type: "Bài kiểm tra",
      instructions: "Bài kiểm tra hồi quy luồng công bố điểm.",
      maxScore: 10,
      attempts: 1,
    },
  });
  expect(createResponse.ok()).toBe(true);
  const assignment = (await createResponse.json()) as { id: string };
  createdAssignmentId = assignment.id;

  const publishResponse = await request.post(`${apiBaseUrl}/teacher/learning/assignments/${assignment.id}/publish`, {
    headers: teacherHeaders,
  });
  expect(publishResponse.ok()).toBe(true);

  const submitResponse = await request.post(`${apiBaseUrl}/student/learning/assignments/${assignment.id}/submission`, {
    headers: studentHeaders,
    data: {
      studentId: "student-minh-anh",
      enrollmentId: "enrollment-if-2609-minh-anh",
      answer: "Bài làm kiểm thử liên thông.",
      lifecycle: "submitted",
    },
  });
  expect(submitResponse.ok()).toBe(true);
  const submission = (await submitResponse.json()) as { id: string };
  createdSubmissionId = submission.id;

  const gradeResponse = await request.post(
    `${apiBaseUrl}/teacher/learning/assignments/${assignment.id}/submissions/${submission.id}/grade`,
    {
      headers: teacherHeaders,
      data: { score: 9, feedback: "Đạt yêu cầu kiểm thử.", publicationStatus: "published" },
    },
  );
  expect(gradeResponse.ok()).toBe(true);

  await page.goto("/student/scores");
  const studentScoreRow = page.getByRole("row").filter({ hasText: title });
  await expect(studentScoreRow).toBeVisible();
  await expect(studentScoreRow).toContainText("9/10");

  await page.goto("/parent/classes/if-2609");
  const scoreRows = page.getByRole("row").filter({ hasText: "9/10" });
  await expect(scoreRows).toHaveCount(1);
  await expect(scoreRows.first()).toContainText(title);
  await expect(page.getByRole("row").filter({ hasText: "Buổi 1" })).not.toContainText("9/10");
  await expect(page.getByRole("row").filter({ hasText: "Buổi 6" })).not.toContainText("9/10");
});
