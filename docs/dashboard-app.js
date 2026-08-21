const STATUS_URL = "./project-status.json";
const TASKS = window.HNLMS_TASKS || [];
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  );
let statusData = null;

function renderTasks() {
  const query = $("#search").value.toLowerCase();
  const status = $("#status").value;
  const phase = $("#phase").value;
  const rows = TASKS.filter(
    (task) =>
      (!query ||
        [task.id, task.phase, task.description, task.paths.join(" ")].join(" ").toLowerCase().includes(query)) &&
      (status === "all" || task.status === status) &&
      (phase === "all" || task.phase === phase),
  );
  $("#rows").innerHTML = rows
    .map(
      (task) =>
        '<tr><td class="id">' +
        task.id +
        '</td><td class="phase">' +
        escapeHtml(task.phase) +
        '</td><td><span class="badge ' +
        task.status +
        '">' +
        (task.status === "done" ? "Đã xong" : "Chưa làm") +
        "</span></td><td>" +
        escapeHtml(task.description) +
        "</td><td>" +
        task.paths.map(escapeHtml).join("<br>") +
        '</td><td><div class="prompt">' +
        escapeHtml(task.prompt) +
        '</div></td><td><button class="copy" data-id="' +
        task.id +
        '">Copy</button></td></tr>',
    )
    .join("");
  $("#shown").textContent = rows.length + " task";
  document.querySelectorAll(".copy").forEach((button) => {
    button.onclick = () => navigator.clipboard.writeText(TASKS.find((task) => task.id === button.dataset.id).prompt);
  });
}

function renderStatus(status) {
  statusData = status;
  const currentPhase = status.phases?.find((phase) => phase.name === status.currentTask?.phase);
  $("#currentTask").textContent = (status.currentTask?.id || "-") + " · " + (status.currentTask?.title || "");
  $("#activity").textContent = status.currentTask?.activity || "Chưa cập nhật hoạt động";
  $("#currentState").textContent = status.currentTask?.status || "unknown";
  $("#currentState").className = "status-pill " + (status.currentTask?.status || "");
  $("#taskPercent").textContent = (status.currentTask?.percent || 0) + "%";
  $("#phasePercent").textContent = (currentPhase?.percent || 0) + "%";
  $("#overallPercent").textContent = (status.overall?.percent || 0) + "%";
  $("#taskBar").style.width = (status.currentTask?.percent || 0) + "%";
  $("#currentMeta").textContent = "Cập nhật trạng thái: " + new Date(status.updatedAt).toLocaleString("vi-VN");
  $("#doneSummary").textContent = (status.overall?.done || 0) + " / " + (status.overall?.total || 0) + " task";
  $("#phaseSummary").textContent =
    (currentPhase?.name || status.currentTask?.phase || "") +
    ": " +
    (currentPhase?.done || 0) +
    "/" +
    (currentPhase?.total || 0) +
    " (" +
    (currentPhase?.percent || 0) +
    "%)";
  $("#nextTask").textContent = (status.nextTask?.id || "-") + " · " + (status.nextTask?.title || "");
  $("#commitInfo").innerHTML = status.lastCommit
    ? 'Commit: <a class="link" href="' +
      status.lastCommit.url +
      '">' +
      status.lastCommit.sha +
      " · " +
      escapeHtml(status.lastCommit.message) +
      "</a>"
    : "";
  const queueUrl = "./remote-command-queue.json";
  fetch(queueUrl + "?t=" + Date.now(), { cache: "no-store" })
    .then((response) => response.json())
    .then((queue) => {
      $("#workspaceLock").textContent = queue.workspace?.locked
        ? "Workspace locked · " + queue.workspace.taskId + " · owner " + queue.workspace.owner
        : "Workspace available";
      $("#queueSummary").textContent = (queue.commands?.length || 0) + " command history item(s)";
    })
    .catch(() => {
      $("#workspaceLock").textContent = "Workspace state unavailable";
    });
  $("#blockers").innerHTML = status.blockers?.length
    ? status.blockers
        .map((blocker) => '<div class="blocker ' + blocker.severity + '">● ' + escapeHtml(blocker.text) + "</div>")
        .join("")
    : '<span class="muted">Không có blocker</span>';
  $("#total").textContent = status.overall?.total || TASKS.length;
  $("#done").textContent = status.overall?.done || 0;
  $("#todo").textContent = (status.overall?.total || 0) - (status.overall?.done || 0);
  $("#percent").textContent = (status.overall?.percent || 0) + "%";
  $("#focus").textContent = status.currentTask?.id || "-";
  const issueTitle = encodeURIComponent(`[${status.nextTask?.id || "TASK"}] start_task`);
  const issueBody = encodeURIComponent(
    `Requested task: ${status.nextTask?.id || ""}
Action: start_task

${status.nextTask?.title || ""}

Remote execution is subject to repository policy.`,
  );
  $("#remoteIssue").href =
    `https://github.com/quocanhcgd/HNLMS/issues/new?title=${issueTitle}&body=${issueBody}&labels=remote-command`;
  $("#phases").innerHTML = (status.phases || [])
    .map(
      (phase) =>
        '<div class="phase-card"><b>' +
        escapeHtml(phase.name) +
        '</b><span class="muted">' +
        phase.done +
        "/" +
        phase.total +
        " · " +
        phase.percent +
        '%</span><div class="progress"><i style="width:' +
        phase.percent +
        '%"></i></div></div>',
    )
    .join("");
  $("#syncDot").classList.remove("error");
  $("#syncText").textContent = "Đã đồng bộ " + new Date().toLocaleTimeString("vi-VN") + " · refresh 15s";
}

async function loadStatus() {
  try {
    const response = await fetch(STATUS_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    renderStatus(await response.json());
  } catch {
    $("#syncDot").classList.add("error");
    $("#syncText").textContent = "Mất kết nối status · thử lại sau 15s";
  }
}

const phaseElement = $("#phase");
[...new Set(TASKS.map((task) => task.phase))].forEach((phase) => {
  const option = document.createElement("option");
  option.value = phase;
  option.textContent = phase;
  phaseElement.append(option);
});
["search", "status", "phase"].forEach((id) => {
  $("#" + id).oninput = renderTasks;
});
$("#reload").onclick = loadStatus;
$("#copyNext").onclick = () => {
  const id = statusData?.nextTask?.id;
  const task = TASKS.find((item) => item.id === id) || TASKS.find((item) => item.status === "todo");
  if (task) navigator.clipboard.writeText(task.prompt);
};
renderTasks();
loadStatus();
setInterval(loadStatus, 15000);
