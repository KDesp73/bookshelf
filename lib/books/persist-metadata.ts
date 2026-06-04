import type { BookInput } from "@/types/book";
import { recommendationFieldsFromMetadata } from "@/lib/books/metadata";

/** Mongo fields to spread into Book.create / $set from user or API input. */
export function metadataFieldsFromInput(
  input: Partial<BookInput>,
): Record<string, unknown> {
  return recommendationFieldsFromMetadata(input);
}
