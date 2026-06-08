import { connectDB } from "@/lib/db";
import { Achievement, type IAchievement } from "@/models/Achievement";
import { UserAchievement } from "@/models/UserAchievement";
import { User } from "@/models/User";
import { Book } from "@/models/Book";
import { CollectionLike } from "@/models/CollectionLike";
import type { AchievementConditionType } from "@/lib/constants";

export interface AchievementWithProgress extends IAchievement {
  _id: { toString(): string };
  earned: boolean;
  earnedAt?: string;
}

async function getUserStats(userId: string) {
  const [bookCount, readCount, unreadCount, readingCount, ratedCount, wishlistCount, likeCountResult, user] =
    await Promise.all([
      Book.countDocuments({ userId, isWishlist: { $ne: true } }),
      Book.countDocuments({ userId, status: "Read" }),
      Book.countDocuments({ userId, status: "Unread" }),
      Book.countDocuments({ userId, status: "Reading" }),
      Book.countDocuments({ userId, rating: { $exists: true, $ne: null } }),
      Book.countDocuments({ userId, isWishlist: true }),
      CollectionLike.countDocuments({ targetUserId: userId }),
      User.findById(userId).select("createdAt").lean(),
    ]);

  const accountAgeDays = user?.createdAt
    ? Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      )
    : 0;

  return {
    books_added: bookCount,
    books_read: readCount,
    books_unread: unreadCount,
    books_reading: readingCount,
    books_rated: ratedCount,
    books_wishlist: wishlistCount,
    collection_likes: likeCountResult,
    account_age_days: accountAgeDays,
  } satisfies Record<AchievementConditionType, number>;
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
  let totalAwarded = 0;

  for (const user of allUsers) {
    const userId = user._id.toString();

    const earnedIds = (
      await UserAchievement.find({ userId }).select("achievementId").lean()
    ).map((ua) => ua.achievementId);

    const pending = allAchievements.filter(
      (a) => !earnedIds.includes(a._id.toString()),
    );
    if (pending.length === 0) continue;

    const stats = await getUserStats(userId);

    const newlyEarned: { userId: string; achievementId: string }[] = [];
    for (const achievement of pending) {
      const achieved =
        stats[achievement.conditionType as AchievementConditionType] >=
        achievement.conditionValue;
      if (achieved) {
        newlyEarned.push({
          userId,
          achievementId: achievement._id.toString(),
        });
      }
    }

    if (newlyEarned.length > 0) {
      await UserAchievement.insertMany(newlyEarned, { ordered: false });
      totalAwarded += newlyEarned.length;
    }
  }

  return { awarded: totalAwarded, total: allUsers.length };
}

export async function syncAllAchievements() {
  await connectDB();

  const allAchievements = await Achievement.find({}).lean();
  if (allAchievements.length === 0) return { awarded: 0, revoked: 0 };

  const allUsers = await User.find({}).select("_id createdAt").lean();
  let totalAwarded = 0;
  let totalRevoked = 0;

  for (const user of allUsers) {
    const userId = user._id.toString();

    const earnedRecords = await UserAchievement.find({ userId }).select("achievementId").lean();
    const earnedIds = new Set(earnedRecords.map((ua) => ua.achievementId));

    const stats = await getUserStats(userId);

    const toAward: { userId: string; achievementId: string }[] = [];
    const toRevoke: string[] = [];

    for (const achievement of allAchievements) {
      const qualifies =
        stats[achievement.conditionType as AchievementConditionType] >=
        achievement.conditionValue;
      const hasIt = earnedIds.has(achievement._id.toString());

      if (qualifies && !hasIt) {
        toAward.push({ userId, achievementId: achievement._id.toString() });
      } else if (!qualifies && hasIt) {
        toRevoke.push(achievement._id.toString());
      }
    }

    if (toAward.length > 0) {
      await UserAchievement.insertMany(toAward, { ordered: false });
      totalAwarded += toAward.length;
    }

    if (toRevoke.length > 0) {
      await UserAchievement.deleteMany({
        userId,
        achievementId: { $in: toRevoke },
      });
      totalRevoked += toRevoke.length;
    }
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
