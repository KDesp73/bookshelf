export function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "post";
}

export async function ensureUniqueSlug(
  baseSlug: string,
  exists: (slug: string, excludeId?: string) => Promise<boolean>,
  excludeId?: string,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;

  while (await exists(slug, excludeId)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
    if (suffix > 100) break;
  }

  return slug;
}
