"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEffectiveState = resolveEffectiveState;
function resolveEffectiveState(manifest, installed, configured, licensed, effectiveDependencies) {
    const installedOk = installed.has(manifest.key);
    const configuredOk = manifest.core === true || configured.has(manifest.key);
    const licensedOk = manifest.core === true || licensed.has(manifest.licenseFeatureKey);
    const dependenciesOk = manifest.dependencies.every((dependency) => effectiveDependencies.has(dependency));
    const effectiveEnabled = installedOk && configuredOk && licensedOk && dependenciesOk;
    const reason = !installedOk ? "module_not_installed" : !configuredOk ? "disabled_by_configuration" : !licensedOk ? "missing_entitlement" : !dependenciesOk ? "dependency_not_effective" : "enabled";
    return { moduleKey: manifest.key, installed: installedOk, configuredEnabled: configuredOk, licensedEnabled: licensedOk, dependencySatisfied: dependenciesOk, effectiveEnabled, reason };
}
