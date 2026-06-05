"use client";

import { useState } from "react";
import { MarkdownContent } from "@/components/blog/markdown-content";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function MarkdownEditor({ value, onChange, disabled }: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="post-body">Body (Markdown)</Label>
        <div className="inline-flex rounded-md border border-stone-200 p-0.5 dark:border-stone-700">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setTab("write")}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition",
              tab === "write"
                ? "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100"
                : "text-stone-600 dark:text-stone-400",
            )}
          >
            Write
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setTab("preview")}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition",
              tab === "preview"
                ? "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100"
                : "text-stone-600 dark:text-stone-400",
            )}
          >
            Preview
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <Textarea
          id="post-body"
          rows={18}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={"Write your post in Markdown…\n\n## Section heading\n\n- Bullet point\n- Another point\n\n**Bold** and _italic_ text."}
          className="min-h-[360px] font-mono text-sm"
        />
      ) : (
        <div className="min-h-[360px] rounded-md border border-stone-200 bg-white/70 p-4 dark:border-stone-700 dark:bg-stone-900/40">
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-sm text-stone-500">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
