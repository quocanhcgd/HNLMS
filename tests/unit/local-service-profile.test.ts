import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");
describe("local service profile", () => {
  it("defines required native services without credentials", () => {
    const profile = JSON.parse(fs.readFileSync(path.join(root, "infra/development/services.local.json"), "utf8")) as { services: Record<string, { port: number; required: boolean }>; secrets: string };
    expect(profile.services.postgres).toMatchObject({ port: 5432, required: true });
    expect(profile.services.redis).toMatchObject({ port: 6379, required: true });
    expect(profile.services.objectStorage).toMatchObject({ port: 9000, required: false });
    expect(profile.secrets).toContain("never commit");
    expect(fs.existsSync(path.join(root, "infra/development/check-services.ps1"))).toBe(true);
    expect(fs.existsSync(path.join(root, "infra/development/check-services.sh"))).toBe(true);
  });
});
