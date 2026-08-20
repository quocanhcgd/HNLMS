export type ModuleManifest = {
    key: string;
    version: string;
    core?: boolean;
    dependencies: readonly string[];
    licenseFeatureKey: string;
    permissions: readonly string[];
};
export type EffectiveModuleState = {
    moduleKey: string;
    installed: boolean;
    configuredEnabled: boolean;
    licensedEnabled: boolean;
    dependencySatisfied: boolean;
    effectiveEnabled: boolean;
    reason: string;
};
export declare function resolveEffectiveState(manifest: ModuleManifest, installed: Set<string>, configured: Set<string>, licensed: Set<string>, effectiveDependencies: Set<string>): EffectiveModuleState;
