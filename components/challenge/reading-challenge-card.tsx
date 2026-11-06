"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Target } from "lucide-react";
import { setReadingChallengeAction } from "@/actions/reading-challenge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReadingChallengeCardProps {
  year: number;
  target: number | null;
  readCount: number;
  editable?: boolean;
}

const ACCENT_SOFT = "var(--shelf-accent-soft, rgba(180, 83, 9, 0.15))";
const ACCENT = "var(--shelf-accent, #b45309)";

export function ReadingChallengeCard({
  year,
  target,
  readCount,
  editable = false,
}: ReadingChallengeCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(target?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasGoal = target !== null && target > 0;
  const percent = hasGoal
    ? Math.min(100, Math.round((readCount / target) * 100))
    : 0;
  const remaining = hasGoal ? Math.max(0, target - readCount) : 0;
  const complete = hasGoal && readCount >= target;

  function openDialog() {
    setValue(target?.toString() ?? "");
    setError(null);
    setOpen(true);
  }

  function save(nextTarget: number | null) {
    setError(null);
    startTransition(async () => {
      const result = await setReadingChallengeAction(nextTarget);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(value.trim());
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9999) {
      setError("Enter a whole number between 1 and 9999.");
      return;
    }
    save(parsed);
  }

  return (
    <section className="shelf-card rounded-xl border p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: ACCENT_SOFT, color: ACCENT }}
          >
            <Target className="h-5 w-5" />
          </span>
          <div>
            <h2 className="shelf-title font-serif text-lg font-semibold">
              {year} Reading Challenge
            </h2>
            <p className="shelf-muted mt-0.5 text-sm">
              {hasGoal
                ? complete
                  ? `Goal reached — ${readCount} of ${target} books finished.`
                  : `${remaining} ${remaining === 1 ? "book" : "books"} to go this year.`
                : "Set a target for how many books you want to finish this year."}
            </p>
          </div>
        </div>
        {editable ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={openDialog}
            className="shrink-0 self-start"
          >
            <Pencil className="h-3.5 w-3.5" />
            {hasGoal ? "Edit goal" : "Set goal"}
          </Button>
        ) : null}
      </div>

      {hasGoal ? (
        <>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="shelf-title text-2xl font-semibold">{readCount}</span>
            <span className="shelf-muted text-sm">/ {target} books</span>
            <span className="shelf-accent ml-auto text-sm font-medium">
              {percent}%
            </span>
          </div>
          <div
            className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
            style={{ background: ACCENT_SOFT }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading challenge progress"
          >
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${percent}%`, background: ACCENT }}
            />
          </div>
          {complete ? (
            <p className="shelf-accent mt-3 flex items-center gap-1.5 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Challenge complete — congratulations!
            </p>
          ) : null}
        </>
      ) : null}

      {editable ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reading goal for {year}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reading-goal">Books to read in {year}</Label>
                <Input
                  id="reading-goal"
                  type="number"
                  min={1}
                  max={9999}
                  step={1}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  autoFocus
                />
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  You have finished {readCount}{" "}
                  {readCount === 1 ? "book" : "books"} so far.
                </p>
              </div>
              {error ? (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                {hasGoal ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => save(null)}
                  >
                    Remove goal
                  </Button>
                ) : null}
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Saving…" : "Save goal"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </section>
  );
}
