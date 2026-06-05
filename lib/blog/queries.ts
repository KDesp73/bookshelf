import { connectDB } from "@/lib/db";
import { BLOG_REACTION_EMOJIS } from "@/lib/constants";
import { BlogPost, type IBlogPost } from "@/models/BlogPost";
import { BlogReaction } from "@/models/BlogReaction";
import type {
  BlogPostDocument,
  BlogPostListItem,
  BlogReactionSummary,
} from "@/types/blog";

function toBlogPostDocument(
  post: IBlogPost & { _id: { toString(): string } },
): BlogPostDocument {
  return {
    _id: post._id.toString(),
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? undefined,
    body: post.body,
    authorId: post.authorId,
    authorName: post.authorName ?? undefined,
    published: post.published === true,
    publishedAt: post.publishedAt?.toISOString(),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

function toBlogPostListItem(
  post: IBlogPost & { _id: { toString(): string } },
): BlogPostListItem {
  return {
    _id: post._id.toString(),
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? undefined,
    authorName: post.authorName ?? undefined,
    published: post.published === true,
    publishedAt: post.publishedAt?.toISOString(),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export async function listPublishedPosts(): Promise<BlogPostListItem[]> {
  await connectDB();
  const posts = await BlogPost.find({ published: true })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();

  return posts.map((post) =>
    toBlogPostListItem(post as IBlogPost & { _id: { toString(): string } }),
  );
}

export async function listAllPosts(): Promise<BlogPostListItem[]> {
  await connectDB();
  const posts = await BlogPost.find().sort({ updatedAt: -1 }).lean();
  return posts.map((post) =>
    toBlogPostListItem(post as IBlogPost & { _id: { toString(): string } }),
  );
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<BlogPostDocument | null> {
  await connectDB();
  const post = await BlogPost.findOne({
    slug: slug.trim().toLowerCase(),
    published: true,
  }).lean();

  if (!post) return null;
  return toBlogPostDocument(post as IBlogPost & { _id: { toString(): string } });
}

export async function getPostById(id: string): Promise<BlogPostDocument | null> {
  await connectDB();
  const post = await BlogPost.findById(id).lean();
  if (!post) return null;
  return toBlogPostDocument(post as IBlogPost & { _id: { toString(): string } });
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  await connectDB();
  const query: Record<string, unknown> = { slug: slug.trim().toLowerCase() };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const post = await BlogPost.findOne(query).select("_id").lean();
  return !!post;
}

export async function getPostReactionSummaries(
  postId: string,
  userId?: string,
): Promise<BlogReactionSummary[]> {
  await connectDB();

  const counts = await BlogReaction.aggregate<{ _id: string; count: number }>([
    { $match: { postId } },
    { $group: { _id: "$emoji", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(counts.map((row) => [row._id, row.count]));
  let userEmojis = new Set<string>();

  if (userId) {
    const reactions = await BlogReaction.find({ postId, userId }).select("emoji").lean();
    userEmojis = new Set(reactions.map((reaction) => reaction.emoji));
  }

  return BLOG_REACTION_EMOJIS.map((emoji) => ({
    emoji,
    count: countMap.get(emoji) ?? 0,
    reacted: userEmojis.has(emoji),
  }));
}
