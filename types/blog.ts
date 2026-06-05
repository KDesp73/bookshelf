export interface BlogPostDocument {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string;
  body: string;
  authorId: string;
  authorName?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostListItem {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string;
  authorName?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogReactionSummary {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface BlogPostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  body: string;
  published?: boolean;
}
