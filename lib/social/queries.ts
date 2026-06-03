import { connectDB } from "@/lib/db";
import { Book } from "@/models/Book";
import { CollectionLike } from "@/models/CollectionLike";
import { User, type IUser } from "@/models/User";
import type { AvatarType } from "@/lib/constants";
import { getShelfAppearance } from "@/lib/shelf/appearance";
import type { DiscoverFilters, UserListItem } from "@/types/user";

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

export async function listUsers(
  filters: DiscoverFilters = {},
): Promise<UserListItem[]> {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (filters.search?.trim()) {
    query.username = {
      $regex: filters.search.trim(),
      $options: "i",
    };
  } else {
    query.username = { $exists: true, $ne: null };
  }

  const users = await User.find(query).sort({ createdAt: -1 }).lean();

  const userIds = users.map((user) => user._id.toString());

  const [bookCounts, likeCounts] = await Promise.all([
    Book.aggregate<{ _id: string; count: number }>([
      { $match: { userId: { $in: userIds }, isWishlist: { $ne: true } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]),
    CollectionLike.aggregate<{ _id: string; count: number }>([
      { $match: { targetUserId: { $in: userIds } } },
      { $group: { _id: "$targetUserId", count: { $sum: 1 } } },
    ]),
  ]);

  const bookCountMap = new Map(bookCounts.map((item) => [item._id, item.count]));
  const likeCountMap = new Map(likeCounts.map((item) => [item._id, item.count]));

  const items: UserListItem[] = users
    .filter((user) => user.username)
    .map((user) => {
      const typedUser = user as IUser & { _id: { toString(): string } };
      const id = typedUser._id.toString();
      return {
        _id: id,
        username: typedUser.username!,
        name: typedUser.name ?? undefined,
        image: typedUser.image ?? undefined,
        avatarType: (typedUser.avatarType as AvatarType | undefined) ?? undefined,
        bio: typedUser.bio ?? undefined,
        shelfAppearance: getShelfAppearance(typedUser),
        bookCount: bookCountMap.get(id) ?? 0,
        likeCount: likeCountMap.get(id) ?? 0,
        createdAt: typedUser.createdAt.toISOString(),
      };
    });

  const sort = filters.sort ?? "recent";

  items.sort((a, b) => {
    if (sort === "likes") return b.likeCount - a.likeCount;
    if (sort === "books") return b.bookCount - a.bookCount;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return items;
}
