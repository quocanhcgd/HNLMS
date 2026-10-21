import { createDevelopmentSeed, resetDevelopmentSeed, type DevelopmentSeed } from "@hnlms/test-fixtures";

export type SeedWriter = {
  reset: (seedKey: string, tables: readonly string[]) => Promise<void>;
  insert: (table: string, rows: readonly unknown[]) => Promise<void>;
};

/** Adapter boundary: callers must run reset + inserts in one transaction. */
export async function seedDevelopmentData(writer: SeedWriter, seed = createDevelopmentSeed()): Promise<DevelopmentSeed> {
  const reset = resetDevelopmentSeed(seed.seedKey);
  await writer.reset(reset.seedKey, reset.order);
  await writer.insert("organizations", seed.organizations);
  await writer.insert("branches", seed.branches);
  await writer.insert("personas", seed.personas);
  await writer.insert("media", seed.media);
  return seed;
}

export { createDevelopmentSeed, resetDevelopmentSeed } from "@hnlms/test-fixtures";
