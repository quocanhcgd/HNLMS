import { describe, expect, it } from "vitest";
import {
  defaultOrganizationModuleContext,
  getModuleReason,
  resolveOrganizationModuleStates,
  setConfiguredModule,
} from "../../apps/web/src/app/admin/modules/module-state";

describe("organization module state foundation", () => {
  it("uses the canonical effective-state rules for configuration and dependencies", () => {
    const states = resolveOrganizationModuleStates(defaultOrganizationModuleContext);
    expect(states.find((state) => state.moduleKey === "organization")).toMatchObject({
      effectiveEnabled: true,
      reason: "enabled",
    });

    const disabledAcademic = setConfiguredModule(defaultOrganizationModuleContext, "academic", false);
    const disabledStates = resolveOrganizationModuleStates(disabledAcademic);
    expect(disabledStates.find((state) => state.moduleKey === "academic")).toMatchObject({
      effectiveEnabled: false,
      reason: "disabled_by_configuration",
    });
    expect(disabledStates.find((state) => state.moduleKey === "learning")).toMatchObject({
      effectiveEnabled: false,
      reason: "dependency_not_effective",
    });
  });

  it("explains entitlement and dependency blockers without changing license state", () => {
    const context = {
      ...defaultOrganizationModuleContext,
      licensedFeatureKeys: new Set(["admission", "academic", "learning", "reporting"]),
    };
    const states = resolveOrganizationModuleStates(context);
    const finance = states.find((state) => state.moduleKey === "finance")!;
    expect(finance).toMatchObject({ effectiveEnabled: false, reason: "missing_entitlement" });
    expect(getModuleReason(finance)).toContain("license");
  });

  it("keeps core modules enabled and not user-toggleable by state", () => {
    const state = resolveOrganizationModuleStates({
      ...defaultOrganizationModuleContext,
      configuredModuleKeys: new Set(),
      licensedFeatureKeys: new Set(),
    }).find((item) => item.moduleKey === "organization");
    expect(state).toMatchObject({ configuredEnabled: true, licensedEnabled: true, effectiveEnabled: true });
  });
});
