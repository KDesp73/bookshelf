"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminUserSearchProps {
  initialSearch: string;
}

export function AdminUserSearch({ initialSearch }: AdminUserSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      startTransition(() => {
        router.push(`/admin/users?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <div className="grid max-w-md gap-2">
      <Label htmlFor="admin-user-search">Search users</Label>
      <Input
        id="admin-user-search"
        defaultValue={initialSearch}
        key={initialSearch}
        placeholder="Email, username, or name…"
        onChange={(event) => updateSearch(event.target.value)}
      />
    </div>
  );
}
