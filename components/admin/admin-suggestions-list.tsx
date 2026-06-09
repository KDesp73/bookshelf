"use client";

import { useCallback, useState } from "react";
import { Trash2, Clock } from "lucide-react";
import { deleteSuggestionAction, updateSuggestionStatusAction } from "@/actions/suggestions";
import { SUGGESTION_STATUSES } from "@/types/suggestion";
import { SUGGESTION_STATUS_LABELS } from "@/lib/constants";
import type { SuggestionStatus } from "@/types/suggestion";
import type { SuggestionItem } from "@/types/suggestion";

interface AdminSuggestionsListProps {
  initialSuggestions: SuggestionItem[];
  initialError?: string | null;
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

export function AdminSuggestionsList({ initialSuggestions, initialError }: AdminSuggestionsListProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>(initialSuggestions);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(id);
    const result = await deleteSuggestionAction(id);
    if (result.success) {
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
    } else {
      setError(result.error ?? "Failed to delete suggestion.");
    }
    setDeleting(null);
  }, []);

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    setUpdating(id);
    const result = await updateSuggestionStatusAction(id, newStatus);
    if (result.success) {
      setSuggestions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status: newStatus as SuggestionStatus } : s)),
      );
    } else {
      setError(result.error ?? "Failed to update status.");
    }
    setUpdating(null);
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        {error}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-900/30">
        <p className="font-serif text-lg text-stone-700 dark:text-stone-300">
          No suggestions yet
        </p>
        <p className="mt-1 text-sm text-stone-500">
          Suggestions submitted by users will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-white/60 dark:border-stone-700 dark:bg-stone-900/40">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="border-b border-stone-200 text-stone-500 dark:border-stone-700">
          <tr>
            <th className="px-4 py-3 font-medium">Suggestion</th>
            <th className="px-4 py-3 font-medium">Author</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {suggestions.map((s) => (
            <tr
              key={s._id}
              className="border-b border-stone-100 last:border-0 dark:border-stone-800"
            >
              <td className="max-w-sm px-4 py-3">
                <div className="text-stone-900 dark:text-stone-100">
                  {s.content}
                </div>
              </td>
              <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                {s.isAnonymous ? "Anonymous" : (s.userName ?? "Bookling")}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-stone-600 dark:text-stone-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(s.createdAt)}
                </span>
              </td>
              <td className="px-4 py-3">
                <select
                  value={s.status}
                  onChange={(e) => handleStatusChange(s._id, e.target.value)}
                  disabled={updating === s._id}
                  className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300"
                >
                  {SUGGESTION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {SUGGESTION_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(s._id)}
                  disabled={deleting === s._id}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting === s._id ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
