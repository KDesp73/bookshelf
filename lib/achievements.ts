import { connectDB } from "@/lib/db";
import { Achievement, type IAchievement } from "@/models/Achievement";
import { UserAchievement } from "@/models/UserAchievement";
import { User, type IUser } from "@/models/User";
import { Book } from "@/models/Book";
import { CollectionLike } from "@/models/CollectionLike";
import type { AchievementConditionType } from "@/lib/constants";
import { comicReadWeight } from "@/lib/books/comic-weight";

export interface AchievementWithProgress extends IAchievement {
  _id: { toString(): string };
  earned: boolean;
  earnedAt?: string;
}

async function getUserStats(userId: string) {
  const [bookStats, likeCountResult, user] = await Promise.all([
    Book.aggregate<{
      bookCount: number;
      readCount: number;
      unreadCount: number;
      readingCount: number;
      ratedCount: number;
      wishlistCount: number;
    }>([
      { $match: { userId } },
      {
        $facet: {
          bookCount: [
            { $match: { isWishlist: { $ne: true } } },
            { $count: "count" },
          ],
          readCount: [
            { $match: { status: "Read" } },
            { $group: { _id: null, count: comicReadWeight() } },
          ],
          unreadCount: [
            { $match: { status: "Unread" } },
            { $count: "count" },
          ],
          readingCount: [
            { $match: { status: "Reading" } },
            { $count: "count" },
          ],
          ratedCount: [
            { $match: { rating: { $exists: true, $ne: null } } },
            { $count: "count" },
          ],
          wishlistCount: [
            { $match: { isWishlist: true } },
            { $count: "count" },
          ],
        },
      },
      {
        $project: {
          bookCount: { $ifNull: [{ $arrayElemAt: ["$bookCount.count", 0] }, 0] },
          readCount: { $ifNull: [{ $arrayElemAt: ["$readCount.count", 0] }, 0] },
          unreadCount: { $ifNull: [{ $arrayElemAt: ["$unreadCount.count", 0] }, 0] },
          readingCount: { $ifNull: [{ $arrayElemAt: ["$readingCount.count", 0] }, 0] },
          ratedCount: { $ifNull: [{ $arrayElemAt: ["$ratedCount.count", 0] }, 0] },
          wishlistCount: { $ifNull: [{ $arrayElemAt: ["$wishlistCount.count", 0] }, 0] },
        },
      },
    ]).then((r) => r[0] ?? {
      bookCount: 0, readCount: 0, unreadCount: 0,
      readingCount: 0, ratedCount: 0, wishlistCount: 0,
    }),
    CollectionLike.countDocuments({ targetUserId: userId }),
    User.findById(userId).select("createdAt").lean(),
  ]);

  const accountAgeDays = user?.createdAt
    ? Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      )
    : 0;

  return {
    books_added: bookStats.bookCount,
    books_read: bookStats.readCount,
    books_unread: bookStats.unreadCount,
    books_reading: bookStats.readingCount,
    books_rated: bookStats.ratedCount,
    books_wishlist: bookStats.wishlistCount,
    collection_likes: likeCountResult,
    account_age_days: accountAgeDays,
  } satisfies Record<AchievementConditionType, number>;
}

