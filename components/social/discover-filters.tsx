"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DiscoverFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const search = searchParams.get("search") ?? "";
  const sort = searchParams.get("sort") ?? "recent";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || (key === "sort" && value === "recent")) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      startTransition(() => {
        router.push(`/discover?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="grid flex-1 gap-2">
        <Label htmlFor="discover-search">Search users</Label>
        <Input
          id="discover-search"
          defaultValue={search}
          key={search}
          placeholder="Search by username…"
          onChange={(event) =>
            updateParams({ search: event.target.value || null })
          }
        />
      </div>
      <div className="grid w-full gap-2 sm:w-48">
        <Label>Sort by</Label>
        <Select
          value={sort}
          onValueChange={(value) => updateParams({ sort: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently joined</SelectItem>
            <SelectItem value="likes">Most liked</SelectItem>
            <SelectItem value="books">Most books</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
