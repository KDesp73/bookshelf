"use client";

import { useEffect, useRef, useState } from "react";
import { submitAdAction, updateAdAction } from "@/actions/store-ads";
import { ExternalLink, X } from "lucide-react";
import type { AdActionState } from "@/types/ad";
import type { AdDocument } from "@/types/ad";
import { StoreImagePicker } from "@/components/store/store-image-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StoreAdFormProps {
  ad?: AdDocument;
  onDone?: () => void;
}

export function StoreAdForm({ ad, onDone }: StoreAdFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState(ad?.image ?? "");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [progressStart, setProgressStart] = useState(false);
  const isEditing = !!ad;

  useEffect(() => {
    if (!previewOpen) {
      setProgressStart(false);
      return;
    }
    const t = setTimeout(() => setProgressStart(true), 50);
    return () => clearTimeout(t);
  }, [previewOpen]);

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

  function getFormValues() {
    if (!formRef.current) return { title: "", text: "", link: "" };
    const data = new FormData(formRef.current);
    return {
      title: (data.get("title") as string) ?? "",
      text: (data.get("text") as string) ?? "",
      link: (data.get("link") as string) ?? "",
    };
  }

  const preview = previewOpen ? getFormValues() : null;

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending
              ? "Saving\u2026"
              : isEditing
                ? "Update ad"
                : "Submit ad"}
          </Button>
        </div>
      </form>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ad preview</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-stone-500">
            This is how your ad will appear to logged-in users.
          </p>

          <div className="rounded-xl border border-stone-200/80 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900">
            <div className="flex items-start gap-4 p-4">
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : null}

              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  {preview?.title || "(no title)"}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
                  {preview?.text || "(no text)"}
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  Your store name
                </p>
              </div>

              <div className="flex shrink-0 items-start gap-1">
                {preview?.link ? (
                  <a
                    href={preview.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-amber-700 dark:hover:bg-stone-800 dark:hover:text-amber-400"
                    aria-label="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
                  aria-label="Close preview"
                  onClick={() => setPreviewOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="h-1 bg-stone-100 dark:bg-stone-800">
              <div
                className="h-full bg-amber-500"
                style={{
                  width: progressStart ? "0%" : "100%",
                  transition: progressStart
                    ? "width 5s linear"
                    : "width 0s linear",
                }}
              />
            </div>
          </div>

          <p className="text-xs text-stone-400">
            Ads slide in from alternating sides, stay for 5 seconds, then slide
            out. Users can dismiss them with the close button.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
