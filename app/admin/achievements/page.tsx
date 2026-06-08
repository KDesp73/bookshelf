import { AdminNav } from "@/components/admin/admin-nav";
import { AdminAchievementsList } from "@/components/admin/admin-achievements-list";
import { getAllAchievements } from "@/lib/achievements";

export default async function AdminAchievementsPage() {
  let achievements: Awaited<ReturnType<typeof getAllAchievements>> = [];
  let dbError: string | null = null;

  try {
    achievements = await getAllAchievements();
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  return (
    <>
      <AdminNav current="achievements" />
      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {dbError}
        </div>
      ) : (
        <AdminAchievementsList achievements={achievements} />
      )}
    </>
  );
}
