import fs from "node:fs";

const source = fs.readFileSync("specs/001-lms-multi-branch/tasks.md", "utf8");
let phase = "Unassigned";
let purpose = "";
const tasks = [];
for (const line of source.split(/\r?\n/)) {
  const heading = line.match(/^## (Phase \d+:.+)$/);
  if (heading) {
    phase = heading[1];
    purpose = "";
    continue;
  }
  const purposeMatch = line.match(/^\*\*(?:Purpose|Goal)\*\*: (.+)$/);
  if (purposeMatch) {
    purpose = purposeMatch[1];
    continue;
  }
  const match = line.match(/^- \[([ Xx])\] (T\d{3})(?: (\[P\]))?(?: (\[US\d+\]))? (.+)$/);
  if (!match) continue;
  const [, mark, id, parallel, story, raw] = match;
  const paths = [...raw.matchAll(/`([^`]+)`/g)].map((item) => item[1]);
  const description = raw
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  const prompt = `Bạn đang tiếp tục HN-LMS. Triển khai ${id}: ${raw}. Đọc constitution, PROJECT_MEMORY, ai-task-continuity và spec/plan/contracts liên quan. Kiểm tra git status, giữ thay đổi người dùng, chạy test phù hợp, cập nhật task/status/memory khi có bằng chứng và báo files/tests/blockers/next task.`;
  tasks.push({
    id,
    status: mark.toUpperCase() === "X" ? "done" : "todo",
    phase,
    purpose,
    parallel: Boolean(parallel),
    story: story ?? "",
    description,
    raw,
    paths,
    prompt,
  });
}
const taskJson = JSON.stringify(tasks).replace(/</g, "\\u003c");
const css = fs.readFileSync("scripts/task-dashboard.css", "utf8");
const body = fs.readFileSync("scripts/task-dashboard-body.html", "utf8");
const html =
  '<!doctype html>\n<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HN-LMS Coding Control Room</title><style>' +
  css +
  "</style></head><body>" +
  body +
  "<script>window.HNLMS_TASKS=" +
  taskJson +
  ';</script><script src="./dashboard-app.js"></script></body></html>\n';
fs.writeFileSync("docs/task-dashboard.html", html);
console.log(`Generated dashboard: ${tasks.length} tasks`);
