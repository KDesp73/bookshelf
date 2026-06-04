import type { BookListKind, BookMetadata } from "@/types/book";
import type { ReadingStatus } from "@/lib/constants";

export const EXPORT_VERSION = 1;

export interface ExportedBook {
  isbn13: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  coverUrl?: string;
  genres?: string[];
  subjects?: string[];
  categories?: string[];
  language?: string;
  publishYear?: number;
  status: ReadingStatus;
  tags: string[];
  notes?: string;
  rating?: number;
  isWishlist: boolean;
  dateAdded?: string;
}

export interface BookExportEnvelope {
  version: typeof EXPORT_VERSION;
  source: "bookshelf";
  list: BookListKind;
  exportedAt: string;
  books: ExportedBook[];
}

export type ExportFormat = "json" | "csv" | "xlsx";

export interface ImportCollectionResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export type ImportBookInput = Partial<ExportedBook> &
  Pick<BookMetadata, "title"> & {
    isbn13?: string;
    isWishlist?: boolean;
  };
