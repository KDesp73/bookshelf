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

function parseCsvRow(text: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(field);
        field = "";
      } else {
        field += char;
      }
    }
  }

  fields.push(field);
  return fields;
}

export function parseGoodreadsCsv(raw: string): ImportBookInput[] {
  const cleaned = raw.replace(/^\uFEFF/, "").trim();
  const lines = cleaned.split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("CSV file is empty or missing header row.");
  }

  const header = parseCsvRow(lines[0]);
  const colIndex: Record<string, number> = {};
  header.forEach((name, i) => {
    colIndex[name.trim()] = i;
  });

  const getCol = (row: string[], name: string): string | undefined => {
    const idx = colIndex[name];
    return idx !== undefined ? row[idx]?.trim() : undefined;
  };

  const titleCol = "Title";
  if (colIndex[titleCol] === undefined) {
    throw new Error('CSV must have a "Title" column.');
  }

  const books: ImportBookInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    if (row.length < 2) continue;

    const title = getCol(row, "Title") || "";
    if (!title) continue;

    const isbn13 = getCol(row, "ISBN13") || getCol(row, "ISBN") || undefined;

    const authors: string[] = [];
    const author = getCol(row, "Author");
    if (author) {
      authors.push(...author.split(",").map((a) => a.trim()).filter(Boolean));
    }
    const additionalAuthors = getCol(row, "Additional Authors");
    if (additionalAuthors) {
      authors.push(
        ...additionalAuthors.split(",").map((a) => a.trim()).filter(Boolean),
      );
    }

    const exclusiveShelf = (getCol(row, "Exclusive Shelf") || "to-read").toLowerCase();
    const isWishlist = exclusiveShelf === "to-read";
    const statusMap: Record<string, ReadingStatus> = {
      read: "Read",
      "currently-reading": "Reading",
      "to-read": "Unread",
    };
    const status = isWishlist
      ? "Unread"
      : (statusMap[exclusiveShelf] ?? "Unread");

    const ratingRaw = parseInt(getCol(row, "My Rating") || "0", 10);
    const rating =
      ratingRaw >= 1 && ratingRaw <= 5
        ? (ratingRaw as ImportBookInput["rating"])
        : undefined;

    const pageCountRaw = parseInt(getCol(row, "Number of Pages") || "", 10);
    const pageCount =
      !Number.isNaN(pageCountRaw) && pageCountRaw > 0 ? pageCountRaw : undefined;

    const publishYearRaw = parseInt(getCol(row, "Year Published") || "", 10);
    const origPubYearRaw = parseInt(
      getCol(row, "Original Publication Year") || "",
      10,
    );
    const publishYear =
      !Number.isNaN(publishYearRaw) && publishYearRaw > 0
        ? publishYearRaw
        : !Number.isNaN(origPubYearRaw) && origPubYearRaw > 0
          ? origPubYearRaw
          : undefined;

    const tagsStr = getCol(row, "Bookshelves");
    const tags = tagsStr
      ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const review = getCol(row, "My Review");
    const notes = review || undefined;

    const publisher = getCol(row, "Publisher") || undefined;
    const dateAdded = getCol(row, "Date Added") || undefined;

    books.push({
      isbn13,
      title,
      authors: authors.length > 0 ? authors : undefined,
      publisher,
      pageCount,
      publishYear,
      dateAdded,
      status,
      tags,
      notes,
      rating,
      isWishlist,
    });
  }

  return books;
}

export function defaultIsWishlistForList(list: BookListKind): boolean {
  return list === "wishlist";
}