async function getUserStatsForUsers(
  userIds: string[],
): Promise<Map<string, Record<AchievementConditionType, number>>> {
  const [bookFacets, likeCounts, users] = await Promise.all([
    Book.aggregate<{
      _id: string;
      bookCount: number;
      readCount: number;
      unreadCount: number;
      readingCount: number;
      ratedCount: number;
      wishlistCount: number;
    }>([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: "$userId",
          bookCount: { $sum: { $cond: [{ $ne: ["$isWishlist", true] }, 1, 0] } },
          readCount: { $sum: { $cond: [{ $eq: ["$status", "Read"] }, 1, 0] } },
          unreadCount: { $sum: { $cond: [{ $eq: ["$status", "Unread"] }, 1, 0] } },
          readingCount: { $sum: { $cond: [{ $eq: ["$status", "Reading"] }, 1, 0] } },
          ratedCount: { $sum: { $cond: [{ $ne: ["$rating", null] }, 1, 0] } },
          wishlistCount: { $sum: { $cond: [{ $eq: ["$isWishlist", true] }, 1, 0] } },
        },
      },
    ]),
    CollectionLike.aggregate<{ _id: string; count: number }>([
      { $match: { targetUserId: { $in: userIds } } },
      { $group: { _id: "$targetUserId", count: { $sum: 1 } } },
    ]),
    User.find({ _id: { $in: userIds } }).select("_id createdAt").lean(),
  ]);

  const likeMap = new Map(likeCounts.map((l) => [l._id, l.count]));
  const userMap = new Map(
    users.map((u) => [(u as IUser & { _id: { toString(): string } })._id.toString(), u]),
  );
  const facetMap = new Map(bookFacets.map((f) => [f._id, f]));

  const result = new Map<string, Record<AchievementConditionType, number>>();
  for (const id of userIds) {
    const facet = facetMap.get(id);
    const user = userMap.get(id) as { createdAt?: Date } | undefined;
    const accountAgeDays = user?.createdAt
      ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    result.set(id, {
      books_added: facet?.bookCount ?? 0,
      books_read: facet?.readCount ?? 0,
      books_unread: facet?.unreadCount ?? 0,
      books_reading: facet?.readingCount ?? 0,
      books_rated: facet?.ratedCount ?? 0,
      books_wishlist: facet?.wishlistCount ?? 0,
      collection_likes: likeMap.get(id) ?? 0,
      account_age_days: accountAgeDays,
    });
  }
  return result;
}

export async function checkAndAwardAchievements(userId: string) {
  await connectDB();

  const earnedIds = (
    await UserAchievement.find({ userId }).select("achievementId").lean()
  ).map((ua) => ua.achievementId);

  const allAchievements = await Achievement.find({}).lean();
  const pending = allAchievements.filter(
    (a) => !earnedIds.includes(a._id.toString()),
  );

  if (pending.length === 0) return [];

  const stats = await getUserStats(userId);

  const newlyEarned: { achievementId: string }[] = [];

  for (const achievement of pending) {
    const achieved =
      stats[achievement.conditionType as AchievementConditionType] >=
      achievement.conditionValue;
    if (achieved) {
      newlyEarned.push({ achievementId: achievement._id.toString() });
    }
  }

  if (newlyEarned.length > 0) {
    await UserAchievement.insertMany(
      newlyEarned.map((ne) => ({ userId, achievementId: ne.achievementId })),
      { ordered: false },
    );
  }

  return newlyEarned;
}

export async function getUserAchievements(
  userId: string,
): Promise<AchievementWithProgress[]> {
  await connectDB();

  const [achievements, userAchievements] = await Promise.all([
    Achievement.find({}).sort({ conditionType: 1, conditionValue: 1 }).lean(),
    UserAchievement.find({ userId }).lean(),
  ]);

  const earnedMap = new Map(
    userAchievements.map((ua) => [ua.achievementId, ua.earnedAt.toISOString()]),
  );

  return achievements.map((a) => ({
    ...a,
    _id: a._id as { toString(): string },
    earned: earnedMap.has(a._id.toString()),
    earnedAt: earnedMap.get(a._id.toString()),
  }));
}

export async function getAllAchievements() {
  await connectDB();
  return Achievement.find({}).sort({ createdAt: -1 }).lean();
}

export async function getAchievementById(id: string) {
  await connectDB();
  return Achievement.findById(id).lean();
}

export async function deleteAchievement(id: string) {
  await connectDB();
  await UserAchievement.deleteMany({ achievementId: id });
  return Achievement.deleteOne({ _id: id });
}

