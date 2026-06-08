"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { isBlogReactionEmoji } from "@/lib/constants";
import { slugifyTitle, ensureUniqueSlug } from "@/lib/blog/slug";
import {
  getPostById,
  getPostReactionSummaries,
  slugExists,
} from "@/lib/blog/queries";
import { requirePermission } from "@/lib/auth/require-admin";
import { ADMIN_PERMISSIONS } from "@/lib/constants";
import { requireUser } from "@/lib/auth/require-user";
import { BlogPost } from "@/models/BlogPost";
import { BlogReaction } from "@/models/BlogReaction";
import { sendPostPromotional } from "@/lib/email/send-post-promotional";
import type { ActionResult } from "@/actions/books";
import type {
  BlogPostDocument,
  BlogPostInput,
  BlogReactionSummary,
} from "@/types/blog";
import type { SendPostPromotionalResult } from "@/lib/email/send-post-promotional";

function revalidateNewsPaths(slug?: string) {
  revalidatePath("/news");
  revalidatePath("/admin/news");
  if (slug) {
    revalidatePath(`/news/${slug}`);
  }
}

function normalizeInput(input: BlogPostInput) {
  const title = input.title?.trim();
  const body = input.body?.trim();
  const excerpt = input.excerpt?.trim();
  const slugBase = slugifyTitle(input.slug?.trim() || title || "");

  return {
    title,
    body,
    excerpt: excerpt || undefined,
    slugBase,
    published: input.published === true,
  };
}

export async function createBlogPostAction(
  input: BlogPostInput,
): Promise<ActionResult<BlogPostDocument>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_NEWS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  const normalized = normalizeInput(input);
  if (!normalized.title) {
    return { success: false, error: "Title is required." };
  }
  if (!normalized.body) {
    return { success: false, error: "Post body is required." };
  }

  try {
    await connectDB();
    const slug = await ensureUniqueSlug(normalized.slugBase, slugExists);
    const now = new Date();

    const post = await BlogPost.create({
      slug,
      title: normalized.title,
      excerpt: normalized.excerpt,
      body: normalized.body,
      authorId: auth.user.id,
      authorName: auth.user.name ?? undefined,
      published: normalized.published,
      publishedAt: normalized.published ? now : undefined,
    });

    revalidateNewsPaths(slug);

    const doc = await getPostById(post._id.toString());
    if (!doc) {
      return { success: false, error: "Post created but could not be loaded." };
    }

    return { success: true, data: doc };
  } catch {
    return { success: false, error: "Failed to create post." };
  }
}

export async function updateBlogPostAction(
  id: string,
  input: BlogPostInput,
): Promise<ActionResult<BlogPostDocument>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_NEWS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  const normalized = normalizeInput(input);
  if (!normalized.title) {
    return { success: false, error: "Title is required." };
  }
  if (!normalized.body) {
    return { success: false, error: "Post body is required." };
  }

  try {
    await connectDB();

    const existing = await BlogPost.findById(id);
    if (!existing) {
      return { success: false, error: "Post not found." };
    }

    const previousSlug = existing.slug;
    let slug = existing.slug;
    if (input.slug?.trim()) {
      const requested = slugifyTitle(input.slug.trim());
      if (requested !== existing.slug) {
        slug = await ensureUniqueSlug(requested, slugExists, id);
      }
    }

    const wasPublished = existing.published === true;
    existing.slug = slug;
    existing.title = normalized.title;
    existing.excerpt = normalized.excerpt;
    existing.body = normalized.body;
    existing.published = normalized.published;

    if (normalized.published && !wasPublished) {
      existing.publishedAt = new Date();
    }
    if (!normalized.published) {
      existing.publishedAt = undefined;
    }

    await existing.save();

    revalidateNewsPaths(previousSlug);
    if (slug !== previousSlug) {
      revalidateNewsPaths(slug);
    } else {
      revalidateNewsPaths(slug);
    }

    const doc = await getPostById(id);
    if (!doc) {
      return { success: false, error: "Post updated but could not be loaded." };
    }

    return { success: true, data: doc };
  } catch {
    return { success: false, error: "Failed to update post." };
  }
}

export async function deleteBlogPostAction(
  id: string,
): Promise<ActionResult<null>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_NEWS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    const post = await BlogPost.findById(id).lean();
    if (!post) {
      return { success: false, error: "Post not found." };
    }

    await Promise.all([
      BlogPost.deleteOne({ _id: id }),
      BlogReaction.deleteMany({ postId: id }),
    ]);

    revalidateNewsPaths(post.slug);
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to delete post." };
  }
}

export async function sendPostPromotionalEmailAction(
  postId: string,
): Promise<ActionResult<SendPostPromotionalResult>> {
  const auth = await requirePermission(ADMIN_PERMISSIONS.MANAGE_EMAILS);
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Admin access required." };
  }

  try {
    await connectDB();
    const post = await getPostById(postId);
    if (!post) {
      return { success: false, error: "Post not found." };
    }

    const result = await sendPostPromotional(post);
    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.result };
  } catch {
    return { success: false, error: "Failed to send promotional email." };
  }
}

export async function toggleBlogReactionAction(
  postId: string,
  emoji: string,
): Promise<ActionResult<{ reactions: BlogReactionSummary[] }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) {
    return { success: false, error: auth.error ?? "Sign in to react." };
  }

  if (!isBlogReactionEmoji(emoji)) {
    return { success: false, error: "Invalid reaction." };
  }

  try {
    await connectDB();

    const post = await BlogPost.findOne({ _id: postId, published: true }).lean();
    if (!post) {
      return { success: false, error: "Post not found." };
    }

    const existing = await BlogReaction.findOne({
      postId,
      userId: auth.user.id,
      emoji,
    });

    if (existing) {
      await BlogReaction.deleteOne({ _id: existing._id });
    } else {
      await BlogReaction.create({
        postId,
        userId: auth.user.id,
        emoji,
      });
    }

    revalidateNewsPaths(post.slug);

    const reactions = await getPostReactionSummaries(postId, auth.user.id);
    return { success: true, data: { reactions } };
  } catch {
    return { success: false, error: "Could not update reaction." };
  }
}
