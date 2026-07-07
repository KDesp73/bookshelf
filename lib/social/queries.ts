import { connectDB } from "@/lib/db";
import { Book, type IBook } from "@/models/Book";
import { CollectionLike } from "@/models/CollectionLike";
import { UserAchievement } from "@/models/UserAchievement";
import { User, type IUser } from "@/models/User";
import type { AvatarType } from "@/lib/constants";
import { getShelfAppearance } from "@/lib/shelf/appearance";
import { comicReadWeight } from "@/lib/books/comic-weight";
import type {
  CollectionLiker,
  DiscoverFilters,
  PaginatedResult,
  RankingSort,
  UserListItem,
} from "@/types/user";
import type { DiscoverBook } from "@/types/book";

export async function getLikeCount(userId: string): Promise<number> {
  await connectDB();
  return CollectionLike.countDocuments({ targetUserId: userId });
}

export async function hasLiked(
  likerId: string,
  targetUserId: string,
): Promise<boolean> {
  await connectDB();
  const like = await CollectionLike.findOne({ likerId, targetUserId }).lean();
  return !!like;
}

export async function listCollectionLikers(
  targetUserId: string,
  limit = 24,
): Promise<CollectionLiker[]> {
  await connectDB();

  const likes = await CollectionLike.find({ targetUserId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  if (likes.length === 0) return [];

  const likerIds = likes.map((like) => like.likerId);
  const users = await User.find({ _id: { $in: likerIds } })
    .select("name username image avatarType")
    .lean();

  const userMap = new Map(
    users.map((u) => [
      (u as IUser & { _id: { toString(): string } })._id.toString(),
      u as IUser & { _id: { toString(): string } },
    ]),
  );

  const likers: CollectionLiker[] = [];

  for (const like of likes) {
    const liker = userMap.get(like.likerId);
    if (!liker) continue;

    likers.push({
      _id: like.likerId,
      name: liker.name ?? undefined,
      username: liker.username ?? undefined,
      image: liker.image ?? undefined,
      avatarType: (liker.avatarType as AvatarType | undefined) ?? undefined,
      likedAt: like.createdAt.toISOString(),
    });
  }

  return likers;
}

export async function listUsers(
  filters: DiscoverFilters = {},
  page = 1,
  limit = 12,
): Promise<PaginatedResult<UserListItem>> {
  await connectDB();

  const sort = filters.sort ?? "recent";
  const skip = (page - 1) * limit;

  const matchQuery: Record<string, unknown> = {};
  if (filters.search?.trim()) {
    matchQuery.username = { $regex: filters.search.trim(), $options: "i" };
  } else {
    matchQuery.username = { $exists: true, $ne: null };
  }

  const total = await User.countDocuments(matchQuery);
  if (total === 0) {
    return { items: [], hasMore: false };
  }

  let paginatedIds: string[];
  let hasMore: boolean;

  if (sort === "likes" || sort === "books") {
    // For computed sorts, fetch only IDs for matching users, aggregate counts, then paginate.
    const allMatchingIds = (await User.find(matchQuery).select("_id").lean())
      .map((u) => (u as IUser & { _id: { toString(): string } })._id.toString());

    const countAgg = sort === "likes"
      ? await CollectionLike.aggregate<{ _id: string; count: number }>([
          { $match: { targetUserId: { $in: allMatchingIds } } },
          { $group: { _id: "$targetUserId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
      : await Book.aggregate<{ _id: string; count: number }>([
          { $match: { userId: { $in: allMatchingIds }, isWishlist: { $ne: true } } },
          { $group: { _id: "$userId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]);

    const sortedIds = countAgg.map((c) => c._id);
    // Append users with 0 count at the end
    const countedSet = new Set(sortedIds);
    for (const id of allMatchingIds) {
      if (!countedSet.has(id)) sortedIds.push(id);
    }

    paginatedIds = sortedIds.slice(skip, skip + limit);
    hasMore = skip + limit < sortedIds.length;
  } else {
    // "recent" sort — paginate directly in MongoDB
    const users = await User.find(matchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1) // Fetch one extra to determine hasMore
      .select("_id")
      .lean();

    const ids = users.map((u) =>
      (u as IUser & { _id: { toString(): string } })._id.toString(),
    );
    hasMore = ids.length > limit;
    paginatedIds = ids.slice(0, limit);
  }

  if (paginatedIds.length === 0) {
    return { items: [], hasMore: false };
  }

  const users = await User.find({ _id: { $in: paginatedIds } }).lean();
  const userMap = new Map(
    users.map((u) => [
      (u as IUser & { _id: { toString(): string } })._id.toString(),
      u as IUser & { _id: { toString(): string } },
    ]),
  );

  const orderedUsers = paginatedIds
    .map((id) => userMap.get(id))
    .filter(Boolean) as (IUser & { _id: { toString(): string } })[];

  const [bookCounts, readCounts, likeCounts, achievementCounts, coverAgg] = await Promise.all([
    Book.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: paginatedIds }, isWishlist: { $ne: true } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    Book.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: paginatedIds }, status: "Read" } },
      { $group: { _id: "$userId", count: comicReadWeight() } },
    ]),
    CollectionLike.aggregate<{ _id: string; count: number }>([
      { $match: { targetUserId: { $in: paginatedIds } } },
      { $group: { _id: "$targetUserId", count: { $sum: 1 } } },
    ]),
    UserAchievement.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: paginatedIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    Book.aggregate<{ _id: string; covers: string[] }>([
      {
        $match: {
          userId: { $in: paginatedIds },
          isWishlist: { $ne: true },
          coverUrl: { $exists: true, $ne: "" },
        },
      },
      { $sort: { dateAdded: -1 } },
      { $group: { _id: "$userId", covers: { $push: "$coverUrl" } } },
      { $project: { _id: 1, covers: { $slice: ["$covers", 4] } } },
    ]),
  ]);

  const bookCountMap = new Map(bookCounts.map((item) => [item._id, item.count]));
  const readCountMap = new Map(readCounts.map((item) => [item._id, item.count]));
  const likeCountMap = new Map(likeCounts.map((item) => [item._id, item.count]));
  const achievementCountMap = new Map(achievementCounts.map((item) => [item._id, item.count]));
  const coverMap = new Map(coverAgg.map((item) => [item._id, item.covers]));

  const items: UserListItem[] = orderedUsers
    .filter((user) => user.username)
    .map((user) => {
      const id = user._id.toString();
      return {
        _id: id,
        username: user.username!,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        avatarType: (user.avatarType as AvatarType | undefined) ?? undefined,
        bio: user.bio ?? undefined,
        shelfAppearance: getShelfAppearance(user),
        bookCount: bookCountMap.get(id) ?? 0,
        readCount: readCountMap.get(id) ?? 0,
        likeCount: likeCountMap.get(id) ?? 0,
        achievementCount: achievementCountMap.get(id) ?? 0,
        createdAt: user.createdAt.toISOString(),
        coverUrls: coverMap.get(id) ?? undefined,
      };
    });

  return { items, hasMore };
}

function computeSortValue(
  sort: RankingSort,
  stats: { bookCount: number; readCount: number; likeCount: number; achievementCount: number },
): number {
  switch (sort) {
    case "books_added":
      return stats.bookCount;
    case "books_read":
      return stats.readCount;
    case "likes":
      return stats.likeCount;
    case "achievements":
      return stats.achievementCount;
    case "overall":
      return stats.readCount * 4 + stats.achievementCount * 3 + stats.likeCount * 2 + stats.bookCount;
  }
}

export async function listRankedUsers(
  sort: RankingSort,
  page = 1,
  limit = 20,
): Promise<PaginatedResult<UserListItem>> {
  await connectDB();

  const skip = (page - 1) * limit;

  let paginatedIds: string[];
  let hasMore: boolean;

  if (sort === "books_added" || sort === "books_read" || sort === "likes" || sort === "achievements") {
    // Direct aggregation — push sort, skip, limit to MongoDB.
    const agg = sort === "books_added"
      ? await Book.aggregate<{ _id: string; count: number }>([
          { $match: { isWishlist: { $ne: true } } },
          { $group: { _id: "$userId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $skip: skip },
          { $limit: limit + 1 },
        ])
      : sort === "books_read"
        ? await Book.aggregate<{ _id: string; count: number }>([
            { $match: { status: "Read" } },
            { $group: { _id: "$userId", count: comicReadWeight() } },
            { $sort: { count: -1 } },
            { $skip: skip },
            { $limit: limit + 1 },
          ])
        : sort === "likes"
          ? await CollectionLike.aggregate<{ _id: string; count: number }>([
              { $group: { _id: "$targetUserId", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $skip: skip },
              { $limit: limit + 1 },
            ])
          : await UserAchievement.aggregate<{ _id: string; count: number }>([
              { $group: { _id: "$userId", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $skip: skip },
              { $limit: limit + 1 },
            ]);

    hasMore = agg.length > limit;
    paginatedIds = agg.slice(0, limit).map((r) => r._id);

    // Filter out any user IDs that don't exist anymore (soft-safety)
    if (paginatedIds.length === 0) {
      const allIds = agg.map((r) => r._id);
      // If aggregation returned results but all are invalid, return empty
      if (allIds.length === 0) return { items: [], hasMore: false };
    }
  } else {
    // "overall" — needs all stats to compute weighted score.
    const allUserIds = (await User.find({ username: { $exists: true, $ne: null } })
      .select("_id")
      .lean())
      .map((u) => (u as IUser & { _id: { toString(): string } })._id.toString());

    if (allUserIds.length === 0) return { items: [], hasMore: false };

    const [allBookCounts, allReadCounts, allLikeCounts, allAchievementCounts] = await Promise.all([
      Book.aggregate<{ _id: string; count: number }>([
        { $match: { userId: { $in: allUserIds }, isWishlist: { $ne: true } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
      ]),
      Book.aggregate<{ _id: string; count: number }>([
        { $match: { userId: { $in: allUserIds }, status: "Read" } },
        { $group: { _id: "$userId", count: comicReadWeight() } },
      ]),
      CollectionLike.aggregate<{ _id: string; count: number }>([
        { $match: { targetUserId: { $in: allUserIds } } },
        { $group: { _id: "$targetUserId", count: { $sum: 1 } } },
      ]),
      UserAchievement.aggregate<{ _id: string; count: number }>([
        { $match: { userId: { $in: allUserIds } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
      ]),
    ]);

    const bookMap = new Map(allBookCounts.map((c) => [c._id, c.count]));
    const readMap = new Map(allReadCounts.map((c) => [c._id, c.count]));
    const likeMap = new Map(allLikeCounts.map((c) => [c._id, c.count]));
    const achievementMap = new Map(allAchievementCounts.map((c) => [c._id, c.count]));

    const allStats = new Map<string, { bookCount: number; readCount: number; likeCount: number; achievementCount: number }>();
    for (const id of allUserIds) {
      allStats.set(id, {
        bookCount: bookMap.get(id) ?? 0,
        readCount: readMap.get(id) ?? 0,
        likeCount: likeMap.get(id) ?? 0,
        achievementCount: achievementMap.get(id) ?? 0,
      });
    }

    allUserIds.sort((a, b) => {
      const valA = computeSortValue(sort, allStats.get(a)!);
      const valB = computeSortValue(sort, allStats.get(b)!);
      return valB - valA;
    });

    paginatedIds = allUserIds.slice(skip, skip + limit);
    hasMore = skip + limit < allUserIds.length;

    if (paginatedIds.length === 0) {
      return { items: [], hasMore: false };
    }
  }

  const users = await User.find({ _id: { $in: paginatedIds } }).lean();
  const userMap = new Map(
    users.map((u) => [
      (u as IUser & { _id: { toString(): string } })._id.toString(),
      u as IUser & { _id: { toString(): string } },
    ]),
  );

  const orderedUsers = paginatedIds
    .map((id) => userMap.get(id))
    .filter(Boolean) as (IUser & { _id: { toString(): string } })[];

  const [bookCounts, readCounts, likeCounts, achievementCounts] = await Promise.all([
    Book.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: paginatedIds }, isWishlist: { $ne: true } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    Book.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: paginatedIds }, status: "Read" } },
      { $group: { _id: "$userId", count: comicReadWeight() } },
    ]),
    CollectionLike.aggregate<{ _id: string; count: number }>([
      { $match: { targetUserId: { $in: paginatedIds } } },
      { $group: { _id: "$targetUserId", count: { $sum: 1 } } },
    ]),
    UserAchievement.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: paginatedIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
  ]);

  const bookCountMap = new Map(bookCounts.map((item) => [item._id, item.count]));
  const readCountMap = new Map(readCounts.map((item) => [item._id, item.count]));
  const likeCountMap = new Map(likeCounts.map((item) => [item._id, item.count]));
  const achievementCountMap = new Map(achievementCounts.map((item) => [item._id, item.count]));

  const items: UserListItem[] = orderedUsers
    .filter((user) => user.username)
    .map((user) => {
      const id = user._id.toString();
      return {
        _id: id,
        username: user.username!,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        avatarType: (user.avatarType as AvatarType | undefined) ?? undefined,
        bio: user.bio ?? undefined,
        shelfAppearance: getShelfAppearance(user),
        bookCount: bookCountMap.get(id) ?? 0,
        readCount: readCountMap.get(id) ?? 0,
        likeCount: likeCountMap.get(id) ?? 0,
        achievementCount: achievementCountMap.get(id) ?? 0,
        createdAt: user.createdAt.toISOString(),
      };
    });

  return { items, hasMore };
}

export async function listRecentBooks(
  limit = 24,
): Promise<DiscoverBook[]> {
  await connectDB();

  const books = await Book.find({
    isWishlist: { $ne: true },
    coverUrl: { $exists: true, $ne: "" },
  })
    .sort({ dateAdded: -1 })
    .limit(limit)
    .lean();

  if (books.length === 0) return [];

  const userIds = [...new Set(books.map((b) => (b as IBook & { _id: { toString(): string } }).userId))];

  const users = await User.find({ _id: { $in: userIds } })
    .select("username name")
    .lean();

  const userMap = new Map(
    users.map((u) => [
      (u as IUser & { _id: { toString(): string } })._id.toString(),
      u as IUser & { _id: { toString(): string } },
    ]),
  );

  const items: DiscoverBook[] = books
    .map((book) => {
      const b = book as IBook & { _id: { toString(): string } };
      const user = userMap.get(b.userId);
      if (!user?.username) return null;
      return {
        _id: b._id.toString(),
        isbn13: b.isbn13,
        title: b.title,
        subtitle: b.subtitle,
        authors: b.authors ?? [],
        publisher: b.publisher,
        publishedDate: b.publishedDate,
        description: b.description,
        pageCount: b.pageCount,
        coverUrl: b.coverUrl ?? undefined,
        userId: b.userId,
        username: user.username,
        userDisplayName: user.name ?? undefined,
        dateAdded: b.dateAdded.toISOString(),
        status: b.status,
        tags: b.tags ?? [],
        rating: b.rating,
        isWishlist: b.isWishlist,
        notes: b.notes,
        isPublicNote: b.isPublicNote,
      };
    })
    .filter(Boolean) as DiscoverBook[];

  return items;
}
