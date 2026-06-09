export type RecommendationSource = "community" | "openlibrary";

export interface RecommendationItem {
  title: string;
  authors: string[];
  coverUrl?: string;
  description?: string;
  isbn13?: string;
  source: RecommendationSource;
  reason: string;
  fromUserId?: string;
  fromUsername?: string;
  fromUserDisplayName?: string;
}

export interface Recommendation {
  _id: string;
  userId: string;
  date: string;
  items: RecommendationItem[];
  createdAt: string;
}
