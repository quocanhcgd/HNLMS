import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../..");

describe("repository toolchain policy", () => {
  it("uses npm lockfile and pins the supported Node line", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as {
      packageManager?: string;
      engines?: { node?: string };
      workspaces?: string[];
    };
    expect(pkg.packageManager).toBe("npm@10.5.0");
    expect(pkg.engines?.node).toBe(">=20.19 <21");
    expect(pkg.workspaces).toEqual(["apps/*", "worker", "packages/*"]);
    expect(fs.existsSync(path.join(root, "package-lock.json"))).toBe(true);
    expect(fs.existsSync(path.join(root, "pnpm-workspace.yaml"))).toBe(false);
    expect(fs.readFileSync(path.join(root, ".nvmrc"), "utf8").trim()).toBe("20.19.0");
  });
});
