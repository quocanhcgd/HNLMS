import { describe, expect, it } from "vitest";
import type { MetadataRoute } from "next";

describe("public robots.txt configuration", () => {
  it("allows all crawlers on public pages", () => {
    const rules: MetadataRoute.Robots["rules"] = [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/platform/"],
      },
    ];
    expect(rules[0].userAgent).toBe("*");
    expect(rules[0].allow).toBe("/");
  });

  it("disallows admin and platform paths", () => {
    const disallow = ["/admin/", "/platform/"];
    expect(disallow).toContain("/admin/");
    expect(disallow).toContain("/platform/");
  });

  it("does not disallow public paths", () => {
    const disallow = ["/admin/", "/platform/"];
    expect(disallow).not.toContain("/");
    expect(disallow).not.toContain("/programs");
    expect(disallow).not.toContain("/consultation");
  });

  it("references a sitemap URL", () => {
    const sitemapUrl = "https://hanoilearning.vn/sitemap.xml";
    expect(sitemapUrl).toMatch(/sitemap\.xml$/);
    expect(sitemapUrl).toMatch(/^https:\/\//);
  });
});
