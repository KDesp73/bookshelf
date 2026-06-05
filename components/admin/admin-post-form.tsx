"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createBlogPostAction,
  deleteBlogPostAction,
  updateBlogPostAction,
} from "@/actions/blog";
import { MarkdownEditor } from "@/components/blog/markdown-editor";
import type { BlogPostDocument } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AdminPostFormProps {
  post?: BlogPostDocument;
}

export function AdminPostForm({ post }: AdminPostFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [published, setPublished] = useState(post?.published ?? false);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const input = {
        title,
        slug: slug.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        body,
        published,
      };

      const result = post
        ? await updateBlogPostAction(post._id, input)
        : await createBlogPostAction(input);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/admin/news");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!post) return;
    if (!window.confirm("Delete this post and all reactions?")) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteBlogPostAction(post._id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/admin/news");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="post-title">Title</Label>
          <Input
            id="post-title"
            value={title}
            disabled={pending}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Post title"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="post-slug">Slug (optional)</Label>
          <Input
            id="post-slug"
            value={slug}
            disabled={pending}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="auto-generated-from-title"
          />
          <p className="text-xs text-stone-500">
            URL: /news/{slug.trim() || "your-slug"}
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="post-excerpt">Excerpt (optional)</Label>
          <Textarea
            id="post-excerpt"
            rows={2}
            maxLength={400}
            value={excerpt}
            disabled={pending}
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="Short summary for the news list"
          />
        </div>

        <MarkdownEditor value={body} onChange={setBody} disabled={pending} />

        <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
          <input
            type="checkbox"
            checked={published}
            disabled={pending}
            onChange={(event) => setPublished(event.target.checked)}
            className="h-4 w-4 rounded border-stone-300"
          />
          Publish immediately
        </label>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "Saving…" : post ? "Save changes" : "Create post"}
        </Button>
        <Button variant="outline" asChild disabled={pending}>
          <Link href="/admin/news">Cancel</Link>
        </Button>
        {post ? (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}
