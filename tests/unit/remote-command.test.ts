import { describe, expect, it } from "vitest";
import { githubIssueUrl, validateRemoteCommand } from "@hnlms/domain-contracts";

describe("remote command policy", () => {
  const base = {
    id: "cmd-1",
    taskId: "T024",
    action: "start_task" as const,
    status: "queued" as const,
    requestedBy: "quocanhcgd",
    createdAt: new Date().toISOString(),
    allowedOperations: ["read_repository", "run_tests"] as const,
  };
  it("allows only whitelisted actions/operations", () => {
    expect(validateRemoteCommand(base).valid).toBe(true);
    expect(validateRemoteCommand({ ...base, action: "arbitrary_shell" as never }).valid).toBe(false);
  });
  it("rejects malformed task ids and creates issue links without tokens", () => {
    expect(validateRemoteCommand({ ...base, taskId: "rm -rf" }).valid).toBe(false);
    const url = githubIssueUrl(base);
    expect(url).toContain("issues/new");
    expect(url).not.toContain("ghp_");
  });
});
