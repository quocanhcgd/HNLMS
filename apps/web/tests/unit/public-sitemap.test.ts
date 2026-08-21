import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { MetadataRoute } from "next";

vi.mock("@/features/public-catalog/catalog-data", () => ({
  programs: [
    { slug: "ielts-foundation", title: "IELTS Foundation", summary: "Test summary" },
    { slug: "ielts-advanced", title: "IELTS Advanced", summary: "Test summary" },
    { slug: "english-communication", title: "Tieng Anh giao tiep", summary: "Test summary" },
    { slug: "teen-english", title: "Tieng Anh thieu nien", summary: "Test summary" },
    { slug: "business-english", title: "Tieng Anh doanh nghiep", summary: "Test summary" },
    { slug: "academic-skills", title: "Ky nang hoc thuat", summary: "Test summary" },
  ],
}));

describe("public sitemap", () => {
  let sitemap: () => MetadataRoute.Sitemap;

  beforeAll(async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://hanoilearning.vn";
    const mod = await import("../../src/app/sitemap");
    sitemap = mod.default;
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("returns an array of sitemap entries", () => {
    const entries = sitemap();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
  });

  it("includes the root page with highest priority", () => {
    const entries = sitemap();
    const root = entries.find((e) => e.url === "https://hanoilearning.vn");
    expect(root).toBeDefined();
    expect(root!.priority).toBe(1);
    expect(root!.changeFrequency).toBe("weekly");
  });

  it("includes the programs listing page", () => {
    const entries = sitemap();
    const programsPage = entries.find((e) => e.url === "https://hanoilearning.vn/programs");
    expect(programsPage).toBeDefined();
    expect(programsPage!.priority).toBe(0.9);
  });

  it("includes the consultation page", () => {
    const entries = sitemap();
    const consultation = entries.find((e) => e.url === "https://hanoilearning.vn/consultation");
    expect(consultation).toBeDefined();
    expect(consultation!.priority).toBe(0.7);
  });

  it("generates entries for each program slug", () => {
    const entries = sitemap();
    const programUrls = entries
      .filter((e) => e.url.startsWith("https://hanoilearning.vn/programs/"))
      .map((e) => e.url);

    expect(programUrls).toContain("https://hanoilearning.vn/programs/ielts-foundation");
    expect(programUrls).toContain("https://hanoilearning.vn/programs/ielts-advanced");
    expect(programUrls).toContain("https://hanoilearning.vn/programs/english-communication");
    expect(programUrls).toContain("https://hanoilearning.vn/programs/teen-english");
    expect(programUrls).toContain("https://hanoilearning.vn/programs/business-english");
    expect(programUrls).toContain("https://hanoilearning.vn/programs/academic-skills");
  });

  it("all entries have lastModified as a Date", () => {
    const entries = sitemap();
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });

  it("uses default base URL when NEXT_PUBLIC_SITE_URL is not set", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    const freshMod = await import("../../src/app/sitemap");
    const entries = freshMod.default();
    expect(entries[0].url).toMatch(/^https?:\/\//);
    // Re-set for other tests
    process.env.NEXT_PUBLIC_SITE_URL = "https://hanoilearning.vn";
  });
});
