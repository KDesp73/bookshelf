import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40",
        className,
      )}
    >
      <div className="mb-4">
        <h2 className="font-serif text-lg font-semibold text-amber-950 dark:text-amber-100">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
