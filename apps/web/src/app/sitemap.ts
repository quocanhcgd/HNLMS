import type { MetadataRoute } from "next";
import { programs } from "@/features/public-catalog/catalog-data";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hanoilearning.vn";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/programs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/consultation`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const programPages: MetadataRoute.Sitemap = programs.map((program) => ({
    url: `${baseUrl}/programs/${program.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...programPages];
}
