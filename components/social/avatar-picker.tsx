"use client";

import { useRef, useState } from "react";
import type { AvatarType } from "@/lib/constants";
import type { UserProfile } from "@/types/user";
import { UserAvatar } from "@/components/users/user-avatar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface AvatarPickerProps {
  user: UserProfile;
  disabled?: boolean;
}

const OPTIONS: { type: AvatarType; label: string; description: string }[] = [
  {
    type: "identicon",
    label: "Unique icon",
    description: "A geometric pattern unique to your account",
  },
  {
    type: "initial",
    label: "Letter",
    description: "Your first initial on a colored background",
  },
  {
    type: "image",
    label: "Photo",
    description: "Upload a picture from your device",
  },
];

export function AvatarPicker({ user, disabled }: AvatarPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarType, setAvatarType] = useState<AvatarType>(
    user.avatarType ?? (user.image ? "image" : "identicon"),
  );
  const [previewImage, setPreviewImage] = useState<string | undefined>(
    user.avatarType === "image" || (!user.avatarType && user.image)
      ? user.image
      : undefined,
  );

  const previewUser = {
    _id: user._id,
    name: user.name,
    username: user.username,
    avatarType,
    image: avatarType === "image" ? previewImage : undefined,
  };

  function handleTypeChange(type: AvatarType) {
    setAvatarType(type);
    if (type === "image") {
      fileInputRef.current?.click();
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreviewImage(reader.result);
        setAvatarType("image");
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3">
      <Label>Profile picture</Label>

      <div className="flex items-center gap-4">
        <UserAvatar user={previewUser} className="h-16 w-16 text-xl" />
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Choose how you appear across BookShelf.
        </p>
      </div>

      <input type="hidden" name="avatarType" value={avatarType} />

      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const selected = avatarType === option.type;
          return (
            <button
              key={option.type}
              type="button"
              disabled={disabled}
              onClick={() => handleTypeChange(option.type)}
              className={cn(
                "rounded-lg border px-3 py-3 text-left transition-colors",
                selected
                  ? "border-amber-700 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/40"
                  : "border-stone-200 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-900",
              )}
            >
              <UserAvatar
                user={{
                  _id: user._id,
                  name: user.name,
                  username: user.username,
                  avatarType: option.type,
                  image:
                    option.type === "image"
                      ? previewImage ?? user.image
                      : undefined,
                }}
                className="mb-2 h-10 w-10 text-sm"
              />
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                {option.label}
              </p>
              <p className="mt-1 text-xs text-stone-500">{option.description}</p>
            </button>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        name="avatarFile"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {avatarType === "image" ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
          >
            Choose a different photo
          </button>
          {!previewImage ? (
            <p className="text-xs text-stone-500">
              Select a JPEG, PNG, WebP, or GIF up to 512 KB.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
