import type { MetadataRoute } from "next";

// Update to the real domain when deployed
const siteUrl = "https://medibook.example.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private, session-only areas out of search results
      disallow: ["/dashboard", "/booking", "/doctor", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
