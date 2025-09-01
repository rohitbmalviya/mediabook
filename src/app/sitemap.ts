import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

// Update to the real domain when deployed
const siteUrl = "https://medibook.example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/doctors`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/register`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/login`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Every doctor's public profile gets its own sitemap entry
  const doctors = await db.doctorProfile.findMany({
    select: { id: true },
  });

  const doctorPages: MetadataRoute.Sitemap = doctors.map((doctor) => ({
    url: `${siteUrl}/doctors/${doctor.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...doctorPages];
}
