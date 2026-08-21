import type { ModuleManifest } from "@hnlms/module-sdk";

export type WorkerModuleAccessPolicy<Context> = {
  assertModule(moduleKey: string, context: Context): void;
};

export class UnknownModuleJobError extends Error {
  readonly name = "UnknownModuleJobError";

  constructor(readonly jobKey: string) {
    super(`No module manifest declares job ${jobKey}`);
  }
}

/** Ensures a worker can execute only a manifest-declared job for an effective module. */
export class WorkerModuleGuard<Context> {
  private readonly moduleKeyByJobKey = new Map<string, string>();

  constructor(
    manifests: readonly ModuleManifest[],
    private readonly accessPolicy: WorkerModuleAccessPolicy<Context>,
  ) {
    for (const manifest of manifests) {
      for (const job of manifest.jobs ?? []) this.moduleKeyByJobKey.set(job.key, manifest.key);
    }
  }

  assertJob(jobKey: string, context: Context): string {
    const moduleKey = this.moduleKeyByJobKey.get(jobKey);
    if (!moduleKey) throw new UnknownModuleJobError(jobKey);
    this.accessPolicy.assertModule(moduleKey, context);
    return moduleKey;
  }
}
