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
import { cn } from "@/lib/utils";

function TabButton({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
          : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800",
      )}
    >
      {label}
    </a>
  );
}

export function DiscoverFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const tab = searchParams.get("tab") ?? "collections";
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

  const tabHref = (t: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    return `/discover?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
        <TabButton
          active={tab === "collections"}
          href={tabHref("collections")}
          label="Collections"
        />
        <TabButton
          active={tab === "books"}
          href={tabHref("books")}
          label="Recent books"
        />
      </div>

      {tab === "collections" ? (
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
      ) : null}
    </div>
  );
}
