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

async function fetchOpenLibraryTrending(): Promise<RecommendationItem[]> {
  try {
    const res = await fetch(
      "https://openlibrary.org/trending/daily.json?limit=12",
      {
        next: { revalidate: 86400 },
        headers: { "User-Agent": "BookShelf/1.0 (personal library app)" },
      },
    );
    if (!res.ok) return [];

    const data = (await res.json()) as {
      works?: Array<{
        title?: string;
        author_names?: string[];
        cover_id?: number;
        key?: string;
        first_publish_year?: number;
        description?: string | { value: string };
        subjects?: string[];
        isbns?: string[];
      }>;
    };

    if (!data.works?.length) return [];

    return data.works.slice(0, 8).map((work): RecommendationItem => {
      const desc =
        typeof work.description === "object"
          ? work.description.value
          : work.description;
      const isbn = work.isbns?.find((i) => i.length === 13) ?? null;
      return {
        title: work.title ?? "Unknown",
        authors: work.author_names ?? [],
        coverUrl: work.cover_id
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`
          : undefined,
        description: desc ?? undefined,
        isbn13: isbn ?? undefined,
        source: "openlibrary",
        reason: "Trending on OpenLibrary",
      };
    });
  } catch {
    return [];
  }
}

async function fetchOpenLibrarySearchFallback(): Promise<RecommendationItem[]> {
  const queries = [
    "fiction", "science fiction", "fantasy", "mystery",
    "romance", "history", "philosophy", "classic literature",
  ];
  const query = queries[Math.floor(Math.random() * queries.length)];

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&sort=rating`,
      {
        next: { revalidate: 86400 },
        headers: { "User-Agent": "BookShelf/1.0 (personal library app)" },
      },
    );
    if (!res.ok) return [];

    const data = (await res.json()) as {
      docs?: Array<{
        title?: string;
        author_name?: string[];
        cover_i?: number;
        isbn?: string[];
        first_publish_year?: number;
        subject?: string[];
      }>;
    };

    if (!data.docs?.length) return [];

    return data.docs.slice(0, 8).map((doc): RecommendationItem => {
      const isbn = doc.isbn?.find((i) => i.length === 13) ?? doc.isbn?.[0] ?? null;
      return {
        title: doc.title ?? "Unknown",
        authors: doc.author_name ?? [],
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : undefined,
        isbn13: isbn ?? undefined,
        source: "openlibrary",
        reason: `Popular in ${query}`,
      };
    });
  } catch {
    return [];
  }
}

async function getOpenLibraryRecommendations(): Promise<RecommendationItem[]> {
  const trending = await fetchOpenLibraryTrending();
  if (trending.length > 0) return trending;
  return fetchOpenLibrarySearchFallback();
}

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
    .limit(20)
    .lean();

  if (candidateBooks.length === 0) return [];

  const shuffled = candidateBooks.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 4);

  return picked.map((book) => {
    const b = book as LeanBook;
    const owner = userMap.get(b.userId);
    const sharedGenres = genreOverlapMap.get(b.userId) ?? [];
    const topGenres = sharedGenres.slice(0, 2);
    const reason =
      topGenres.length > 0
        ? `Because you both read ${topGenres.join(" & ")}`
        : "From a similar collection";

    return {
      title: b.title,
      authors: b.authors ?? [],
      coverUrl: b.coverUrl ?? undefined,
      description: b.description ?? undefined,
      isbn13: b.isbn13,
      source: "community" as const,
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

  const [communityItems, openLibraryItems] = await Promise.all([
    getCommunityRecommendations(userId),
    getOpenLibraryRecommendations(),
  ]);

  const allItems = [...communityItems, ...openLibraryItems];

  if (allItems.length > 0) {
    await RecommendationModel.create({
      userId,
      date: today,
      items: allItems,
    });
  }

  return allItems;
}
