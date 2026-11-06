"use client";

import { useCallback, useRef, useState } from "react";
import { Eye, EyeOff, Lightbulb, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitSuggestionAction } from "@/actions/suggestions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="rounded-2xl border border-stone-200/80 bg-white/60 p-5 shadow-sm sm:p-7 dark:border-stone-800 dark:bg-stone-900/40">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          <Lightbulb className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-amber-950 dark:text-amber-100">
            Share an idea
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Feature requests, improvements, or anything you would love to see on
            BookShelf.
          </p>
        </div>
      </div>

      <form ref={formRef} action={handleSubmit} className="mt-5 space-y-4">
        <div className="relative">
          <label htmlFor="suggestion-content" className="sr-only">
            Your suggestion
          </label>
          <Textarea
            id="suggestion-content"
            name="content"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What would you love to see on BookShelf?"
            rows={4}
            maxLength={MAX_LENGTH}
            className="min-h-32 resize-none rounded-xl border-stone-200 bg-stone-50 p-4 text-sm transition focus:border-amber-400 focus-visible:ring-amber-400/30 dark:border-stone-700 dark:bg-stone-800/50"
          />
          <span
            className={cn(
              "absolute bottom-3 right-3 text-xs tabular-nums",
              remaining < 50 ? "text-amber-600" : "text-stone-400",
            )}
          >
            {remaining}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsAnonymous((anonymous) => !anonymous)}
            aria-pressed={isAnonymous}
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
          <input
            type="hidden"
            name="anonymous"
            value={isAnonymous ? "true" : "false"}
          />

          <Button type="submit" disabled={!canSubmit} className="gap-2">
            <Send className="h-4 w-4" />
            {submitting ? "Sending…" : "Submit suggestion"}
          </Button>
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
  );
}
