import fs from "node:fs";
import { execFileSync } from "node:child_process";

const taskText = fs.readFileSync("specs/001-lms-multi-branch/tasks.md", "utf8");
const statusPath = "docs/project-status.json";
const previous = JSON.parse(fs.readFileSync(statusPath, "utf8"));
let phase = "Unassigned";
let purpose = "";
const tasks = [];
for (const line of taskText.split(/\r?\n/)) {
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
  });
}
const done = tasks.filter((task) => task.status === "done").length;
const phaseMap = new Map();
for (const task of tasks) {
  const item = phaseMap.get(task.phase) ?? { name: task.phase, done: 0, total: 0, percent: 0 };
  item.total += 1;
  if (task.status === "done") item.done += 1;
  item.percent = Number(((item.done / item.total) * 100).toFixed(1));
  phaseMap.set(task.phase, item);
}
const next = tasks.find((task) => task.status === "todo");
const currentId = process.env.STATUS_TASK ?? previous.currentTask?.id ?? next?.id;
const current = tasks.find((task) => task.id === currentId) ?? next;
const git = execFileSync("git", ["log", "-1", "--pretty=format:%h%n%s"], { encoding: "utf8" }).split("\n");
const now = new Date().toISOString();
const status = {
  ...previous,
  updatedAt: now,
  currentTask: {
    id: current?.id ?? "-",
    title: current?.description ?? "Không có task đang mở",
    phase: current?.phase ?? "-",
    status: process.env.STATUS_STATE ?? (current?.status === "done" ? "completed" : "next"),
    percent: Number(process.env.STATUS_PERCENT ?? previous.currentTask?.percent ?? 0),
    activity: process.env.STATUS_ACTIVITY ?? previous.currentTask?.activity ?? "Chờ bắt đầu task tiếp theo.",
    startedAt: previous.currentTask?.id === current?.id ? previous.currentTask?.startedAt : null,
    updatedAt: now,
  },
  nextTask: { id: next?.id ?? "-", title: next?.description ?? "Không còn task", percent: 0 },
  overall: { done, total: tasks.length, percent: Number(((done / tasks.length) * 100).toFixed(1)) },
  phases: [...phaseMap.values()],
  lastCommit: { sha: git[0], message: git[1], url: `https://github.com/quocanhcgd/HNLMS/commit/${git[0]}` },
};
fs.writeFileSync(statusPath, JSON.stringify(status, null, 2) + "\n");
console.log(`Updated ${statusPath}: ${done}/${tasks.length}, current ${status.currentTask.id}`);
