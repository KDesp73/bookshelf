"use server";

import { connectDB } from "@/lib/db";
import { Ad } from "@/models/Ad";
import { User } from "@/models/User";
import type { AdDocument } from "@/types/ad";

export type ApprovedAdWithStore = AdDocument & {
  storeName: string;
  storeCity?: string;
};

export async function getApprovedAdsAction(): Promise<ApprovedAdWithStore[]> {
  try {
    await connectDB();

    const ads = await Ad.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (ads.length === 0) return [];

    const userIds = [...new Set(ads.map((ad) => ad.userId.toString()))];
    const stores = await User.find({ _id: { $in: userIds } })
      .select("storeName storeCity")
      .lean();

    const storeMap = new Map(
      stores.map((s) => [
        s._id.toString(),
        {
          storeName: (s as Record<string, unknown>).storeName as string,
          storeCity: (s as Record<string, unknown>).storeCity as string | undefined,
        },
      ]),
    );

    return ads.map((ad) => {
      const store = storeMap.get(ad.userId.toString());
      return {
        _id: ad._id.toString(),
        userId: ad.userId.toString(),
        title: ad.title,
        text: ad.text,
        image: ad.image ?? undefined,
        link: ad.link ?? undefined,
        status: ad.status as "approved",
        createdAt: ad.createdAt.toISOString(),
        updatedAt: ad.updatedAt.toISOString(),
        storeName: store?.storeName ?? "Unknown store",
        storeCity: store?.storeCity,
      };
    });
  } catch {
    return [];
  }
}
