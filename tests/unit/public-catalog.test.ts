import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("public catalog pages", () => {
  it("renders published landing bands with Mantine compositions", () => {
    const landing = read("apps/web/src/app/(public)/page.tsx");
    expect(landing).toContain('id="programs"');
    expect(landing).toContain('id="branches"');
    expect(landing).toContain('id="team"');
    expect(landing).toContain('id="news"');
    expect(landing).toContain('id="consultation"');
    expect(landing).toContain("ProgramCard");
    expect(landing).toContain("SimpleGrid");
  });

  it("provides a catalog index and static program detail routes", () => {
    const catalog = read("apps/web/src/app/(public)/programs/page.tsx");
    const detail = read("apps/web/src/app/(public)/programs/[slug]/page.tsx");
    expect(catalog).toContain("programs.map");
    expect(detail).toContain("generateStaticParams");
    expect(detail).toContain("generateMetadata");
    expect(detail).toContain("notFound()");
  });

  it("keeps catalog content isolated to public route and feature boundaries", () => {
    const layout = read("apps/web/src/app/(public)/layout.tsx");
    const data = read("apps/web/src/features/public-catalog/catalog-data.ts");
    expect(layout).toContain('"./public-catalog.css"');
    expect(data).toContain("export const programs");
    expect(data).not.toContain("draft");
  });
});
