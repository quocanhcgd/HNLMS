import { resolveEffectiveState, type EffectiveModuleState, type ModuleManifest } from "@hnlms/module-sdk";

export type OrganizationModule = ModuleManifest & {
  name: string;
  description: string;
  category: string;
};

export type OrganizationModuleContext = {
  installedModuleKeys: ReadonlySet<string>;
  configuredModuleKeys: ReadonlySet<string>;
  licensedFeatureKeys: ReadonlySet<string>;
};

export const organizationModules: readonly OrganizationModule[] = [
  {
    key: "identity",
    version: "1.0.0",
    name: "Identity & access",
    description: "Sign-in, roles, scope grants and organization membership.",
    category: "Foundation",
    core: true,
    dependencies: [],
    licenseFeatureKey: "identity",
    permissions: [],
  },
  {
    key: "organization",
    version: "1.0.0",
    name: "Organization",
    description: "Branches, settings, brand theme and organization administration.",
    category: "Foundation",
    core: true,
    dependencies: ["identity"],
    licenseFeatureKey: "organization",
    permissions: [],
  },
  {
    key: "admission",
    version: "1.0.0",
    name: "Admissions",
    description: "Leads, consultations and enrollment handoff.",
    category: "Growth",
    dependencies: ["organization"],
    licenseFeatureKey: "admission",
    permissions: [],
  },
  {
    key: "academic",
    version: "1.0.0",
    name: "Academic operations",
    description: "Programs, courses, classes and schedules.",
    category: "Learning",
    dependencies: ["organization"],
    licenseFeatureKey: "academic",
    permissions: [],
  },
  {
    key: "learning",
    version: "1.0.0",
    name: "Learning experience",
    description: "Learning content, library and learner progress.",
    category: "Learning",
    dependencies: ["academic"],
    licenseFeatureKey: "learning",
    permissions: [],
  },
  {
    key: "finance",
    version: "1.0.0",
    name: "Finance",
    description: "Invoices, payments and receivables.",
    category: "Operations",
    dependencies: ["organization"],
    licenseFeatureKey: "finance",
    permissions: [],
  },
  {
    key: "reporting",
    version: "1.0.0",
    name: "Reporting",
    description: "Scoped dashboards and operational reports.",
    category: "Operations",
    dependencies: ["organization"],
    licenseFeatureKey: "reporting",
    permissions: [],
  },
];

export const defaultOrganizationModuleContext: OrganizationModuleContext = {
  installedModuleKeys: new Set(organizationModules.map((module) => module.key)),
  configuredModuleKeys: new Set(["admission", "academic", "learning", "finance", "reporting"]),
  licensedFeatureKeys: new Set(["admission", "academic", "learning", "finance", "reporting"]),
};

export function resolveOrganizationModuleStates(context: OrganizationModuleContext): readonly EffectiveModuleState[] {
  const effectiveModuleKeys = new Set<string>();
  return organizationModules.map((manifest) => {
    const state = resolveEffectiveState(
      manifest,
      context.installedModuleKeys,
      context.configuredModuleKeys,
      context.licensedFeatureKeys,
      effectiveModuleKeys,
    );
    if (state.effectiveEnabled) effectiveModuleKeys.add(manifest.key);
    return state;
  });
}

export function setConfiguredModule(
  context: OrganizationModuleContext,
  moduleKey: string,
  enabled: boolean,
): OrganizationModuleContext {
  const configuredModuleKeys = new Set(context.configuredModuleKeys);
  if (enabled) configuredModuleKeys.add(moduleKey);
  else configuredModuleKeys.delete(moduleKey);
  return { ...context, configuredModuleKeys };
}

export function getModuleReason(state: EffectiveModuleState): string {
  switch (state.reason) {
    case "enabled":
      return "Enabled by organization configuration, license entitlement and dependencies.";
    case "module_not_installed":
      return "This module is not installed in this tenant.";
    case "disabled_by_configuration":
      return "An organization administrator has disabled this module.";
    case "missing_entitlement":
      return "The current license does not include this module entitlement.";
    case "dependency_not_effective":
      return "A required dependency is not effective, so this module cannot run.";
  }
}
