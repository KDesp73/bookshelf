import { connectDB } from "@/lib/db";
import { Book, type IBook } from "@/models/Book";
import { CollectionLike } from "@/models/CollectionLike";
import { UserAchievement } from "@/models/UserAchievement";
import { User, type IUser } from "@/models/User";
import type { AvatarType } from "@/lib/constants";
import { getShelfAppearance } from "@/lib/shelf/appearance";
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

  const allMatchingUsers = await User.find(matchQuery)
    .select("_id createdAt")
    .lean();

  if (allMatchingUsers.length === 0) {
    return { items: [], hasMore: false };
  }

  const userIdToCreatedAt = new Map(
    allMatchingUsers.map((u) => [
      (u as IUser & { _id: { toString(): string } })._id.toString(),
      (u as IUser & { _id: { toString(): string } }).createdAt,
    ]),
  );

  const allIds = Array.from(userIdToCreatedAt.keys());

  if (sort === "likes") {
    const likeCounts = await CollectionLike.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { targetUserId: { $in: allIds } } },
      { $group: { _id: "$targetUserId", count: { $sum: 1 } } },
    ]);
    const likeMap = new Map(likeCounts.map((l) => [l._id, l.count]));
    allIds.sort(
      (a, b) => (likeMap.get(b) ?? 0) - (likeMap.get(a) ?? 0),
    );
  } else if (sort === "books") {
    const bookCounts = await Book.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: allIds }, isWishlist: { $ne: true } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const bookMap = new Map(bookCounts.map((b) => [b._id, b.count]));
    allIds.sort(
      (a, b) => (bookMap.get(b) ?? 0) - (bookMap.get(a) ?? 0),
    );
  } else {
    allIds.sort(
      (a, b) =>
        userIdToCreatedAt.get(b)!.getTime() -
        userIdToCreatedAt.get(a)!.getTime(),
    );
  }

  const paginatedIds = allIds.slice(skip, skip + limit);
  const hasMore = skip + limit < allIds.length;

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
      { $group: { _id: "$userId", count: { $sum: 1 } } },
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

  const allUsers = await User.find({ username: { $exists: true, $ne: null } })
    .select("_id")
    .lean();

  if (allUsers.length === 0) {
    return { items: [], hasMore: false };
  }

  const allIds = allUsers.map((u) =>
    (u as IUser & { _id: { toString(): string } })._id.toString(),
  );

  const [allBookCounts, allReadCounts, allLikeCounts, allAchievementCounts] = await Promise.all([
    Book.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: allIds }, isWishlist: { $ne: true } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    Book.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: allIds }, status: "Read" } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    CollectionLike.aggregate<{ _id: string; count: number }>([
      { $match: { targetUserId: { $in: allIds } } },
      { $group: { _id: "$targetUserId", count: { $sum: 1 } } },
    ]),
    UserAchievement.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: allIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
  ]);

  const bookMap = new Map(allBookCounts.map((c) => [c._id, c.count]));
  const readMap = new Map(allReadCounts.map((c) => [c._id, c.count]));
  const likeMap = new Map(allLikeCounts.map((c) => [c._id, c.count]));
  const achievementMap = new Map(allAchievementCounts.map((c) => [c._id, c.count]));

  const allStats = new Map<string, { bookCount: number; readCount: number; likeCount: number; achievementCount: number }>();
  for (const id of allIds) {
    allStats.set(id, {
      bookCount: bookMap.get(id) ?? 0,
      readCount: readMap.get(id) ?? 0,
      likeCount: likeMap.get(id) ?? 0,
      achievementCount: achievementMap.get(id) ?? 0,
    });
  }

  allIds.sort((a, b) => {
    const valA = computeSortValue(sort, allStats.get(a)!);
    const valB = computeSortValue(sort, allStats.get(b)!);
    return valB - valA;
  });

  const paginatedIds = allIds.slice(skip, skip + limit);
  const hasMore = skip + limit < allIds.length;

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

  const [bookCounts, readCounts, likeCounts, achievementCounts] = await Promise.all([
    Book.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: paginatedIds }, isWishlist: { $ne: true } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    Book.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: paginatedIds }, status: "Read" } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
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
        authors: b.authors ?? [],
        coverUrl: b.coverUrl ?? undefined,
        userId: b.userId,
        username: user.username,
        userDisplayName: user.name ?? undefined,
        dateAdded: b.dateAdded.toISOString(),
      };
    })
    .filter(Boolean) as DiscoverBook[];

  return items;
}
