import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSuggestionsList } from "@/components/admin/admin-suggestions-list";
import { listSuggestionsAction } from "@/actions/suggestions";
import type { SuggestionItem } from "@/types/suggestion";

export default async function AdminSuggestionsPage() {
  let items: SuggestionItem[] = [];
  let dbError: string | null = null;

  try {
    const result = await listSuggestionsAction();
    if (result.success) {
      items = result.data;
    } else {
      dbError = result.error ?? "Could not load suggestions.";
    }
  } catch {
    dbError = "Could not connect to MongoDB.";
  }

  return (
    <>
      <AdminNav current="suggestions" />

      <div>
        <h2 className="font-serif text-xl font-semibold text-amber-950 dark:text-amber-100">
          Suggestions
        </h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Review and manage user-submitted suggestions.
        </p>
      </div>

      <AdminSuggestionsList initialSuggestions={items} initialError={dbError} />
    </>
  );
}
