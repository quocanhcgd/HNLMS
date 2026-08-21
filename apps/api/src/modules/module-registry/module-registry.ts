import {
  resolveEffectiveState,
  resolveModuleDependencies,
  type EffectiveModuleState,
  type ModuleManifest,
} from "@hnlms/module-sdk";

export type ModuleRegistryInput = {
  installedModuleKeys: ReadonlySet<string>;
  configuredModuleKeys: ReadonlySet<string>;
  licensedFeatureKeys: ReadonlySet<string>;
};

export class ModuleRegistry {
  private readonly manifestsByKey: ReadonlyMap<string, ModuleManifest>;
  private readonly orderedModuleKeys: readonly string[];

  constructor(manifests: readonly ModuleManifest[]) {
    const dependencyResolution = resolveModuleDependencies(manifests);
    this.manifestsByKey = new Map(manifests.map((manifest) => [manifest.key, manifest]));
    this.orderedModuleKeys = dependencyResolution.orderedModuleKeys;
  }

  getManifest(moduleKey: string): ModuleManifest | undefined {
    return this.manifestsByKey.get(moduleKey);
  }

  listManifests(): readonly ModuleManifest[] {
    return this.orderedModuleKeys.map((moduleKey) => this.manifestsByKey.get(moduleKey)!);
  }

  resolveEffectiveStates(input: ModuleRegistryInput): readonly EffectiveModuleState[] {
    const effectiveModuleKeys = new Set<string>();
    const states: EffectiveModuleState[] = [];
    for (const moduleKey of this.orderedModuleKeys) {
      const manifest = this.manifestsByKey.get(moduleKey)!;
      const state = resolveEffectiveState(
        manifest,
        input.installedModuleKeys,
        input.configuredModuleKeys,
        input.licensedFeatureKeys,
        effectiveModuleKeys,
      );
      states.push(state);
      if (state.effectiveEnabled) effectiveModuleKeys.add(moduleKey);
    }
    return states;
  }

  resolveEffectiveState(moduleKey: string, input: ModuleRegistryInput): EffectiveModuleState | undefined {
    return this.resolveEffectiveStates(input).find((state) => state.moduleKey === moduleKey);
  }
}
