"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Medal } from "lucide-react";
import {
  createAchievementAction,
  updateAchievementAction,
  deleteAchievementAction,
  awardAllAchievementsAction,
} from "@/actions/achievements";
import { ACHIEVEMENT_CONDITION_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Achievement {
  _id: { toString(): string };
  name: string;
  description: string;
  badge?: string | null;
  conditionType: string;
  conditionValue: number;
}

interface AdminAchievementsListProps {
  achievements: Achievement[];
}

const CONDITION_LABELS: Record<string, string> = {
  books_added: "Books added",
  books_read: "Books read",
  books_unread: "Books unread",
  books_reading: "Books reading",
  books_rated: "Books rated",
  collection_likes: "Collection likes",
  account_age_days: "Account age (days)",
};

export function AdminAchievementsList({
  achievements,
}: AdminAchievementsListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [awarding, startAwardTransition] = useTransition();
  const [awardMessage, setAwardMessage] = useState<string | null>(null);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleDelete(id: string) {
    if (!confirm("Delete this achievement? This will also remove it from users who earned it.")) return;
    startTransition(async () => {
      await deleteAchievementAction(id);
      router.refresh();
    });
  }

  function handleAwardAll() {
    if (!confirm("Award all achievements to every user who qualifies? This may take a moment.")) return;
    startAwardTransition(async () => {
      setAwardMessage(null);
      const result = await awardAllAchievementsAction();
      if (result.success) {
        setAwardMessage(
          `Awarded ${result.data.awarded} achievement${result.data.awarded === 1 ? "" : "s"} across ${result.data.total} user${result.data.total === 1 ? "" : "s"}.`,
        );
        router.refresh();
      } else {
        setAwardMessage("Failed to award achievements.");
      }
    });
  }

  function handleCreate() {
    setEditingAchievement(null);
    setDialogOpen(true);
  }

  function handleEdit(achievement: Achievement) {
    setEditingAchievement(achievement);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {achievements.length} {achievements.length === 1 ? "achievement" : "achievements"}
        </p>
        <div className="flex items-center gap-2">
          {awardMessage && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{awardMessage}</p>
          )}
          {achievements.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAwardAll}
              disabled={awarding}
            >
              {awarding ? "Awarding..." : "Award to all users"}
            </Button>
          )}
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add achievement
          </Button>
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center dark:border-stone-600">
          <Medal className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
            No achievements yet. Create your first one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((achievement) => (
            <div
              key={achievement._id.toString()}
              className="flex items-start gap-4 rounded-xl border border-stone-200/80 bg-white/60 p-4 dark:border-stone-700 dark:bg-stone-900/40"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                {achievement.badge ? (
                  <img
                    src={achievement.badge}
                    alt={achievement.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Medal className="h-7 w-7 text-amber-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-amber-950 dark:text-amber-100">
                  {achievement.name}
                </h3>
                <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
                  {achievement.description}
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">
                  {CONDITION_LABELS[achievement.conditionType] ?? achievement.conditionType}:{" "}
                  {achievement.conditionValue}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(achievement)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(achievement._id.toString())}
                  disabled={pending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AchievementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        achievement={editingAchievement}
        onSaved={() => {
          setDialogOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function AchievementDialog({
  open,
  onOpenChange,
  achievement,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievement: Achievement | null;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [removeBadge, setRemoveBadge] = useState(false);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = achievement
        ? await updateAchievementAction(achievement._id.toString(), formData)
        : await createAchievementAction(formData);
      if (result.success) {
        onSaved();
      } else {
        alert(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {achievement ? "Edit achievement" : "New achievement"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Name
            </label>
            <input
              name="name"
              defaultValue={achievement?.name ?? ""}
              required
              className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
              placeholder="Bookworm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={achievement?.description ?? ""}
              required
              rows={2}
              className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
              placeholder="Added 10 books to your collection"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Condition
              </label>
              <select
                name="conditionType"
                defaultValue={achievement?.conditionType ?? "books_added"}
                className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
              >
                {ACHIEVEMENT_CONDITION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {CONDITION_LABELS[type] ?? type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Value
              </label>
              <input
                name="conditionValue"
                type="number"
                min={1}
                defaultValue={achievement?.conditionValue ?? 1}
                required
                className="mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Badge image{" "}
              <span className="text-xs text-stone-500">(optional — JPEG, PNG, WebP, GIF, SVG under 512 KB)</span>
            </label>
            <input
              name="badge"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              className="mt-1 block w-full text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-amber-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-amber-800 hover:file:bg-amber-200 dark:text-stone-400 dark:file:bg-amber-900/50 dark:file:text-amber-200"
            />
            {achievement?.badge ? (
              <label className="mt-2 flex items-center gap-2 text-sm text-stone-500">
                <input
                  type="checkbox"
                  name="removeBadge"
                  checked={removeBadge}
                  onChange={(e) => setRemoveBadge(e.target.checked)}
                  className="rounded border-stone-300 text-amber-800 focus:ring-amber-600"
                />
                Remove current badge
              </label>
            ) : null}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving..." : achievement ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
