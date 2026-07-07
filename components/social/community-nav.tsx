import Link from "next/link";
import { Compass, Lightbulb, Newspaper, Store, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "rankings", label: "Rankings", icon: Trophy },
  { id: "news", label: "News", icon: Newspaper },
  { id: "suggestions", label: "Suggestions", icon: Lightbulb },
] as const;

interface CommunityNavProps {
  activeTab: string;
}

export function CommunityNav({ activeTab }: CommunityNavProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={`/community?tab=${tab.id}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition",
              isActive
                ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
      <Link
        href="/stores"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition",
          "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800",
        )}
      >
        <Store className="h-4 w-4" />
        Stores
      </Link>
    </div>
  );
}
