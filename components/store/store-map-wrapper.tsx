"use client";

import dynamic from "next/dynamic";
import type { StoreListItem } from "@/types/store";

const StoreMapInner = dynamic(
  () => import("@/components/store/store-map").then((m) => ({ default: m.StoreMap })),
  { ssr: false, loading: () => <div className="h-[400px] animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" /> },
);

interface StoreMapWrapperProps {
  stores: StoreListItem[];
}

export function StoreMapWrapper({ stores }: StoreMapWrapperProps) {
  return <StoreMapInner stores={stores} />;
}
