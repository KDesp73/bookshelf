import { connectDB } from "@/lib/db";
import { Ad } from "@/models/Ad";
import { Book } from "@/models/Book";
import { BlogPost } from "@/models/BlogPost";
import { BlogReaction } from "@/models/BlogReaction";
import { CollectionLike } from "@/models/CollectionLike";
import { LoginChallenge } from "@/models/LoginChallenge";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { StoreBook } from "@/models/StoreBook";
import { User, type IUser } from "@/models/User";
import { UserAchievement } from "@/models/UserAchievement";
import type { AdminStats, AdminStoreRow, AdminUserRow } from "@/types/user";

export async function getAdminStats(): Promise<AdminStats> {
  await connectDB();
  const [userCount, bookCount, likeCount, storeCount] = await Promise.all([
    User.countDocuments(),
    Book.countDocuments(),
    CollectionLike.countDocuments(),
    User.countDocuments({ isStore: true }),
  ]);
  return { userCount, bookCount, likeCount, storeCount };
}

export async function listAllUsers(search?: string): Promise<AdminUserRow[]> {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (search?.trim()) {
    const term = search.trim();
    query.$or = [
      { email: { $regex: term, $options: "i" } },
      { username: { $regex: term, $options: "i" } },
      { name: { $regex: term, $options: "i" } },
    ];
  }

  const users = await User.find(query).sort({ createdAt: -1 }).lean();
  const userIds = users.map((user) => user._id.toString());

  const [bookCounts, likeCounts] = await Promise.all([
    Book.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    CollectionLike.aggregate<{ _id: string; count: number }>([
      { $match: { targetUserId: { $in: userIds } } },
      { $group: { _id: "$targetUserId", count: { $sum: 1 } } },
    ]),
  ]);

  const bookCountMap = new Map(bookCounts.map((item) => [item._id, item.count]));
  const likeCountMap = new Map(likeCounts.map((item) => [item._id, item.count]));

  return users.map((user) => {
    const typedUser = user as IUser & { _id: { toString(): string } };
    const id = typedUser._id.toString();
    return {
      _id: id,
      email: typedUser.email,
      name: typedUser.name ?? undefined,
      username: typedUser.username ?? undefined,
      isAdmin: typedUser.isAdmin ?? false,
      bookCount: bookCountMap.get(id) ?? 0,
      likeCount: likeCountMap.get(id) ?? 0,
      createdAt: typedUser.createdAt.toISOString(),
    };
  });
}

export async function listAllStores(search?: string): Promise<AdminStoreRow[]> {
  await connectDB();

  const query: Record<string, unknown> = { isStore: true };
  if (search?.trim()) {
    const term = search.trim();
    query.$or = [
      { email: { $regex: term, $options: "i" } },
      { username: { $regex: term, $options: "i" } },
      { storeName: { $regex: term, $options: "i" } },
      { storeCity: { $regex: term, $options: "i" } },
    ];
  }

  const users = await User.find(query).sort({ createdAt: -1 }).lean();
  const userIds = users.map((user) => user._id.toString());

  const [storeBookCounts, adCounts] = await Promise.all([
    StoreBook.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    Ad.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
  ]);

  const bookCountMap = new Map(storeBookCounts.map((item) => [item._id, item.count]));
  const adCountMap = new Map(adCounts.map((item) => [item._id, item.count]));

  return users.map((user) => {
    const typedUser = user as IUser & { _id: { toString(): string } };
    const id = typedUser._id.toString();
    return {
      _id: id,
      email: typedUser.email,
      name: typedUser.name ?? undefined,
      username: typedUser.username ?? undefined,
      storeName: typedUser.storeName ?? undefined,
      storeCity: typedUser.storeCity ?? undefined,
      storePhone: typedUser.storePhone ?? undefined,
      storeWebsite: typedUser.storeWebsite ?? undefined,
      storeBookCount: bookCountMap.get(id) ?? 0,
      adCount: adCountMap.get(id) ?? 0,
      createdAt: typedUser.createdAt.toISOString(),
    };
  });
}

export async function deleteUserAndData(userId: string): Promise<boolean> {
  await connectDB();
  const result = await User.deleteOne({ _id: userId });
  if (result.deletedCount === 0) return false;

  await Promise.all([
    Book.deleteMany({ userId }),
    BlogPost.deleteMany({ authorId: userId }),
    BlogReaction.deleteMany({ userId }),
    CollectionLike.deleteMany({
      $or: [{ likerId: userId }, { targetUserId: userId }],
    }),
    LoginChallenge.deleteMany({ userId }),
    PasswordResetToken.deleteMany({ userId }),
    UserAchievement.deleteMany({ userId }),
    StoreBook.deleteMany({ userId }),
    Ad.deleteMany({ userId }),
  ]);

  return true;
}
