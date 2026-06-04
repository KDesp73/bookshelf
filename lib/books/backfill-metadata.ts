import "server-only";

import { connectDB } from "@/lib/db";
import { fetchBookByIsbn } from "@/lib/books/lookup";
import {
  hasRecommendationMetadata,
  isEnrichableIsbn,
  recommendationFieldsFromMetadata,
} from "@/lib/books/metadata";
import { Book } from "@/models/Book";

export interface BackfillMetadataResult {
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

const ENRICHABLE_QUERY = {
  isbn13: { $not: /^manual/i },
  $or: [
    { metadataEnrichedAt: { $exists: false } },
    { metadataEnrichedAt: null },
    { genres: { $exists: false } },
    { genres: { $size: 0 } },
  ],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function backfillBookMetadata(options?: {
  userId?: string;
  limit?: number;
  delayMs?: number;
}): Promise<BackfillMetadataResult> {
  const limit = options?.limit ?? 500;
  const delayMs = options?.delayMs ?? 250;

  await connectDB();

  const query: Record<string, unknown> = { ...ENRICHABLE_QUERY };
  if (options?.userId) {
    query.userId = options.userId;
  }

  const books = await Book.find(query)
    .select("_id isbn13 title")
    .sort({ dateAdded: -1 })
    .limit(limit)
    .lean();

  const result: BackfillMetadataResult = {
    processed: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const book of books) {
    result.processed += 1;
    const isbn13 = book.isbn13;

    if (!isEnrichableIsbn(isbn13)) {
      result.skipped += 1;
      await Book.findByIdAndUpdate(book._id, {
        metadataEnrichedAt: new Date(),
      });
      continue;
    }

    try {
      const metadata = await fetchBookByIsbn(isbn13);
      if (!metadata) {
        result.skipped += 1;
        await Book.findByIdAndUpdate(book._id, {
          metadataEnrichedAt: new Date(),
        });
        continue;
      }

      const fields = recommendationFieldsFromMetadata(metadata);
      if (!hasRecommendationMetadata(fields)) {
        result.skipped += 1;
        await Book.findByIdAndUpdate(book._id, {
          metadataEnrichedAt: fields.metadataEnrichedAt,
        });
        continue;
      }

      await Book.findByIdAndUpdate(book._id, { $set: fields });
      result.updated += 1;
    } catch {
      result.failed += 1;
      if (result.errors.length < 8) {
        result.errors.push(`Failed to enrich "${book.title}" (${isbn13}).`);
      }
    }

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return result;
}

export async function countBooksNeedingMetadataEnrichment(
  userId?: string,
): Promise<number> {
  await connectDB();
  const query: Record<string, unknown> = { ...ENRICHABLE_QUERY };
  if (userId) query.userId = userId;
  return Book.countDocuments(query);
}
