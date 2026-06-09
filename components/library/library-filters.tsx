"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { READING_STATUSES } from "@/lib/constants";

interface LibraryFiltersProps {
  tags: string[];
  basePath?: string;
  hideStatusFilter?: boolean;
}

export function LibraryFilters({
  tags,
  basePath = "/",
  hideStatusFilter = false,
}: LibraryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "all";
  const tag = searchParams.get("tag") ?? "all";
  const sort = searchParams.get("sort") ?? "dateAdded";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      startTransition(() => {
        router.push(`${basePath}?${params.toString()}`);
      });
    },
    [router, searchParams, basePath],
  );

  // Debounce the search param updates — use a ref to avoid stale closures.
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleSearchChange(value: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value || search) {
      searchTimer.current = setTimeout(() => {
        searchTimer.current = undefined;
        updateParams({ search: value || null });
      }, 300);
    } else {
      updateParams({ search: null });
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:min-w-[200px] sm:flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          className="pl-9"
          placeholder="Search title, author, ISBN, tags…"
          defaultValue={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:contents">
        {!hideStatusFilter ? (
          <Select
            value={status}
            onValueChange={(v) => updateParams({ status: v })}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {READING_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Select value={tag} onValueChange={(v) => updateParams({ tag: v })}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => updateParams({ sort: v })}>
          <SelectTrigger className="col-span-2 w-full sm:col-span-1 sm:w-[160px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dateAdded">Recently added</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
