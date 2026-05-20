import { READING_STATUSES } from "@/lib/constants";
import type { LibraryFilters } from "@/types/book";
import type { ReadingStatus } from "@/lib/constants";

export function parseLibraryFilters(
  params: Record<string, string | string[] | undefined>,
): LibraryFilters {
  const search = getParam(params.search);
  const statusParam = getParam(params.status);
  const tagParam = getParam(params.tag);
  const sortParam = getParam(params.sort);

  const status = READING_STATUSES.includes(statusParam as ReadingStatus)
    ? (statusParam as ReadingStatus)
    : undefined;

  return {
    search: search || undefined,
    status,
    tag: tagParam && tagParam !== "all" ? tagParam : undefined,
    sort: sortParam === "title" ? "title" : "dateAdded",
    order: sortParam === "title" ? "asc" : "desc",
  };
}

function getParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
