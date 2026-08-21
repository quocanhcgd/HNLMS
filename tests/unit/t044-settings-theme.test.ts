import { describe, expect, it } from "vitest";
import {
  InMemoryOrganizationBranchRepository,
  OrganizationBranchService,
} from "../../apps/api/src/modules/organization-branch/service";
import { defaultThemePreset } from "../../apps/web/src/lib/theme/preset";

describe("T044 organization settings and theme service", () => {
  const context = { organizationId: "org-a", userId: "user-a" };
  it("keeps settings isolated and uses optimistic versions", async () => {
    const service = new OrganizationBranchService(new InMemoryOrganizationBranchRepository());
    await service.saveSetting(context, "timezone", "Asia/Ho_Chi_Minh");
    expect(await service.getSetting(context, "timezone")).toMatchObject({ value: "Asia/Ho_Chi_Minh", version: 1 });
    await expect(service.saveSetting(context, "timezone", "UTC", 0)).rejects.toThrow("setting_version_conflict");
    expect(await service.getSetting({ ...context, organizationId: "org-b" }, "timezone")).toBeUndefined();
  });
  it("previews, publishes and rolls back only within the organization", async () => {
    const service = new OrganizationBranchService(new InMemoryOrganizationBranchRepository());
    const draft = await service.previewTheme(context, { ...defaultThemePreset, key: "hnlms-high-contrast" });
    expect(draft.status).toBe("draft");
    expect(await service.publishTheme(context, draft.version)).toMatchObject({ status: "published" });
    const secondDraft = await service.previewTheme(context, {
      ...defaultThemePreset,
      key: "hnlms-operational",
      version: 2,
    });
    await service.publishTheme(context, secondDraft.version);
    expect(await service.rollbackTheme(context, draft.version)).toMatchObject({
      key: "hnlms-high-contrast",
      status: "published",
    });
    await expect(service.rollbackTheme({ ...context, organizationId: "org-b" }, draft.version)).rejects.toThrow(
      "theme_published_version_not_found",
    );
  });
});
