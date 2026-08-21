import { describe, expect, it } from "vitest";
import { accessNavigation, accessPermissionGroups } from "./access-data";

describe("admin access foundation", () => {
  it("offers separate role and scope-grant workspaces", () => {
    expect(accessNavigation.map((item) => item.key)).toEqual(["roles", "scope-grants"]);
  });

  it("keeps permissions grouped by domain for the assignment UI", () => {
    expect(accessPermissionGroups.map((group) => group.key)).toEqual(["organization", "users", "learning", "finance"]);
    expect(accessPermissionGroups.flatMap((group) => group.permissions)).toContain("users:assign");
  });
});
