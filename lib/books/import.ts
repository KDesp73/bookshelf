import { READING_STATUSES, isValidRating } from "@/lib/constants";
import { normalizeIsbn } from "@/lib/books/isbn";
import { mergeStringArrays, parsePublishYear } from "@/lib/books/metadata";
import {
  EXPORT_VERSION,
  type BookExportEnvelope,
  type ImportBookInput,
} from "@/types/export";
import type { BookListKind } from "@/types/book";
import type { ReadingStatus } from "@/lib/constants";

export function parseImportJson(raw: string): ImportBookInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  if (Array.isArray(parsed)) {
    return parsed as ImportBookInput[];
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "books" in parsed &&
    Array.isArray((parsed as BookExportEnvelope).books)
  ) {
    const envelope = parsed as BookExportEnvelope;
    if (envelope.version && envelope.version !== EXPORT_VERSION) {
      throw new Error(`Unsupported export version: ${envelope.version}`);
    }
    return envelope.books;
  }

  throw new Error("JSON must be a BookShelf export or an array of books.");
}

function normalizeAuthors(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeTags(value: unknown): string[] {
  return normalizeAuthors(value);
}

export function normalizeImportBook(
  raw: ImportBookInput,
  defaultIsWishlist: boolean,
): {
  book: ImportBookInput & { isbn13: string; title: string; isWishlist: boolean };
  error?: string;
} {
  const title = String(raw.title ?? "").trim();
  if (!title) {
    return { book: { ...raw, isbn13: "", title: "", isWishlist: false }, error: "Missing title." };
  }

  const normalizedIsbn = raw.isbn13 ? normalizeIsbn(String(raw.isbn13)) : null;
  const trimmedIsbn = String(raw.isbn13 ?? "").trim();
  const isbn13 =
    normalizedIsbn ?? (trimmedIsbn || `manual-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const statusRaw = raw.status;
  const status = READING_STATUSES.includes(statusRaw as ReadingStatus)
    ? (statusRaw as ReadingStatus)
    : "Unread";

  const isWishlist = raw.isWishlist ?? defaultIsWishlist;

  if (raw.rating != null && !isValidRating(raw.rating)) {
    return {
      book: { ...raw, isbn13, title, isWishlist },
      error: `Invalid rating for "${title}".`,
    };
  }

  return {
    book: {
      ...raw,
      isbn13,
      title,
      subtitle: raw.subtitle?.trim() || undefined,
      authors: normalizeAuthors(raw.authors),
      publisher: raw.publisher?.trim() || undefined,
      publishedDate: raw.publishedDate?.trim() || undefined,
      description: raw.description?.trim() || undefined,
      pageCount:
        typeof raw.pageCount === "number" && Number.isFinite(raw.pageCount)
          ? raw.pageCount
          : undefined,
      coverUrl: raw.coverUrl?.trim() || undefined,
      status,
      tags: normalizeTags(raw.tags),
      notes: raw.notes?.trim() || undefined,
      rating: isWishlist ? undefined : raw.rating ?? undefined,
      isWishlist,
      genres: mergeStringArrays([normalizeAuthors(raw.genres)]),
      subjects: mergeStringArrays([normalizeAuthors(raw.subjects)]),
      categories: mergeStringArrays([normalizeAuthors(raw.categories)]),
      language:
        typeof raw.language === "string" ? raw.language.trim().toLowerCase() : undefined,
      publishYear:
        typeof raw.publishYear === "number" && Number.isFinite(raw.publishYear)
          ? raw.publishYear
          : parsePublishYear(
              typeof raw.publishedDate === "string" ? raw.publishedDate : undefined,
            ),
    },
  };
}

export function defaultIsWishlistForList(list: BookListKind): boolean {
  return list === "wishlist";
}
