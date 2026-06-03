"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateUserAsAdminAction } from "@/actions/admin";
import type { UserProfile } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AdminUserFormProps {
  user: UserProfile;
}

export function AdminUserForm({ user }: AdminUserFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(user.name ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [bio, setBio] = useState(user.bio ?? "");

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateUserAsAdminAction(user._id, {
        name,
        username,
        bio,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/60 p-6 dark:border-stone-700 dark:bg-stone-900/40">
      <h2 className="font-serif text-lg font-semibold">Profile</h2>
      <p className="mt-1 text-sm text-stone-500">{user.email}</p>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="admin-name">Name</Label>
          <Input
            id="admin-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-username">Username</Label>
          <Input
            id="admin-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-bio">Bio</Label>
          <Textarea
            id="admin-bio"
            value={bio}
            rows={3}
            maxLength={280}
            onChange={(event) => setBio(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
        {user.username ? (
          <Button variant="outline" asChild>
            <Link href={`/u/${user.username}`} target="_blank">
              View public profile
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
