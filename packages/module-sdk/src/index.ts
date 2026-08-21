export type ModuleNavigationItem = {
  key: string;
  route: string;
  label: string;
};

export type ModuleMigration = {
  id: string;
  version: string;
};

export type ModuleJob = {
  key: string;
};

export type ModuleEvent = {
  key: string;
};

export type ModuleManifest = {
  key: string;
  version: string;
  core?: boolean;
  dependencies: readonly string[];
  licenseFeatureKey: string;
  permissions: readonly string[];
  routes?: readonly string[];
  navigation?: readonly ModuleNavigationItem[];
  migrations?: readonly ModuleMigration[];
  jobs?: readonly ModuleJob[];
  events?: readonly ModuleEvent[];
};

export type EffectiveModuleStateReason =
  "enabled" | "module_not_installed" | "disabled_by_configuration" | "missing_entitlement" | "dependency_not_effective";

export type EffectiveModuleState = {
  moduleKey: string;
  installed: boolean;
  configuredEnabled: boolean;
  licensedEnabled: boolean;
  dependencySatisfied: boolean;
  effectiveEnabled: boolean;
  reason: EffectiveModuleStateReason;
};

export type ManifestValidationIssueCode =
  | "invalid_module_key"
  | "invalid_version"
  | "invalid_license_feature_key"
  | "duplicate_dependency"
  | "self_dependency"
  | "invalid_permission"
  | "duplicate_permission"
  | "invalid_route"
  | "duplicate_route"
  | "invalid_navigation_key"
  | "invalid_navigation_route"
  | "duplicate_navigation_key"
  | "invalid_migration_id"
  | "invalid_migration_version"
  | "duplicate_migration_id"
  | "invalid_job_key"
  | "duplicate_job_key"
  | "invalid_event_key"
  | "duplicate_event_key";

export type ManifestValidationIssue = {
  code: ManifestValidationIssueCode;
  message: string;
};

export class ModuleManifestValidationError extends Error {
  readonly name = "ModuleManifestValidationError";

  constructor(readonly issues: readonly ManifestValidationIssue[]) {
    super(`Invalid module manifest: ${issues.map((issue) => issue.code).join(", ")}`);
  }
}

export type ModuleDependencyResolution = {
  orderedModuleKeys: readonly string[];
};

export class ModuleDependencyResolutionError extends Error {
  readonly name = "ModuleDependencyResolutionError";

  constructor(
    readonly code: "duplicate_module_key" | "missing_dependency" | "dependency_cycle",
    readonly moduleKeys: readonly string[],
  ) {
    super(`${code}: ${moduleKeys.join(" -> ")}`);
  }
}

