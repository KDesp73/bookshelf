"use client";

import { useCallback, useRef, useState } from "react";
import { Send, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitSuggestionAction } from "@/actions/suggestions";

const MAX_LENGTH = 1000;

export function SuggestionsSection() {
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error ?? "Something went wrong.");
    }

    setSubmitting(false);
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
    </div>
  );
}
