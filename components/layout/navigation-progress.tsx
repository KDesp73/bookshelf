"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isModifiedClick(event: MouseEvent): boolean {
  return (
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.button !== 0
  );
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const currentUrlRef = useRef("");

  useEffect(() => {
    const nextUrl = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;
    if (currentUrlRef.current && currentUrlRef.current !== nextUrl) {
      setActive(false);
    }
    currentUrlRef.current = nextUrl;
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (isModifiedClick(event)) return;

      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor?.href) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      const current = `${window.location.pathname}${window.location.search}`;
      const next = `${destination.pathname}${destination.search}`;
      if (next === current) return;

      setActive(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-amber-200/40 dark:bg-amber-900/40"
      role="progressbar"
      aria-label="Loading page"
    >
      <div className="navigation-progress-bar h-full w-1/3 bg-amber-700 dark:bg-amber-400" />
    </div>
  );
}
