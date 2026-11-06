"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Search, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  icon: Icon,
}: {
  active: boolean;
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none",
        active
          ? "bg-amber-100 text-amber-900 shadow-sm dark:bg-amber-900/40 dark:text-amber-100"
          : "text-stone-600 hover:bg-white/70 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900/60 dark:hover:text-stone-100",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

interface DiscoverFiltersProps {
  basePath?: string;
  subTabKey?: string;
}

export function DiscoverFilters({
  basePath = "/discover",
  subTabKey = "tab",
}: DiscoverFiltersProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const tab = searchParams.get(subTabKey) ?? "collections";
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
        router.push(`${basePath}?${params.toString()}`);
      });
    },
    [router, searchParams, basePath],
  );

  const tabHref = (t: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(subTabKey, t);
    return `${basePath}?${params.toString()}`;
  };

  const [searchValue, setSearchValue] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateParams({ search: value || null });
      }, 350);
    },
    [updateParams],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full gap-1 rounded-xl border border-stone-200/80 bg-stone-100/70 p-1 sm:w-auto dark:border-stone-700 dark:bg-stone-800/60">
          <TabButton
            active={tab === "collections"}
            href={tabHref("collections")}
            label="Collections"
            icon={Users}
          />
          <TabButton
            active={tab === "books"}
            href={tabHref("books")}
            label="Recent books"
            icon={BookOpen}
          />
        </div>

        {tab === "collections" ? (
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Label htmlFor="discover-search" className="sr-only">
                Search users
              </Label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                id="discover-search"
                value={searchValue}
                placeholder="Search by username…"
                className="pl-9"
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </div>
            <div className="w-full sm:w-44">
              <Label htmlFor="discover-sort" className="sr-only">
                Sort users
              </Label>
              <Select
                value={sort}
                onValueChange={(value) => updateParams({ sort: value })}
              >
                <SelectTrigger id="discover-sort" aria-label="Sort users">
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
    </div>
  );
}
