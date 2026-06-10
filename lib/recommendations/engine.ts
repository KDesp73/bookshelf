import "server-only";
import { connectDB } from "@/lib/db";
import { Book, type IBook } from "@/models/Book";
import { User } from "@/models/User";
import { RecommendationModel } from "@/models/Recommendation";
import type { RecommendationItem } from "@/types/recommendation";

function getToday(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

type LeanBook = IBook & { _id: { toString(): string } };

async function getCommunityRecommendations(
  userId: string,
): Promise<RecommendationItem[]> {
  await connectDB();

  const userBooks = await Book.find({
    userId,
    isWishlist: { $ne: true },
  }).lean();

  if (userBooks.length === 0) return [];

  const userGenres = [
    ...new Set(
      userBooks.flatMap((b) => (b as LeanBook).genres ?? []),
    ),
  ].filter(Boolean);

  if (userGenres.length === 0) return [];

  const userIsbns = new Set(userBooks.map((b) => (b as LeanBook).isbn13));

  const similarUsers = await Book.aggregate<
    { _id: string; overlapCount: number; sharedGenres: string[] }
  >([
    {
      $match: {
        userId: { $ne: userId },
        genres: { $in: userGenres },
        isWishlist: { $ne: true },
      },
    },
    { $unwind: "$genres" },
    { $match: { genres: { $in: userGenres } } },
    {
      $group: {
        _id: "$userId",
        overlapCount: { $sum: 1 },
        sharedGenres: { $addToSet: "$genres" },
      },
    },
    { $sort: { overlapCount: -1 } },
    { $limit: 5 },
  ]);

  if (similarUsers.length === 0) return [];

  const similarUserIds = similarUsers.map((u) => u._id);

  const userMap = new Map(
    (
      await User.find({ _id: { $in: similarUserIds } })
        .select("username name")
        .lean()
    ).map((u) => [
      (u as { _id: { toString(): string }; username?: string; name?: string })._id.toString(),
      u as { _id: { toString(): string }; username?: string; name?: string },
    ]),
  );

  const genreOverlapMap = new Map(
    similarUsers.map((u) => [u._id, u.sharedGenres]),
  );

  const candidateBooks = await Book.find({
    userId: { $in: similarUserIds },
    isbn13: { $nin: [...userIsbns] },
    isWishlist: { $ne: true },
    coverUrl: { $exists: true, $ne: "" },
  })
    .sort({ dateAdded: -1 })
    .limit(30)
    .lean();

  if (candidateBooks.length === 0) return [];

  const shuffled = candidateBooks.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 8);

  return picked.map((book) => {
    const b = book as LeanBook;
    const owner = userMap.get(b.userId);
    const sharedGenres = genreOverlapMap.get(b.userId) ?? [];
    const topGenres = sharedGenres
      .filter((g) => g.length <= 25)
      .slice(0, 2);
    const reason =
      topGenres.length > 0
        ? `Both of you enjoy ${topGenres.join(" & ")}`
        : "From a similar collection";

    return {
      title: b.title,
      authors: b.authors ?? [],
      coverUrl: b.coverUrl ?? undefined,
      description: b.description ?? undefined,
      isbn13: b.isbn13,
      source: "community",
      reason,
      fromUserId: b.userId,
      fromUsername: owner?.username ?? undefined,
      fromUserDisplayName: owner?.name ?? undefined,
    };
  });
}

export async function getDailyRecommendations(
  userId: string,
): Promise<RecommendationItem[]> {
  await connectDB();

  const today = getToday();

  const existing = await RecommendationModel.findOne({
    userId,
    date: today,
  }).lean();

  if (existing) {
    return (existing as {
      items: RecommendationItem[];
    }).items;
  }

  const items = await getCommunityRecommendations(userId);

  if (items.length > 0) {
    await RecommendationModel.create({
      userId,
      date: today,
      items,
    });
  }

  return items;
}
