"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ImagePlus, Upload, X } from "lucide-react";
import { convertToStoreAction, updateStoreInfoAction } from "@/actions/store-settings";
import type { StoreSettingsState } from "@/actions/store-settings";
import type { SessionUser } from "@/lib/auth/get-session-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StoreConvertFormProps {
  user: SessionUser;
}

export function StoreConvertForm({ user }: StoreConvertFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isStore, setIsStore] = useState(user.isStore);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imageInputs, setImageInputs] = useState<string[]>(
    user.storeImages?.length ? user.storeImages : [],
  );
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const action = isStore ? updateStoreInfoAction : convertToStoreAction;

    try {
      const result: StoreSettingsState = await action({}, formData);
      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }
      setSuccess(true);
      if (!isStore) {
        setIsStore(true);
        await update();
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Try again.");
    }

    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="storeName">
          Store name {isStore ? "" : "(required to convert)"}
        </Label>
        <Input
          id="storeName"
          name="storeName"
          required
          defaultValue={user.storeName ?? ""}
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="storeDescription">Description (optional)</Label>
        <Textarea
          id="storeDescription"
          name="storeDescription"
          rows={3}
          defaultValue={user.storeDescription ?? ""}
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="storeAddress">Address (optional)</Label>
        <Input
          id="storeAddress"
          name="storeAddress"
          defaultValue={user.storeAddress ?? ""}
          disabled={pending}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="storePhone">Phone (optional)</Label>
        <Input
          id="storePhone"
          name="storePhone"
          type="tel"
          defaultValue={user.storePhone ?? ""}
          disabled={pending}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="storePostalCode">Postal code (optional)</Label>
          <Input
            id="storePostalCode"
            name="storePostalCode"
            defaultValue={user.storePostalCode ?? ""}
            disabled={pending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="storeCity">City (optional)</Label>
          <Input
            id="storeCity"
            name="storeCity"
            defaultValue={user.storeCity ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="storeWebsite">Website (optional)</Label>
        <Input
          id="storeWebsite"
          name="storeWebsite"
          type="url"
          placeholder="https://example.com"
          defaultValue={user.storeWebsite ?? ""}
          disabled={pending}
        />
      </div>

      {isStore ? (
        <div className="grid gap-2">
          <Label>Images (optional)</Label>
          <p className="text-xs text-stone-500">
            Add store photos — paste a URL or upload a file.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const dataUri = ev.target?.result as string;
                setImageInputs((prev) => [...prev, dataUri]);
              };
              reader.readAsDataURL(file);
              e.target.value = "";
            }}
          />

          {imageInputs.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {imageInputs.map((dataUri, index) => (
                <div key={index} className="relative h-24 w-24 shrink-0">
                  <img
                    src={dataUri}
                    alt={`Store image ${index + 1}`}
                    className="h-full w-full rounded-lg border border-stone-200 object-cover dark:border-stone-700"
                  />
                  <input type="hidden" name="storeImages" value={dataUri} />
                  <button
                    type="button"
                    onClick={() => {
                      const next = imageInputs.filter((_, i) => i !== index);
                      setImageInputs(next);
                    }}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/photo.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={pending}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (urlInput.trim()) {
                  setImageInputs((prev) => [...prev, urlInput.trim()]);
                  setUrlInput("");
                }
              }}
              disabled={pending || !urlInput.trim()}
            >
              <ImagePlus className="h-4 w-4" />
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
          {imageInputs.length === 0 ? (
            <p className="text-sm text-stone-400">No images yet.</p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {success ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          {isStore
            ? "Store information updated."
            : "Account converted to store! You can now manage books and ads from the store dashboard."}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? "Saving\u2026"
          : isStore
            ? "Update store info"
            : "Convert to store account"}
      </Button>
    </form>
  );
}
