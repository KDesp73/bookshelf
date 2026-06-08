import { connectDB } from "@/lib/db";
import { Achievement, type IAchievement } from "@/models/Achievement";
import { UserAchievement } from "@/models/UserAchievement";
import { Book } from "@/models/Book";
import { CollectionLike } from "@/models/CollectionLike";
import type { AchievementConditionType } from "@/lib/constants";

export interface AchievementWithProgress extends IAchievement {
  _id: { toString(): string };
  earned: boolean;
  earnedAt?: string;
}

async function getUserStats(userId: string) {
  const [bookCount, readCount, ratedCount, likeCountResult] = await Promise.all([
    Book.countDocuments({ userId }),
    Book.countDocuments({ userId, status: "Read" }),
    Book.countDocuments({ userId, rating: { $exists: true, $ne: null } }),
    CollectionLike.countDocuments({ targetUserId: userId }),
  ]);

  return {
    books_added: bookCount,
    books_read: readCount,
    books_rated: ratedCount,
    collection_likes: likeCountResult,
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
