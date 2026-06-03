import type { IUser } from "@/models/User";
import type { ShelfAppearance } from "@/types/shelf";
import { normalizeShelfAppearance } from "@/lib/shelf/presets";

export function getShelfAppearance(
  user: Pick<
    IUser,
    "shelfPreset" | "shelfAccent" | "shelfBackground" | "shelfCustomCss"
  >,
): ShelfAppearance {
  return normalizeShelfAppearance({
    preset: user.shelfPreset ?? "default",
    accentColor: user.shelfAccent ?? undefined,
    backgroundColor: user.shelfBackground ?? undefined,
    customCss: user.shelfCustomCss ?? undefined,
  });
}
