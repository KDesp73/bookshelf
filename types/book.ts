import type { ReadingStatus } from "@/lib/constants";

/** Fields used for discovery, filtering, and future recommendations. */
export interface BookRecommendationMetadata {
  genres?: string[];
  subjects?: string[];
  categories?: string[];
  language?: string;
  publishYear?: number;
  openLibraryWorkKey?: string;
  googleVolumeId?: string;
}

export interface BookMetadata extends BookRecommendationMetadata {
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
  tags?: string[];
  notes?: string;
  rating?: number | null;
  isWishlist?: boolean;
}

export interface BookDocument extends BookInput {
  _id: string;
  userId: string;
  status: ReadingStatus;
  tags: string[];
  dateAdded: string;
  rating?: number;
  isWishlist: boolean;
}

export type PublicBookDocument = Omit<BookDocument, "notes">;

export interface DiscoverBook {
  _id: string;
  isbn13: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  userId: string;
  username: string;
  userDisplayName?: string;
  dateAdded: string;
}

export type BookListKind = "library" | "wishlist" | "all";

export interface LibraryFilters {
  search?: string;
  status?: ReadingStatus;
  tag?: string;
  sort?: "dateAdded" | "title";
  order?: "asc" | "desc";
  list?: BookListKind;
}
