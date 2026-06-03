"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value?: number;
  onChange?: (value: number | undefined) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
  showValue?: boolean;
}

function formatRating(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  showValue = true,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  function getFillAmount(starNumber: number): number {
    if (displayValue == null) return 0;
    if (displayValue >= starNumber) return 1;
    if (displayValue >= starNumber - 0.5) return 0.5;
    return 0;
  }

  function handleSelect(starNumber: number, isLeftHalf: boolean) {
    if (readOnly || !onChange) return;
    const nextValue = isLeftHalf ? starNumber - 0.5 : starNumber;
    onChange(nextValue === value ? undefined : nextValue);
  }

  return (
    <div
      className={cn("inline-flex items-center gap-2", readOnly && "pointer-events-none")}
      onMouseLeave={() => !readOnly && setHoverValue(null)}
    >
      <div className="inline-flex">
        {Array.from({ length: 5 }).map((_, index) => {
          const starNumber = index + 1;
          const fillAmount = getFillAmount(starNumber);

          return (
            <button
              key={starNumber}
              type="button"
              disabled={readOnly}
              className="relative p-0.5 disabled:cursor-default"
              aria-label={`Rate ${starNumber} stars`}
              onMouseMove={(event) => {
                if (readOnly) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const isLeftHalf = event.clientX - rect.left < rect.width / 2;
                setHoverValue(isLeftHalf ? starNumber - 0.5 : starNumber);
              }}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const isLeftHalf = event.clientX - rect.left < rect.width / 2;
                handleSelect(starNumber, isLeftHalf);
              }}
            >
              <Star className={cn(starSize, "text-stone-300 dark:text-stone-600")} />
              <div
                className="absolute inset-y-0 left-0 overflow-hidden p-0.5"
                style={{ width: `${fillAmount * 100}%` }}
              >
                <Star className={cn(starSize, "fill-amber-500 text-amber-500")} />
              </div>
            </button>
          );
        })}
      </div>
      {showValue && displayValue != null ? (
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {formatRating(displayValue)}
        </span>
      ) : null}
    </div>
  );
}
