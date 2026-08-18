"use client";

import { useState } from "react";
import { Medal, Trophy, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { AchievementWithProgress } from "@/lib/achievements";

interface ProfileAchievementsProps {
  achievements: AchievementWithProgress[];
}

const COLLAPSED_COUNT = 4;

function relativeDate(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function ProfileAchievements({ achievements }: ProfileAchievementsProps) {
  const earned = achievements.filter((a) => a.earned);
  const [expanded, setExpanded] = useState(false);

  if (earned.length === 0) return null;

  const visible = expanded ? earned : earned.slice(0, COLLAPSED_COUNT);
  const hiddenCount = earned.length - COLLAPSED_COUNT;
  const canExpand = earned.length > COLLAPSED_COUNT;

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-4 dark:border-stone-700 dark:bg-stone-900/40 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
          <Trophy className="h-5 w-5 text-amber-700 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="shelf-title font-serif text-lg font-semibold text-amber-950 dark:text-amber-100">
            Achievements
          </h2>
          <p className="shelf-muted text-sm text-stone-500">
            {earned.length === 1
              ? "1 badge earned"
              : `${earned.length} badges earned`}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {visible.map((achievement) => (
          <div
            key={achievement._id.toString()}
            className="group relative flex items-start gap-3 rounded-lg border border-stone-200/60 bg-white/50 p-3 transition-colors hover:border-amber-300/50 hover:bg-amber-50/30 dark:border-stone-700/60 dark:bg-stone-900/20 dark:hover:border-amber-700/40 dark:hover:bg-amber-950/20"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 ring-2 ring-amber-200/50 dark:bg-stone-800 dark:ring-amber-800/30">
              {achievement.badge ? (
                <img
                  src={achievement.badge}
                  alt={achievement.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Medal className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-amber-950 dark:text-amber-100">
                  {achievement.name}
                </p>
                <Sparkles className="h-3 w-3 shrink-0 text-amber-500 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                {achievement.description}
              </p>
              {achievement.earnedAt && (
                <p className="mt-1 text-[10px] font-medium text-stone-400 dark:text-stone-500">
                  {relativeDate(achievement.earnedAt)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {canExpand && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-stone-200/60 bg-white/40 py-2 text-xs font-medium text-stone-500 transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-700 dark:border-stone-700/60 dark:bg-stone-900/20 dark:hover:border-stone-600 dark:hover:bg-stone-800/40 dark:hover:text-stone-300"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Show {hiddenCount} more <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