const moduleKeyPattern = /^[a-z][a-z0-9-]*$/;
const versionPattern = /^\d+(?:\.\d+){0,2}(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const routePattern = /^\//;

export function validateModuleManifest(manifest: ModuleManifest): readonly ManifestValidationIssue[] {
  const issues: ManifestValidationIssue[] = [];
  validateKey(manifest.key, "invalid_module_key", "module key", issues);
  if (!versionPattern.test(manifest.version)) addIssue(issues, "invalid_version", "version must be a semantic version");
  validateKey(manifest.licenseFeatureKey, "invalid_license_feature_key", "license feature key", issues);
  validateUniqueKeys(manifest.dependencies, "dependency", "duplicate_dependency", issues);
  for (const dependency of manifest.dependencies) {
    validateKey(dependency, "invalid_module_key", "dependency", issues);
    if (dependency === manifest.key) addIssue(issues, "self_dependency", "module cannot depend on itself");
  }
  validateUniqueKeys(manifest.permissions, "permission", "duplicate_permission", issues);
  for (const permission of manifest.permissions) validateKey(permission, "invalid_permission", "permission", issues);
  validateUniqueKeys(manifest.routes ?? [], "route", "duplicate_route", issues);
  for (const route of manifest.routes ?? []) {
    if (!routePattern.test(route)) addIssue(issues, "invalid_route", "route must start with '/'");
  }
  validateUniqueKeys(
    manifest.navigation?.map((item) => item.key) ?? [],
    "navigation key",
    "duplicate_navigation_key",
    issues,
  );
  for (const item of manifest.navigation ?? []) {
    validateKey(item.key, "invalid_navigation_key", "navigation key", issues);
    if (!routePattern.test(item.route))
      addIssue(issues, "invalid_navigation_route", "navigation route must start with '/'");
  }
  validateUniqueKeys(
    manifest.migrations?.map((migration) => migration.id) ?? [],
    "migration id",
    "duplicate_migration_id",
    issues,
  );
  for (const migration of manifest.migrations ?? []) {
    validateNonEmpty(migration.id, "invalid_migration_id", "migration id", issues);
    if (!versionPattern.test(migration.version)) {
      addIssue(issues, "invalid_migration_version", "migration version must be a semantic version");
    }
  }
  validateUniqueKeys(manifest.jobs?.map((job) => job.key) ?? [], "job key", "duplicate_job_key", issues);
  for (const job of manifest.jobs ?? []) validateKey(job.key, "invalid_job_key", "job key", issues);
  validateUniqueKeys(manifest.events?.map((event) => event.key) ?? [], "event key", "duplicate_event_key", issues);
  for (const event of manifest.events ?? []) validateKey(event.key, "invalid_event_key", "event key", issues);
  return issues;
}

export function assertValidModuleManifest(manifest: ModuleManifest): ModuleManifest {
  const issues = validateModuleManifest(manifest);
  if (issues.length > 0) throw new ModuleManifestValidationError(issues);
  return manifest;
}

export function resolveModuleDependencies(manifests: readonly ModuleManifest[]): ModuleDependencyResolution {
  const manifestsByKey = new Map<string, ModuleManifest>();
  for (const manifest of manifests) {
    assertValidModuleManifest(manifest);
    if (manifestsByKey.has(manifest.key)) {
      throw new ModuleDependencyResolutionError("duplicate_module_key", [manifest.key]);
    }
    manifestsByKey.set(manifest.key, manifest);
  }

  for (const manifest of manifests) {
    for (const dependency of manifest.dependencies) {
      if (!manifestsByKey.has(dependency)) {
        throw new ModuleDependencyResolutionError("missing_dependency", [manifest.key, dependency]);
      }
    }
  }

  const orderedModuleKeys: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const visit = (moduleKey: string): void => {
    if (visited.has(moduleKey)) return;
    if (visiting.has(moduleKey)) {
      const cycleStart = stack.indexOf(moduleKey);
      throw new ModuleDependencyResolutionError("dependency_cycle", [...stack.slice(cycleStart), moduleKey]);
    }
    visiting.add(moduleKey);
    stack.push(moduleKey);
    for (const dependency of manifestsByKey.get(moduleKey)!.dependencies) visit(dependency);
    stack.pop();
    visiting.delete(moduleKey);
    visited.add(moduleKey);
    orderedModuleKeys.push(moduleKey);
  };
  for (const manifest of manifests) visit(manifest.key);
  return { orderedModuleKeys };
}

export function resolveEffectiveState(
  manifest: ModuleManifest,
  installed: ReadonlySet<string>,
  configured: ReadonlySet<string>,
  licensed: ReadonlySet<string>,
  effectiveDependencies: ReadonlySet<string>,
): EffectiveModuleState {
  const installedOk = installed.has(manifest.key);
  const configuredOk = manifest.core === true || configured.has(manifest.key);
  const licensedOk = manifest.core === true || licensed.has(manifest.licenseFeatureKey);
  const dependenciesOk = manifest.dependencies.every((dependency) => effectiveDependencies.has(dependency));
  const effectiveEnabled = installedOk && configuredOk && licensedOk && dependenciesOk;
  const reason: EffectiveModuleStateReason = !installedOk
    ? "module_not_installed"
    : !configuredOk
      ? "disabled_by_configuration"
      : !licensedOk
        ? "missing_entitlement"
        : !dependenciesOk
          ? "dependency_not_effective"
          : "enabled";
  return {
    moduleKey: manifest.key,
    installed: installedOk,
    configuredEnabled: configuredOk,
    licensedEnabled: licensedOk,
    dependencySatisfied: dependenciesOk,
    effectiveEnabled,
    reason,
  };
}

function addIssue(issues: ManifestValidationIssue[], code: ManifestValidationIssueCode, message: string): void {
  issues.push({ code, message });
}

function validateKey(
  value: string,
  code: ManifestValidationIssueCode,
  label: string,
  issues: ManifestValidationIssue[],
): void {
  if (!moduleKeyPattern.test(value)) addIssue(issues, code, `${label} must use lowercase kebab-case`);
}

function validateNonEmpty(
  value: string,
  code: ManifestValidationIssueCode,
  label: string,
  issues: ManifestValidationIssue[],
): void {
  if (value.trim().length === 0) addIssue(issues, code, `${label} must not be empty`);
}

function validateUniqueKeys(
  values: readonly string[],
  label: string,
  code: ManifestValidationIssueCode,
  issues: ManifestValidationIssue[],
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) addIssue(issues, code, `${label} must be unique`);
    seen.add(value);
  }
}
