import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean)
  .filter((file) => !file.startsWith(".git/") && !file.includes("node_modules/") && !file.endsWith(".lock"))
  .filter((file) => !file.endsWith(".env.example") && !file.endsWith(".example"));
const rules = [
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/i },
  { name: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/ },
  { name: "database credential", pattern: /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/i },
  { name: "production secret assignment", pattern: /(?:PROD|PRODUCTION|LIVE)_[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|KEY)\s*[:=]\s*['"]?[^\s'"`]{8,}/i },
];
const findings = [];
for (const file of files) {
  let content;
  try { content = readFileSync(file, "utf8"); } catch { continue; }
  for (const rule of rules) if (rule.pattern.test(content)) findings.push(`${file}: ${rule.name}`);
}
if (findings.length) {
  console.error("Potential secrets found in tracked files:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}
console.log(`Secret scan passed (${files.length} tracked files checked)`);
