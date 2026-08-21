import type { LicenseDocument } from "@hnlms/license-contracts";
import type { EffectiveModuleState, ModuleNavigationItem } from "@hnlms/module-sdk";
import { LicenseRuntime, type LicenseRuntimeState } from "../../modules/license-runtime";
import { ModuleRegistry, type ModuleRegistryInput } from "../../modules/module-registry";

export type ModuleGuardContext = ModuleRegistryInput & {
  organizationId: string;
  license?: LicenseDocument;
  quotaUsedByFeatureKey?: ReadonlyMap<string, number>;
};

export type ModuleGuardDecision = {
  moduleKey: string;
  allowed: boolean;
  reason: "enabled" | "module_not_registered" | EffectiveModuleState["reason"] | LicenseRuntimeState["quota"]["reason"];
  state?: EffectiveModuleState;
  license?: LicenseRuntimeState;
};

export class ModuleGuardDeniedError extends Error {
  readonly name = "ModuleGuardDeniedError";

  constructor(readonly decision: ModuleGuardDecision) {
    super(`Module access denied for ${decision.moduleKey}: ${decision.reason}`);
  }
}

/**
 * Enforces the effective module state for HTTP routes and exposes the same state
 * for navigation composition. It deliberately does not replace authorization;
 * callers must run their scope/permission guard independently.
 */
export class ModuleLicenseGuard {
  constructor(
    private readonly registry: ModuleRegistry,
    private readonly licenseRuntime: LicenseRuntime,
  ) {}

  evaluate(moduleKey: string, context: ModuleGuardContext): ModuleGuardDecision {
    const manifest = this.registry.getManifest(moduleKey);
    if (!manifest) return { moduleKey, allowed: false, reason: "module_not_registered" };

    const licenseStates = this.evaluateLicenseStates(context);
    const licensedFeatureKeys = new Set<string>();
    for (const [featureKey, license] of licenseStates) {
      if (license.entitlement.enabled) licensedFeatureKeys.add(featureKey);
    }
    const state = this.registry.resolveEffectiveState(moduleKey, {
      installedModuleKeys: context.installedModuleKeys,
      configuredModuleKeys: context.configuredModuleKeys,
      licensedFeatureKeys,
    })!;
    if (!state.effectiveEnabled) return { moduleKey, allowed: false, reason: state.reason, state };

    const license = licenseStates.get(manifest.licenseFeatureKey);
    if (license && !license.quota.allowed) {
      return { moduleKey, allowed: false, reason: license.quota.reason, state, license };
    }
    return { moduleKey, allowed: true, reason: "enabled", state, license };
  }

  assertModule(moduleKey: string, context: ModuleGuardContext): void {
    const decision = this.evaluate(moduleKey, context);
    if (!decision.allowed) throw new ModuleGuardDeniedError(decision);
  }

  assertRoute(route: string, context: ModuleGuardContext): string {
    const manifest = this.registry
      .listManifests()
      .find((candidate) => (candidate.routes ?? []).some((prefix) => routeMatches(prefix, route)));
    if (!manifest)
      throw new ModuleGuardDeniedError({ moduleKey: "unknown", allowed: false, reason: "module_not_registered" });
    this.assertModule(manifest.key, context);
    return manifest.key;
  }

  navigation(context: ModuleGuardContext): readonly ModuleNavigationItem[] {
    return this.registry
      .listManifests()
      .flatMap((manifest) => (this.evaluate(manifest.key, context).allowed ? (manifest.navigation ?? []) : []));
  }

  private evaluateLicenseStates(context: ModuleGuardContext): ReadonlyMap<string, LicenseRuntimeState> {
    const states = new Map<string, LicenseRuntimeState>();
    if (!context.license || context.license.organizationId !== context.organizationId) return states;
    for (const manifest of this.registry.listManifests()) {
      if (manifest.core || states.has(manifest.licenseFeatureKey)) continue;
      states.set(
        manifest.licenseFeatureKey,
        this.licenseRuntime.evaluate(
          context.license,
          manifest.licenseFeatureKey,
          context.quotaUsedByFeatureKey?.get(manifest.licenseFeatureKey) ?? 0,
        ),
      );
    }
    return states;
  }
}

function routeMatches(prefix: string, route: string): boolean {
  return route === prefix || route.startsWith(`${prefix}/`);
}
