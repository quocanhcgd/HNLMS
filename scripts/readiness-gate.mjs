import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function evaluateChecklist(markdown, { production = false } = {}) {
  const allowedSections = new Set(
    production
      ? ["Critical Before Implementation", "Critical Before Production Data", "Product Release Gates"]
      : ["Critical Before Implementation"],
  );
  let section = "";
  const blockers = [];
  const checked = [];
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      section = heading[1].trim();
      continue;
    }
    const item = line.match(/^-\s+\[([ xX])\]\s+(.+)$/);
    if (!item || !allowedSections.has(section)) continue;
    const label = item[2].trim();
    if (item[1].toLowerCase() === "x") checked.push({ section, label });
    else blockers.push({ section, label });
  }
  return { production, passed: blockers.length === 0, checked, blockers };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const production = process.argv.includes("--production");
  const checklistPath = "specs/001-lms-multi-branch/checklists/full-stack-readiness.md";
  const result = evaluateChecklist(readFileSync(checklistPath, "utf8"), { production });
  console.log(JSON.stringify({ ...result, checklistPath }, null, 2));
  if (!result.passed) {
    console.error(`Readiness gate blocked (${result.blockers.length} unchecked item(s)).`);
    process.exit(1);
  }
  console.log(`Readiness gate passed (${result.checked.length} checked item(s)).`);
}
