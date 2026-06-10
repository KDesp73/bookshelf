"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RefreshDashboardButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Button onClick={handleRefresh} disabled={pending} variant="outline" size="sm">
      <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Refreshing…" : "Refresh"}
    </Button>
  );
}
