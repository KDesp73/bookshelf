import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { BlogPost } from "@/models/BlogPost";
import { User } from "@/models/User";

const STATIC_ROUTES: { path: string; priority?: number; changeFrequency?: "daily" | "weekly" | "monthly" }[] = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/add", priority: 0.6, changeFrequency: "monthly" },
  { path: "/community", priority: 0.7, changeFrequency: "weekly" },
  { path: "/discover", priority: 0.8, changeFrequency: "daily" },
  { path: "/news", priority: 0.7, changeFrequency: "weekly" },
  { path: "/rankings", priority: 0.6, changeFrequency: "weekly" },
  { path: "/scan", priority: 0.5, changeFrequency: "monthly" },
  { path: "/search", priority: 0.6, changeFrequency: "weekly" },
  { path: "/wishlist", priority: 0.5, changeFrequency: "weekly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    priority,
    changeFrequency,
  }));

  try {
    await connectDB();

    const [blogPosts, users] = await Promise.all([
      BlogPost.find({ published: true }, "slug updatedAt").lean(),
      User.find({}, "username createdAt").lean(),
    ]);

    const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${siteUrl}/news/${post.slug}`,
      lastModified: post.updatedAt,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    }));

    const userEntries: MetadataRoute.Sitemap = users.map((user) => ({
      url: `${siteUrl}/u/${user.username}`,
      lastModified: user.createdAt,
      priority: 0.5,
      changeFrequency: "weekly" as const,
    }));

    return [...staticEntries, ...blogEntries, ...userEntries];
  } catch {
    return staticEntries;
  }
}
