import type { BookMetadata } from "@/types/book";

export function normalizeMetadataList(
  values: Array<string | undefined | null>,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    if (!raw) continue;
    for (const part of raw.split(/[/;,]/)) {
      const item = part.trim();
      if (!item) continue;
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
      if (result.length >= 32) return result;
    }
  }

  return result;
}

export function parsePublishYear(publishedDate?: string): number | undefined {
  if (!publishedDate?.trim()) return undefined;
  const match = publishedDate.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  if (!match) return undefined;
  const year = Number(match[1]);
  if (!Number.isFinite(year)) return undefined;
  return year;
}

/** Build genres from categories only. Subjects are specific topics, not genres. */
export function buildGenres(categories: string[]): string[] {
  return normalizeMetadataList(categories);
}

export function mergeStringArrays(
  sources: Array<string[] | undefined>,
): string[] {
  return normalizeMetadataList(sources.flatMap((list) => list ?? []));
}

export function isEnrichableIsbn(isbn13: string): boolean {
  const trimmed = isbn13.trim();
  if (!trimmed) return false;
  if (/^manual(-import)?-/i.test(trimmed)) return false;
  const digits = trimmed.replace(/-/g, "");
  if (digits.length === 13) return /^\d{13}$/.test(digits);
  if (digits.length === 10) return /^\d{9}[\dX]$/i.test(digits);
  return false;
}

export type RecommendationFieldUpdate = Pick<
  BookMetadata,
  | "genres"
  | "subjects"
  | "categories"
  | "publishYear"
  | "openLibraryWorkKey"
  | "googleVolumeId"
> & {
  langCode?: string;
};

export function recommendationFieldsFromMetadata(
  meta: Partial<BookMetadata>,
): RecommendationFieldUpdate & { metadataEnrichedAt: Date } {
  const subjects = mergeStringArrays([meta.subjects]);
  const categories = mergeStringArrays([meta.categories]);
  const genres =
    meta.genres?.length ? mergeStringArrays([meta.genres]) : buildGenres(categories);

  const fields: RecommendationFieldUpdate & { metadataEnrichedAt: Date } = {
    metadataEnrichedAt: new Date(),
  };

  if (genres.length) fields.genres = genres;
  if (subjects.length) fields.subjects = subjects;
  if (categories.length) fields.categories = categories;
  if (meta.language?.trim()) {
    fields.langCode = meta.language.trim().toLowerCase();
  }
  const publishYear = meta.publishYear ?? parsePublishYear(meta.publishedDate);
  if (publishYear) fields.publishYear = publishYear;
  if (meta.openLibraryWorkKey?.trim()) {
    fields.openLibraryWorkKey = meta.openLibraryWorkKey.trim();
  }
  if (meta.googleVolumeId?.trim()) {
    fields.googleVolumeId = meta.googleVolumeId.trim();
  }

  return fields;
}

export function hasRecommendationMetadata(
  fields: RecommendationFieldUpdate,
): boolean {
  return Boolean(
    fields.genres?.length ||
      fields.subjects?.length ||
      fields.categories?.length ||
      fields.langCode ||
      fields.publishYear ||
      fields.openLibraryWorkKey ||
      fields.googleVolumeId,
  );
}
