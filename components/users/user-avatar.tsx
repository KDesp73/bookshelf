import { cn } from "@/lib/utils";
import {
  getInitial,
  resolveAvatarType,
  type AvatarUser,
} from "@/lib/users/avatar";
import { identiconDataUrl } from "@/lib/users/identicon";

interface UserAvatarProps {
  user: AvatarUser;
  className?: string;
  identiconSize?: number;
}

export function UserAvatar({
  user,
  className,
  identiconSize = 64,
}: UserAvatarProps) {
  const avatarType = resolveAvatarType(user);
  const baseClass = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-100",
    className,
  );

  if (avatarType === "image" && user.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt=""
        className={cn(baseClass, "object-cover")}
      />
    );
  }

  if (avatarType === "initial") {
    return (
      <div className={baseClass} aria-hidden>
        {getInitial(user)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={identiconDataUrl(user._id, identiconSize)}
      alt=""
      className={cn(baseClass, "object-cover")}
    />
  );
}
