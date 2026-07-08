"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { X, ExternalLink } from "lucide-react";
import type { ApprovedAdWithStore } from "@/actions/get-ads";

type SlideState = "entering" | "visible" | "exiting";

export function AdSlideshow() {
  const { data: session } = useSession();
  const [ads, setAds] = useState<ApprovedAdWithStore[]>([]);
  const [index, setIndex] = useState(0);
  const [slideState, setSlideState] = useState<SlideState | null>(null);
  const [side, setSide] = useState<"left" | "right">("left");
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isStoreUser = session?.user?.isStore === true;
  const isLoggedIn = !!session?.user;

  useEffect(() => {
    if (!isLoggedIn || isStoreUser || dismissed) return;

    let cancelled = false;

    import("@/actions/get-ads").then(({ getApprovedAdsAction }) =>
      getApprovedAdsAction(),
    ).then((data) => {
      if (!cancelled && data.length > 0) {
        setAds(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, isStoreUser, dismissed]);

  const startSlideIn = useCallback((adIndex: number) => {
    setSide(adIndex % 2 === 0 ? "left" : "right");
    setSlideState("entering");

    timerRef.current = setTimeout(() => {
      setSlideState("visible");
    }, 50);
  }, []);

  useEffect(() => {
    if (ads.length === 0) return;
    startSlideIn(0);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ads, startSlideIn]);

  const advance = useCallback(() => {
    setSlideState("exiting");

    timerRef.current = setTimeout(() => {
      const nextIndex = index + 1;
      if (nextIndex >= ads.length) {
        setDismissed(true);
        return;
      }
      setIndex(nextIndex);
      startSlideIn(nextIndex);
    }, 400);
  }, [index, ads.length, startSlideIn]);

  useEffect(() => {
    if (slideState !== "visible") return;

    timerRef.current = setTimeout(advance, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [slideState, advance]);

  function handleDismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    advance();
  }

  if (dismissed || ads.length === 0 || !isLoggedIn || isStoreUser) {
    return null;
  }

  const ad = ads[index];
  if (!ad || slideState === null) return null;

  const isOffscreen = slideState === "entering" || slideState === "exiting";

  const translateX =
    slideState === "entering"
      ? side === "left"
        ? "-120%"
        : "120%"
      : slideState === "exiting"
        ? side === "left"
          ? "120%"
          : "-120%"
        : "0%";

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div
          className="pointer-events-auto relative overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900"
          style={{
            transform: `translateX(${translateX})`,
            opacity: isOffscreen ? 0 : 1,
            transition: "transform 0.4s ease-in-out, opacity 0.4s ease-in-out",
          }}
        >
          <div className="flex items-start gap-4 p-4">
            {ad.image ? (
              <img
                src={ad.image}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="font-medium text-stone-900 dark:text-stone-100">
                {ad.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
                {ad.text}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                {ad.storeName}
                {ad.storeCity ? ` \u2014 ${ad.storeCity}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-start gap-1">
              {ad.link ? (
                <a
                  href={ad.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-amber-700 dark:hover:bg-stone-800 dark:hover:text-amber-400"
                  aria-label="Open link"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
              <button
                type="button"
                onClick={handleDismiss}
                className="flex h-8 w-8 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
                aria-label="Dismiss ad"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="h-1 bg-stone-100 dark:bg-stone-800">
            <div
              className="h-full bg-amber-500"
              style={{
                width: slideState === "visible" ? "0%" : "100%",
                transition: slideState === "visible"
                  ? "width 5s linear"
                  : "width 0s linear",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
