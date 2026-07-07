"use client";

import { useState } from "react";
import { submitAdAction, updateAdAction } from "@/actions/store-ads";
import type { AdActionState } from "@/types/ad";
import type { AdDocument } from "@/types/ad";
import { StoreImagePicker } from "@/components/store/store-image-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StoreAdFormProps {
  ad?: AdDocument;
  onDone?: () => void;
}

export function StoreAdForm({ ad, onDone }: StoreAdFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState(ad?.image ?? "");
  const isEditing = !!ad;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    if (isEditing && ad) {
      formData.set("adId", ad._id);
    }
    formData.set("image", image);

    const action = isEditing ? updateAdAction : submitAdAction;

    try {
      const result: AdActionState = await action({}, formData);

      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }

      onDone?.();
    } catch {
      setError("Something went wrong. Try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Ad title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={ad?.title ?? ""}
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="text">Ad text</Label>
        <Textarea
          id="text"
          name="text"
          rows={3}
          required
          defaultValue={ad?.text ?? ""}
          disabled={pending}
        />
      </div>

      <StoreImagePicker
        value={image}
        onChange={setImage}
        label="Image"
      />

      <div className="grid gap-2">
        <Label htmlFor="link">Link URL (optional)</Label>
        <Input
          id="link"
          name="link"
          type="url"
          defaultValue={ad?.link ?? ""}
          disabled={pending}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? "Saving\u2026"
          : isEditing
            ? "Update ad"
            : "Submit ad"}
      </Button>
    </form>
  );
}