export async function awardAllAchievements() {
  await connectDB();

  const allAchievements = await Achievement.find({}).lean();
  if (allAchievements.length === 0) return { awarded: 0, total: 0 };

  const allUsers = await User.find({}).select("_id createdAt").lean();
  const userIds = allUsers.map((u) => u._id.toString());

  // Bulk fetch all existing UserAchievements
  const allUserAchievements = await UserAchievement.find({
    userId: { $in: userIds },
  }).select("userId achievementId").lean();
  const earnedSet = new Set(
    allUserAchievements.map((ua) => `${ua.userId}:${ua.achievementId}`),
  );

  // Bulk fetch stats for all users
  const allStats = await getUserStatsForUsers(userIds);
  const toInsert: { userId: string; achievementId: string }[] = [];

  for (const user of allUsers) {
    const userId = user._id.toString();

    for (const achievement of allAchievements) {
      const key = `${userId}:${achievement._id.toString()}`;
      if (earnedSet.has(key)) continue;

      const stats = allStats.get(userId);
      if (!stats) continue;

      const achieved =
        stats[achievement.conditionType as AchievementConditionType] >=
        achievement.conditionValue;
      if (achieved) {
        toInsert.push({
          userId,
          achievementId: achievement._id.toString(),
        });
      }
    }
  }

  if (toInsert.length > 0) {
    await UserAchievement.insertMany(toInsert, { ordered: false });
  }

  return { awarded: toInsert.length, total: allUsers.length };
}

export async function syncAllAchievements() {
  await connectDB();

  const allAchievements = await Achievement.find({}).lean();
  if (allAchievements.length === 0) return { awarded: 0, revoked: 0 };

  const allUsers = await User.find({}).select("_id createdAt").lean();
  const userIds = allUsers.map((u) => u._id.toString());

  // Bulk fetch all existing UserAchievements
  const allUserAchievements = await UserAchievement.find({
    userId: { $in: userIds },
  }).select("userId achievementId").lean();
  const earnedMap = new Map<string, Set<string>>();
  for (const ua of allUserAchievements) {
    const set = earnedMap.get(ua.userId);
    if (set) {
      set.add(ua.achievementId);
    } else {
      earnedMap.set(ua.userId, new Set([ua.achievementId]));
    }
  }

  // Bulk fetch stats for all users
  const allStats = await getUserStatsForUsers(userIds);
  const toAward: { userId: string; achievementId: string }[] = [];
  const toRevokeByUser = new Map<string, string[]>();

  for (const user of allUsers) {
    const userId = user._id.toString();
    const earnedIds = earnedMap.get(userId) ?? new Set();
    const stats = allStats.get(userId);
    if (!stats) continue;

    for (const achievement of allAchievements) {
      const qualifies =
        stats[achievement.conditionType as AchievementConditionType] >=
        achievement.conditionValue;
      const hasIt = earnedIds.has(achievement._id.toString());

      if (qualifies && !hasIt) {
        toAward.push({ userId, achievementId: achievement._id.toString() });
      } else if (!qualifies && hasIt) {
        const list = toRevokeByUser.get(userId) ?? [];
        list.push(achievement._id.toString());
        toRevokeByUser.set(userId, list);
      }
    }
  }

  let totalAwarded = 0;
  let totalRevoked = 0;

  if (toAward.length > 0) {
    await UserAchievement.insertMany(toAward, { ordered: false });
    totalAwarded = toAward.length;
  }

  for (const [userId, achievementIds] of toRevokeByUser) {
    await UserAchievement.deleteMany({
      userId,
      achievementId: { $in: achievementIds },
    });
    totalRevoked += achievementIds.length;
  }

  return { awarded: totalAwarded, revoked: totalRevoked };
}

export async function createAchievement(data: {
  name: string;
  description: string;
  badge?: string;
  conditionType: AchievementConditionType;
  conditionValue: number;
}) {
  await connectDB();
  return Achievement.create({
    name: data.name,
    description: data.description,
    badge: data.badge,
    conditionType: data.conditionType,
    conditionValue: data.conditionValue,
  });
}

export async function updateAchievement(
  id: string,
  data: {
    name?: string;
    description?: string;
    badge?: string;
    conditionType?: AchievementConditionType;
    conditionValue?: number;
  },
) {
  await connectDB();
  return Achievement.findByIdAndUpdate(id, {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.badge !== undefined && { badge: data.badge }),
    ...(data.conditionType !== undefined && { conditionType: data.conditionType }),
    ...(data.conditionValue !== undefined && { conditionValue: data.conditionValue }),
  }, { new: true }).lean();
}
