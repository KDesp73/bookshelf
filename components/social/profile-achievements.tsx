import { Medal } from "lucide-react";
import type { AchievementWithProgress } from "@/lib/achievements";

interface ProfileAchievementsProps {
  achievements: AchievementWithProgress[];
}

export function ProfileAchievements({ achievements }: ProfileAchievementsProps) {
  const earned = achievements.filter((a) => a.earned);

  if (earned.length === 0) return null;

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-4 dark:border-stone-700 dark:bg-stone-900/40 sm:p-5">
      <h2 className="shelf-title font-serif text-lg font-semibold text-amber-950 dark:text-amber-100">
        Achievements
      </h2>
      <p className="shelf-muted mt-0.5 text-sm text-stone-500">
        {earned.length === 1 ? "1 achievement" : `${earned.length} achievements`} earned
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {earned.map((achievement) => (
          <div
            key={achievement._id.toString()}
            className="flex flex-col items-center rounded-lg border border-stone-200/60 bg-white/40 p-3 text-center dark:border-stone-700/60 dark:bg-stone-900/20"
          >
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
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
            <p className="mt-2 text-xs font-medium text-amber-950 dark:text-amber-100">
              {achievement.name}
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-stone-500">
              {achievement.description}
            </p>
            {achievement.earnedAt && (
              <p className="mt-1 text-[10px] text-stone-400">
                {new Date(achievement.earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
