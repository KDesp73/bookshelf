import { connectDB } from "@/lib/db";
import { UserAchievement } from "@/models/UserAchievement";

export const EASTER_EGGS = {
  easter_egg_konami: {
    id: "easter_egg_konami",
    name: "Konami Coder",
    description: "Entered the legendary Konami Code",
  },
  easter_egg_isbn: {
    id: "easter_egg_isbn",
    name: "Secret Shelf",
    description: "Added the secret ISBN to your collection",
  },
  easter_egg_logo: {
    id: "easter_egg_logo",
    name: "Persistent Reader",
    description: "Clicked the logo 10 times — persistence pays off",
  },
  easter_egg_42: {
    id: "easter_egg_42",
    name: "Answer to Everything",
    description: "Searched for the meaning of life, the universe, and everything",
  },
  easter_egg_midnight: {
    id: "easter_egg_midnight",
    name: "Midnight Oil",
    description: "Browsed the library between 2 and 4 AM",
  },
} as const;

export type EasterEggId = keyof typeof EASTER_EGGS;

export function isEasterEggId(id: string): id is EasterEggId {
  return id in EASTER_EGGS;
}

export const SECRET_ISBN = "9780000000002";

const EASTER_EGG_ID_SET = new Set(Object.keys(EASTER_EGGS));

export function isEasterEggIdAny(id: string): boolean {
  return EASTER_EGG_ID_SET.has(id);
}

export async function awardEasterEgg(userId: string, eggId: EasterEggId) {
  await connectDB();

  const existing = await UserAchievement.findOne({
    userId,
    achievementId: eggId,
  });

  if (existing) return false;

  await UserAchievement.create({
    userId,
    achievementId: eggId,
  });

  return true;
}

export async function hasEarnedEasterEgg(
  userId: string,
  eggId: EasterEggId,
): Promise<boolean> {
  await connectDB();
  const existing = await UserAchievement.findOne({
    userId,
    achievementId: eggId,
  });
  return !!existing;
}
