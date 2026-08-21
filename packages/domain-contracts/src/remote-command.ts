export type RemoteAction = "start_task" | "run_quality" | "generate_status" | "request_input";
export type RemoteCommandStatus =
  "queued" | "accepted" | "in_progress" | "waiting_for_input" | "completed" | "blocked" | "failed" | "cancelled";
export type RemoteCommand = {
  id: string;
  taskId: string;
  action: RemoteAction;
  status: RemoteCommandStatus;
  requestedBy: string;
  createdAt: string;
  prompt?: string;
  allowedOperations: readonly string[];
};
export const allowedRemoteActions: readonly RemoteAction[] = [
  "start_task",
  "run_quality",
  "generate_status",
  "request_input",
];
export const allowedOperations = ["read_repository", "write_source", "run_tests", "git_commit", "git_push"] as const;
export function validateRemoteCommand(command: RemoteCommand): { valid: boolean; reason?: string } {
  if (!allowedRemoteActions.includes(command.action)) return { valid: false, reason: "action_not_allowed" };
  if (!command.taskId.match(/^T\d{3}$/)) return { valid: false, reason: "invalid_task_id" };
  if (
    command.allowedOperations.some(
      (operation) => !allowedOperations.includes(operation as (typeof allowedOperations)[number]),
    )
  )
    return { valid: false, reason: "operation_not_allowed" };
  return { valid: true };
}
export function githubIssueUrl(command: Pick<RemoteCommand, "taskId" | "action" | "prompt">): string {
  const title = encodeURIComponent(`[${command.taskId}] ${command.action}`);
  const body = encodeURIComponent(
    `Requested task: ${command.taskId}\nAction: ${command.action}\n\n${command.prompt ?? ""}\n\nRemote execution is subject to repository policy.`,
  );
  return `https://github.com/quocanhcgd/HNLMS/issues/new?title=${title}&body=${body}&labels=remote-command`;
}
