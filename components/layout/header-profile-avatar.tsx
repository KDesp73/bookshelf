"use client";

import { useEffect, useState } from "react";
import type { AvatarUser } from "@/lib/users/avatar";
import type { AvatarType } from "@/lib/constants";
import { UserAvatar } from "@/components/users/user-avatar";

interface HeaderProfileAvatarProps {
  userId: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
  avatarType?: AvatarType | null;
  className?: string;
}

export function HeaderProfileAvatar({
  userId,
  name,
  username,
  image,
  avatarType,
  className,
}: HeaderProfileAvatarProps) {
  const [avatarUser, setAvatarUser] = useState<AvatarUser>({
    _id: userId,
    name,
    username,
    image: image ?? undefined,
    avatarType: avatarType ?? undefined,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadAvatar() {
      try {
        const response = await fetch("/api/me/summary");
        if (!response.ok) return;

        const data = (await response.json()) as AvatarUser & { id: string };
        if (cancelled) return;

        setAvatarUser({
          _id: data.id,
          name: data.name,
          username: data.username,
          image: data.image,
          avatarType: data.avatarType,
        });
      } catch {
        /* keep identicon fallback */
      }
    }

    if (!image) {
      void loadAvatar();
    }

    return () => {
      cancelled = true;
    };
  }, [userId, image]);

  return <UserAvatar user={avatarUser} className={className} />;
}
