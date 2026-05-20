import type { ReadingStatus } from "@/lib/constants";

export interface BookMetadata {
  isbn13: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  coverUrl?: string;
}

export interface BookPreview extends BookMetadata {
  source: "openlibrary" | "google" | "merged";
}

export interface BookInput extends BookMetadata {
  status?: ReadingStatus;
  physicalLocation?: string;
  tags?: string[];
  notes?: string;
}

export interface BookDocument extends BookInput {
  _id: string;
  userId: string;
  status: ReadingStatus;
  tags: string[];
  dateAdded: string;
}

export interface LibraryFilters {
  search?: string;
  status?: ReadingStatus;
  tag?: string;
  sort?: "dateAdded" | "title";
  order?: "asc" | "desc";
}
