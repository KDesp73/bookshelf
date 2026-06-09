"use client";

import { useCallback, useRef, useState } from "react";
import { Send, Eye, EyeOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitSuggestionAction, listSuggestionsAction } from "@/actions/suggestions";
import type { SuggestionItem } from "@/types/suggestion";

const MAX_LENGTH = 1000;

interface SuggestionsSectionProps {
  initialSuggestions: SuggestionItem[];
  initialError?: string | null;
  canView?: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function SuggestionsSection({ initialSuggestions, initialError, canView = false }: SuggestionsSectionProps) {
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>(initialSuggestions);
  const [loadError, setLoadError] = useState<string | null>(initialError ?? null);
  const formRef = useRef<HTMLFormElement>(null);

  const remaining = MAX_LENGTH - text.length;
  const canSubmit = text.trim().length > 0 && remaining >= 0 && !submitting;

  const handleSubmit = useCallback(async (formData: FormData) => {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const content = (formData.get("content") as string) ?? "";
    const anonymous = formData.get("anonymous") === "true";

    const result = await submitSuggestionAction(content, anonymous);

    if (result.success) {
      setText("");
      setSuccess(true);
      setSuggestions((prev) => [
        {
          _id: result.data.id,
          content,
          isAnonymous: anonymous,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error ?? "Something went wrong.");
    }

    setSubmitting(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoadError(null);
    const result = await listSuggestionsAction();
    if (result.success) {
      setSuggestions(result.data);
    } else {
      setLoadError(result.error ?? "Could not load suggestions.");
    }
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100">
          Suggestions
        </h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Share your ideas for features or improvements.
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900/50">
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              name="content"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What would you love to see on Bookshelf?"
              rows={4}
              maxLength={MAX_LENGTH}
              className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-900 placeholder-stone-400 transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-100 dark:placeholder-stone-500"
            />
            <span
              className={cn(
                "absolute bottom-3 right-3 text-xs",
                remaining < 50
                  ? "text-amber-600"
                  : "text-stone-400",
              )}
            >
              {remaining}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsAnonymous((a) => !a)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                isAnonymous
                  ? "bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300"
                  : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800",
              )}
            >
              {isAnonymous ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Anonymous
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Share my name
                </>
              )}
            </button>
            <input type="hidden" name="anonymous" value={isAnonymous ? "true" : "false"} />

            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-medium transition",
                canSubmit
                  ? "bg-amber-600 text-white shadow-sm hover:bg-amber-700 active:scale-[0.97] dark:bg-amber-500 dark:hover:bg-amber-400"
                  : "cursor-not-allowed bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-600",
              )}
            >
              <Send className="h-4 w-4" />
              {submitting ? "Sending..." : "Submit"}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {success && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Thanks for the suggestion!
            </p>
          )}
        </form>
      </div>

      {/* Recent suggestions — admins only */}
      {canView && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-medium text-stone-800 dark:text-stone-200">
              Recent ideas
            </h3>
            <button
              onClick={handleRefresh}
              className="text-xs text-stone-500 underline-offset-2 hover:underline dark:text-stone-400"
            >
              Refresh
            </button>
          </div>

        {loadError ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            {loadError}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
            <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
              No suggestions yet
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Be the first to share your idea!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div
                key={s._id}
                className="rounded-xl border border-stone-200 bg-white px-5 py-4 transition hover:border-amber-200 dark:border-stone-700 dark:bg-stone-900/50 dark:hover:border-amber-800"
              >
                <p className="text-sm text-stone-800 dark:text-stone-200">
                  {s.content}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                  <span>
                    {s.isAnonymous ? "Anonymous" : (s.userName ?? "Bookling")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(s.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
