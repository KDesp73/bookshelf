import { AdminNav } from "@/components/admin/admin-nav";
import { getAdminStats } from "@/lib/admin/queries";

export default async function AdminDashboardPage() {
  let stats = { userCount: 0, bookCount: 0, likeCount: 0 };
  let dbError: string | null = null;

  try {
    stats = await getAdminStats();
  } catch {
    dbError =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and ensure the database is running.";
  }

  return (
    <>
      <AdminNav current="dashboard" />

      {dbError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {dbError}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Users" value={stats.userCount} />
          <StatCard label="Books" value={stats.bookCount} />
          <StatCard label="Collection likes" value={stats.likeCount} />
        </div>
      )}
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold text-amber-950 dark:text-amber-100">
        {value}
      </p>
    </div>
  );
}
