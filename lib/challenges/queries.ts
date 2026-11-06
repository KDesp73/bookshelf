import "server-only";
import { connectDB } from "@/lib/db";
import { Book } from "@/models/Book";
import { ReadingChallenge } from "@/models/ReadingChallenge";

export function getCurrentChallengeYear(): number {
  return new Date().getUTCFullYear();
}

export interface ReadingChallengeSummary {
  year: number;
  target: number | null;
  readCount: number;
}

/**
 * Counts books finished in a calendar year. Books marked Read before the
 * `finishedAt` field existed fall back to their original added date.
 */
export async function countBooksFinishedInYear(
  userId: string,
  year: number,
): Promise<number> {
  await connectDB();

  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  return Book.countDocuments({
    userId,
    isWishlist: { $ne: true },
    status: "Read",
    $or: [
      { finishedAt: { $gte: start, $lt: end } },
      { finishedAt: null, dateAdded: { $gte: start, $lt: end } },
    ],
  });
}

export async function getReadingChallengeSummary(
  userId: string,
  year = getCurrentChallengeYear(),
): Promise<ReadingChallengeSummary> {
  await connectDB();

  const [challenge, readCount] = await Promise.all([
    ReadingChallenge.findOne({ userId, year }).lean(),
    countBooksFinishedInYear(userId, year),
  ]);

  return {
    year,
    target: challenge?.target ?? null,
    readCount,
  };
}
