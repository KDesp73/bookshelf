"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Palette, Upload } from "lucide-react";
import { updateShelfAppearanceAction } from "@/actions/shelf-appearance";
import type { UserProfile } from "@/types/user";
import { SHELF_PRESETS, type ShelfPreset } from "@/types/shelf";
import { SHELF_PRESET_VARS } from "@/lib/shelf/presets";
import { ShelfThemeWrapper } from "@/components/shelf/shelf-theme-wrapper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PRESET_LABELS: Record<ShelfPreset, string> = {
  default: "Classic",
  warm: "Warm",
  forest: "Forest",
  ocean: "Ocean",
  midnight: "Midnight",
  rose: "Rose",
};

interface ShelfAppearanceDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShelfAppearanceDialog({
  user,
  open,
  onOpenChange,
}: ShelfAppearanceDialogProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateShelfAppearanceAction,
    {},
  );
  const [preset, setPreset] = useState<ShelfPreset>(user.shelfAppearance.preset);
  const [accentColor, setAccentColor] = useState(
    user.shelfAppearance.accentColor ?? "",
  );
  const [backgroundColor, setBackgroundColor] = useState(
    user.shelfAppearance.backgroundColor ?? "",
  );
  const [customCss, setCustomCss] = useState(
    user.shelfAppearance.customCss ?? "",
  );

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.success, onOpenChange, router]);

  const previewAppearance = useMemo(
    () => ({
      preset,
      accentColor: accentColor || undefined,
      backgroundColor: backgroundColor || undefined,
      customCss: customCss || undefined,
    }),
    [preset, accentColor, backgroundColor, customCss],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">Customize shelf</DialogTitle>
        </DialogHeader>

        <form
          key={JSON.stringify(user.shelfAppearance)}
          action={formAction}
          className="space-y-5"
        >
          <input type="hidden" name="shelfPreset" value={preset} />
          <input type="hidden" name="shelfAccent" value={accentColor} />
          <input type="hidden" name="shelfBackground" value={backgroundColor} />
          <input type="hidden" name="shelfCustomCss" value={customCss} />

          <div className="space-y-2">
            <Label>Preset</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SHELF_PRESETS.map((option) => {
                const vars = SHELF_PRESET_VARS[option];
                const selected = preset === option;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={pending}
                    onClick={() => setPreset(option)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      selected
                        ? "border-amber-700 ring-2 ring-amber-500/30"
                        : "border-stone-200 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-900",
                    )}
                  >
                    <div
                      className="mb-2 h-10 rounded-md border"
                      style={{
                        background: `linear-gradient(135deg, ${vars.background}, ${vars.accentSoft})`,
                        borderColor: vars.border,
                      }}
                    />
                    <span className="text-sm font-medium">{PRESET_LABELS[option]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="shelf-accent">Accent color</Label>
              <Input
                id="shelf-accent"
                value={accentColor}
                onChange={(event) => setAccentColor(event.target.value)}
                placeholder="#92400e"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shelf-background">Background color</Label>
              <Input
                id="shelf-background"
                value={backgroundColor}
                onChange={(event) => setBackgroundColor(event.target.value)}
                placeholder="#f6f1ea"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="shelf-custom-css">Custom CSS</Label>
            <Textarea
              id="shelf-custom-css"
              rows={8}
              value={customCss}
              onChange={(event) => setCustomCss(event.target.value)}
              placeholder={`.shelf-header { border-radius: 1rem; }\n.shelf-title { letter-spacing: 0.02em; }`}
              className="font-mono text-xs"
            />
            <p className="text-xs text-stone-500">
              Target classes like <code>.shelf-header</code>,{" "}
              <code>.shelf-title</code>, <code>.shelf-stats</code>,{" "}
              <code>.shelf-grid</code>, and <code>.shelf-card</code>.
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
              <Upload className="h-4 w-4" />
              Import CSS file
              <input
                type="file"
                name="shelfCssFile"
                accept=".css,text/css"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setCustomCss(await file.text());
                }}
              />
            </label>
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            {user.username ? (
              <ShelfThemeWrapper
                username={user.username}
                appearance={previewAppearance}
                className="p-4"
              >
                <div className="shelf-header rounded-xl border p-4">
                  <h3 className="shelf-title font-serif text-lg font-semibold">
                    {user.name ?? user.username}
                  </h3>
                  <p className="shelf-stats mt-1 text-sm">12 books · 3 likes</p>
                </div>
                <div className="shelf-grid mt-3 grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="shelf-card aspect-[2/3] rounded-md border"
                    />
                  ))}
                </div>
              </ShelfThemeWrapper>
            ) : null}
          </div>

          {state.error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save appearance"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
