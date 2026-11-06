import Link from "next/link";
import { Compass, Lightbulb, Newspaper, Trophy } from "lucide-react";
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
    <nav
      aria-label="Community sections"
      className="grid grid-cols-2 gap-1.5 rounded-2xl border border-stone-200/80 bg-white/60 p-1.5 shadow-sm backdrop-blur sm:inline-flex dark:border-stone-800 dark:bg-stone-900/50"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={`/community?tab=${tab.id}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-amber-800 text-amber-50 shadow-sm dark:bg-amber-900/70 dark:text-amber-100 dark:ring-1 dark:ring-amber-700/60"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-transform group-hover:scale-110",
                isActive
                  ? "text-amber-200 dark:text-amber-300"
                  : "text-stone-400 group-hover:text-amber-700 dark:group-hover:text-amber-300",
              )}
            />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
