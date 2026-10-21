import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const allowed = /^(MIT|ISC|BSD(?:-[0-9]-Clause)?|Apache-2\.0|0BSD|CC0-1\.0|Unlicense|Python-2\.0)$/;
const packages = new Set();
for (const workspace of ["apps/api", "apps/web", "worker"]) {
  const packageJson = JSON.parse(readFileSync(`${workspace}/package.json`, "utf8"));
  for (const name of Object.keys(packageJson.dependencies ?? {})) packages.add(name);
}
const findings = [];
for (const name of packages) {
  const packagePaths = [
    resolve("node_modules", name, "package.json"),
    ...["apps/api", "apps/web", "worker"].map((workspace) => resolve(workspace, "node_modules", name, "package.json")),
  ];
  const packagePath = packagePaths.find((candidate) => existsSync(candidate));
  if (!packagePath) { findings.push(`${name}: package metadata unavailable`); continue; }
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  if (packageJson.private || name.startsWith("@hnlms/")) continue;
  const license = typeof packageJson.license === "string" ? packageJson.license : undefined;
  if (!license || !allowed.test(license)) findings.push(`${name}: ${license ?? "missing license"}`);
}
if (findings.length) {
  console.error("Dependency license policy failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log(`Dependency license scan passed (${packages.size} direct runtime dependencies checked)`);
