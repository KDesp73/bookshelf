import { getReadingChallengeSummary } from "@/lib/challenges/queries";
import { ReadingChallengeCard } from "@/components/challenge/reading-challenge-card";

interface ReadingChallengeSectionProps {
  userId: string;
  /** Owners can set, edit, and remove the goal. */
  editable?: boolean;
  /** Render the card even when no goal has been set yet. */
  showWhenUnset?: boolean;
}

export async function ReadingChallengeSection({
  userId,
  editable = false,
  showWhenUnset = false,
}: ReadingChallengeSectionProps) {
  // A database hiccup should not take down the whole page.
  const summary = await getReadingChallengeSummary(userId).catch(() => null);

  if (!summary) {
    return null;
  }

  if (!showWhenUnset && summary.target === null) {
    return null;
  }

  return (
    <ReadingChallengeCard
      year={summary.year}
      target={summary.target}
      readCount={summary.readCount}
      editable={editable}
    />
  );
}
